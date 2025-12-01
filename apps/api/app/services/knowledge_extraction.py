from sqlalchemy.orm import Session
from app.models.chat import ChatSession
from app.models.knowledge_entity import KnowledgeEntity
from app.services.llm.legacy_service import llm_service
import uuid
import logging
import json

logger = logging.getLogger(__name__)

class KnowledgeExtractionService:
    def extract_from_session(self, db: Session, session_id: uuid.UUID, tenant_id: uuid.UUID):
        """
        Extract knowledge entities from a chat session using LLM.
        """
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return

        # Prepare transcript
        transcript = ""
        for msg in session.messages:
            transcript += f"{msg.role}: {msg.content}\n"

        if not transcript:
            return

        # Prompt for extraction
        prompt = f"""
        Analyze the following chat transcript and extract key entities (people, companies, products, concepts) and facts.
        Return the result as a JSON list of objects with 'name', 'type', 'description', and 'confidence' (0.0-1.0).

        Transcript:
        {transcript[:4000]}  # Limit context window
        """

        try:
            # Use a cheap/fast model for this background task
            response = llm_service.get_completion(
                prompt=prompt,
                system_prompt="You are a knowledge extraction agent. Output valid JSON only.",
                temperature=0.0
            )

            # Parse JSON (naive)
            content = response.content
            # Try to find JSON block
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            entities_data = json.loads(content)

            for item in entities_data:
                # Check if entity exists
                existing = db.query(KnowledgeEntity).filter(
                    KnowledgeEntity.tenant_id == tenant_id,
                    KnowledgeEntity.name == item['name']
                ).first()

                if existing:
                    # Update confidence or attributes?
                    continue

                entity = KnowledgeEntity(
                    tenant_id=tenant_id,
                    name=item['name'],
                    entity_type=item.get('type', 'concept').lower(),
                    attributes={"description": item.get('description')},
                    confidence=item.get('confidence', 0.8),
                    source_agent_id=None # Could link to a "system" agent
                )
                db.add(entity)

            db.commit()
            logger.info(f"Extracted {len(entities_data)} entities from session {session_id}")

        except Exception as e:
            logger.error(f"Knowledge extraction failed: {e}")

knowledge_extraction_service = KnowledgeExtractionService()
