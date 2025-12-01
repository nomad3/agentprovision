"""
Temporal workflow for knowledge extraction
"""
from datetime import timedelta
from temporalio import workflow
from typing import Dict, Any

# Import activity definition
with workflow.unsafe.imports_passed_through():
    from app.workflows.activities.knowledge_extraction import extract_knowledge_from_session

@workflow.defn
class KnowledgeExtractionWorkflow:
    @workflow.run
    async def run(self, session_id: str, tenant_id: str) -> Dict[str, Any]:
        workflow.logger.info(f"Starting knowledge extraction workflow for session {session_id}")

        # Execute activity
        result = await workflow.execute_activity(
            extract_knowledge_from_session,
            args=[session_id, tenant_id],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=None # Use default retry policy
        )

        workflow.logger.info(f"Knowledge extraction completed: {result}")
        return result
