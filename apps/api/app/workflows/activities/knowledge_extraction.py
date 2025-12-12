"""
Temporal activities for knowledge extraction from chat sessions
"""
from temporalio import activity
from typing import Dict, Any
import json

from app.db.session import SessionLocal
from app.models.chat import ChatSession
from app.models.knowledge_entity import KnowledgeEntity
from app.services.llm.legacy_service import get_llm_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

@activity.defn
async def extract_knowledge_from_session(session_id: str, tenant_id: str) -> Dict[str, Any]:
    """
    Extract knowledge entities from a chat session using LLM.

    Args:
        session_id: UUID of the chat session
        tenant_id: UUID of the tenant

    Returns:
        Dict with extraction stats
    """
    activity.logger.info(f"Extracting knowledge from session {session_id}")

    db = SessionLocal()
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            activity.logger.warning(f"Session {session_id} not found")
            return {"status": "skipped", "reason": "session_not_found"}

        # Prepare transcript
        transcript = ""
        for msg in session.messages:
            transcript += f"{msg.role}: {msg.content}\n"

        if not transcript:
            return {"status": "skipped", "reason": "empty_transcript"}

        # Prompt for extraction
        prompt = f"""
        Analyze the following chat transcript and extract key entities (people, companies, products, concepts) and facts.
        Return the result as a JSON list of objects with 'name', 'type', 'description', and 'confidence' (0.0-1.0).

        Transcript:
        {transcript[:4000]}  # Limit context window
        """

        try:
            llm_service = get_llm_service()
        except ValueError:
            activity.logger.warning("LLM service not configured (missing API key). Skipping knowledge extraction.")
            return {"status": "skipped", "reason": "llm_not_configured"}

        # Use a cheap/fast model for this background task
        # Note: LLM calls are synchronous, so we might want to run this in a thread pool if it blocks too long,
        # but for now standard activity execution is fine as it runs in a separate worker thread/process usually.
        response = llm_service.generate_chat_response(
            user_message=prompt,
            conversation_history=[],
            system_prompt="You are a knowledge extraction agent. Output valid JSON only.",
            temperature=0.0
        )

        # Parse JSON (naive)
        content = response["text"]
        # Try to find JSON block
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        try:
            entities_data = json.loads(content)
        except json.JSONDecodeError:
            activity.logger.error(f"Failed to parse JSON from LLM response: {content[:100]}...")
            return {"status": "failed", "reason": "json_parse_error"}

        extracted_count = 0
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
                source_agent_id=None
            )
            db.add(entity)
            extracted_count += 1

        db.commit()
        activity.logger.info(f"Extracted {extracted_count} entities from session {session_id}")

        return {
            "status": "success",
            "extracted_count": extracted_count,
            "total_found": len(entities_data)
        }

    except Exception as e:
        activity.logger.error(f"Knowledge extraction failed: {e}")
        raise
    finally:
        db.close()
