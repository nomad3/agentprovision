"""Unified memory service for store/recall/forget/share operations"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.agent_memory import AgentMemory


class MemoryService:
    """
    Unified memory service for store/recall/forget/share operations.

    Provides a high-level interface for agent memory management,
    handling the three-tier memory system:
    - Tier 1: Hot context (PostgreSQL for now, Redis in production)
    - Tier 2: Semantic memory (vector embeddings)
    - Tier 3: Knowledge graph (permanent facts)
    """

    def __init__(self, db: Session):
        self.db = db

    def store(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        memory_type: str,
        content: str,
        importance: float = 0.5,
        source: str = None,
        source_task_id: uuid.UUID = None,
        embedding: List[float] = None,
        expires_at: datetime = None
    ) -> AgentMemory:
        """
        Store a new memory for an agent.

        Args:
            agent_id: Agent to store memory for
            tenant_id: Tenant for isolation
            memory_type: Type of memory (fact, experience, skill, preference, relationship, procedure)
            content: The memory content
            importance: Priority for recall (0-1)
            source: Where this memory came from
            source_task_id: Task that generated this memory
            embedding: Vector embedding for semantic search
            expires_at: When this memory expires (None = permanent)

        Returns:
            Created AgentMemory
        """
        memory = AgentMemory(
            agent_id=agent_id,
            tenant_id=tenant_id,
            memory_type=memory_type,
            content=content,
            importance=importance,
            source=source,
            source_task_id=source_task_id,
            embedding=embedding,
            expires_at=expires_at
        )
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        return memory

    def recall(self, memory_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[AgentMemory]:
        """
        Recall a specific memory by ID.
        Updates access count and last accessed timestamp.
        """
        memory = self.db.query(AgentMemory).filter(
            AgentMemory.id == memory_id,
            AgentMemory.tenant_id == tenant_id
        ).first()

        if memory:
            memory.access_count += 1
            memory.last_accessed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(memory)

        return memory

    def forget(self, memory_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
        """
        Delete a memory.
        Returns True if memory was deleted, False if not found.
        """
        memory = self.db.query(AgentMemory).filter(
            AgentMemory.id == memory_id,
            AgentMemory.tenant_id == tenant_id
        ).first()

        if not memory:
            return False

        self.db.delete(memory)
        self.db.commit()
        return True

    def share(
        self,
        from_agent_id: uuid.UUID,
        to_agent_id: uuid.UUID,
        memory_ids: List[uuid.UUID],
        tenant_id: uuid.UUID
    ) -> List[AgentMemory]:
        """
        Share memories from one agent to another.
        Creates copies of the memories for the target agent.
        """
        shared_memories = []

        for memory_id in memory_ids:
            original = self.db.query(AgentMemory).filter(
                AgentMemory.id == memory_id,
                AgentMemory.agent_id == from_agent_id,
                AgentMemory.tenant_id == tenant_id
            ).first()

            if original:
                # Create copy for target agent
                shared = AgentMemory(
                    agent_id=to_agent_id,
                    tenant_id=tenant_id,
                    memory_type=original.memory_type,
                    content=original.content,
                    embedding=original.embedding,
                    importance=original.importance * 0.8,  # Slightly lower importance for shared memories
                    source="shared",
                    expires_at=original.expires_at
                )
                self.db.add(shared)
                shared_memories.append(shared)

        self.db.commit()
        for memory in shared_memories:
            self.db.refresh(memory)

        return shared_memories

    def get_relevant_memories(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        memory_types: List[str] = None,
        limit: int = 10,
        min_importance: float = 0.0
    ) -> List[AgentMemory]:
        """
        Get the most relevant active memories for an agent.

        Args:
            agent_id: Agent to get memories for
            tenant_id: Tenant for isolation
            memory_types: Filter by memory types (None = all)
            limit: Maximum memories to return
            min_importance: Minimum importance threshold

        Returns:
            List of memories ordered by importance
        """
        query = self.db.query(AgentMemory).filter(
            AgentMemory.agent_id == agent_id,
            AgentMemory.tenant_id == tenant_id,
            AgentMemory.importance >= min_importance
        )

        # Filter expired
        query = query.filter(
            (AgentMemory.expires_at.is_(None)) | (AgentMemory.expires_at > datetime.utcnow())
        )

        if memory_types:
            query = query.filter(AgentMemory.memory_type.in_(memory_types))

        return query.order_by(AgentMemory.importance.desc()).limit(limit).all()

    def get_recent_memories(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        limit: int = 10
    ) -> List[AgentMemory]:
        """Get the most recently created/accessed memories."""
        return self.db.query(AgentMemory).filter(
            AgentMemory.agent_id == agent_id,
            AgentMemory.tenant_id == tenant_id
        ).order_by(AgentMemory.last_accessed_at.desc().nullsfirst()).limit(limit).all()

    def consolidate_memories(
        self,
        agent_id: uuid.UUID,
        tenant_id: uuid.UUID,
        min_access_count: int = 5
    ) -> int:
        """
        Consolidate frequently accessed memories by boosting their importance.
        Returns number of memories consolidated.
        """
        memories = self.db.query(AgentMemory).filter(
            AgentMemory.agent_id == agent_id,
            AgentMemory.tenant_id == tenant_id,
            AgentMemory.access_count >= min_access_count,
            AgentMemory.importance < 0.9
        ).all()

        count = 0
        for memory in memories:
            # Boost importance based on access frequency
            memory.importance = min(0.95, memory.importance + 0.1)
            count += 1

        self.db.commit()
        return count
