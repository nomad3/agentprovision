from datetime import timedelta
from typing import Dict, Any
from temporalio import workflow

# Import activity definition
with workflow.unsafe.imports_passed_through():
    from app.workflows.activities.agent_kit_execution import execute_agent_kit_activity

@workflow.defn
class AgentKitExecutionWorkflow:
    @workflow.run
    async def run(self, agent_kit_id: str, tenant_id: str, input_data: Dict[str, Any] = None) -> Dict[str, Any]:
        workflow.logger.info(f"AgentKitExecutionWorkflow started for kit {agent_kit_id}")

        # Execute the activity
        result = await workflow.execute_activity(
            execute_agent_kit_activity,
            args=[agent_kit_id, tenant_id, input_data],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=None # Add retry policy if needed
        )

        workflow.logger.info(f"AgentKitExecutionWorkflow completed with result: {result}")
        return result
