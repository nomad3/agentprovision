from __future__ import annotations

from typing import List, Tuple
import uuid

from sqlalchemy.orm import Session

from app.models.chat import ChatSession as ChatSessionModel, ChatMessage
from app.models.dataset import Dataset
from app.models.agent_kit import AgentKit
from app.schemas.agent_kit import AgentKitConfig
from app.services import datasets as dataset_service
from app.services import agent_kits as agent_kit_service
from app.services.llm import get_llm_service
from app.services.tool_executor import (
    get_tool_registry,
    SQLQueryTool,
    CalculatorTool,
    DataSummaryTool
)
from app.services.context_manager import get_context_manager


def list_sessions(db: Session, *, tenant_id: uuid.UUID) -> List[ChatSessionModel]:
    return (
        db.query(ChatSessionModel)
        .filter(ChatSessionModel.tenant_id == tenant_id)
        .order_by(ChatSessionModel.created_at.desc())
        .all()
    )


def get_session(db: Session, *, session_id: uuid.UUID, tenant_id: uuid.UUID) -> ChatSessionModel | None:
    session = db.query(ChatSessionModel).filter(ChatSessionModel.id == session_id).first()
    if session and str(session.tenant_id) == str(tenant_id):
        return session
    return None


def create_session(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    dataset_id: uuid.UUID,
    agent_kit_id: uuid.UUID,
    title: str | None = None,
) -> ChatSessionModel:
    dataset = dataset_service.get_dataset(db, dataset_id=dataset_id, tenant_id=tenant_id)
    if not dataset:
        raise ValueError("Dataset not found for tenant")

    agent_kit = agent_kit_service.get_agent_kit(db, agent_kit_id=agent_kit_id)
    if not agent_kit or str(agent_kit.tenant_id) != str(tenant_id):
        raise ValueError("Agent kit not found for tenant")

    session = ChatSessionModel(
        title=title or f"{agent_kit.name} on {dataset.name}",
        dataset_id=dataset.id,
        agent_kit_id=agent_kit.id,
        tenant_id=tenant_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _append_message(
    db: Session,
    *,
    session: ChatSessionModel,
    role: str,
    content: str,
    context: dict | None = None,
) -> ChatMessage:
    message = ChatMessage(
        session_id=session.id,
        role=role,
        content=content,
        context=context,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def post_user_message(
    db: Session,
    *,
    session: ChatSessionModel,
    content: str,
) -> Tuple[ChatMessage, ChatMessage]:
    user_message = _append_message(db, session=session, role="user", content=content)
    assistant_message = _generate_agentic_response(db, session=session, user_message=content)
    return user_message, assistant_message


def _generate_agentic_response(
    db: Session,
    *,
    session: ChatSessionModel,
    user_message: str,
) -> ChatMessage:
    dataset: Dataset = session.dataset
    agent_kit: AgentKit | None = session.agent_kit

    if not agent_kit:
        response_text = "No agent kit is attached to this session yet."
        return _append_message(db, session=session, role="assistant", content=response_text, context=None)

    try:
        config = AgentKitConfig.parse_obj(agent_kit.config)
    except Exception as exc:  # noqa: BLE001
        response_text = "Agent kit configuration is invalid."
        return _append_message(
            db,
            session=session,
            role="assistant",
            content=response_text,
            context={"error": str(exc)},
        )

    # Get dataset context
    summary_payload = dataset_service.run_summary_query(dataset)
    sample_rows = dataset.sample_rows or []

    # Get agent kit simulation
    try:
        simulation = agent_kit_service.simulate_agent_kit(db=db, agent_kit=agent_kit)
    except ValueError as exc:
        simulation = None
        simulation_error = str(exc)
    else:
        simulation_error = None

    # Build tools list from agent kit config
    tools = []
    if config.tool_bindings:
        tools = [f"{tb.alias} ({tb.tool_name})" for tb in config.tool_bindings]

    # Get conversation history from session
    previous_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
        .all()
    )

    conversation_history = []
    for msg in previous_messages:
        conversation_history.append({
            "role": msg.role,
            "content": msg.content
        })

    # Try to use LLM service
    try:
        llm_service = get_llm_service()

        # Create tool registry and register available tools
        tool_registry = get_tool_registry()
        tool_registry.register(SQLQueryTool(dataset_service, dataset))
        tool_registry.register(CalculatorTool())
        tool_registry.register(DataSummaryTool(dataset_service, dataset))

        # Build initial system prompt with all context
        base_system_prompt = llm_service.build_data_analysis_system_prompt(
            agent_kit_name=agent_kit.name,
            primary_objective=config.primary_objective,
            dataset_name=dataset.name,
            dataset_schema=dataset.schema,
            dataset_summary=summary_payload,
            sample_rows=sample_rows,
            tools=tools if tools else None,
            metrics=config.metrics if config.metrics else None,
            constraints=config.constraints if config.constraints else None,
        )

        # Manage context window - summarize old messages if needed
        context_manager = get_context_manager()
        context_result = context_manager.manage_context_window(
            messages=conversation_history,
            system_prompt=base_system_prompt,
            keep_recent_count=10,  # Keep last 10 messages (5 turns)
        )

        # Use managed conversation history
        managed_history = context_result["messages"]
        conversation_summary = context_result.get("summary")

        # Inject summary into system prompt if we summarized
        system_prompt = base_system_prompt
        if conversation_summary:
            system_prompt = context_manager.inject_summary_into_system_prompt(
                base_system_prompt,
                conversation_summary
            )

        # Get all tool schemas from registry
        llm_tools = tool_registry.get_all_schemas()

        # Generate response using Claude with tools and managed history
        response = llm_service.generate_chat_response(
            user_message=user_message,
            conversation_history=managed_history,
            system_prompt=system_prompt,
            tools=llm_tools,
        )

        response_text = response["text"]
        query_results = []

        # Handle tool calls using the tool registry
        if response["tool_calls"]:
            for tool_call in response["tool_calls"]:
                tool_name = tool_call["name"]
                tool_input = tool_call["input"]

                try:
                    # Execute tool through registry
                    tool_result = tool_registry.execute_tool(tool_name, **tool_input)

                    if tool_result.success:
                        query_results.append({
                            "tool": tool_name,
                            "input": tool_input,
                            "result": tool_result.data,
                            "metadata": tool_result.metadata
                        })

                        # Format tool results in response
                        if response_text:
                            response_text += "\n\n"

                        explanation = tool_result.metadata.get("explanation", "")
                        if explanation:
                            response_text += f"**{tool_name}:** {explanation}\n"

                        # Format based on tool type
                        if tool_name == "sql_query":
                            sql = tool_result.metadata.get("query", "")
                            response_text += f"```sql\n{sql}\n```\n"
                            response_text += f"**Results:** {tool_result.metadata.get('row_count', 0)} rows\n"

                            if tool_result.data and tool_result.data.get("rows"):
                                response_text += "\nSample results:\n"
                                for i, row in enumerate(tool_result.data["rows"][:3], 1):
                                    response_text += f"{i}. {row}\n"

                        elif tool_name == "calculator":
                            result_val = tool_result.data.get("result")
                            expression = tool_result.data.get("expression")
                            response_text += f"**Calculation:** `{expression}` = **{result_val}**\n"

                        elif tool_name == "data_summary":
                            if "column" in tool_result.metadata:
                                col = tool_result.metadata["column"]
                                response_text += f"**Summary for {col}:**\n"
                                response_text += f"- Average: {tool_result.data.get('avg')}\n"
                                response_text += f"- Min: {tool_result.data.get('min')}\n"
                                response_text += f"- Max: {tool_result.data.get('max')}\n"
                            else:
                                response_text += "**Dataset Summary:**\n"
                                for col_stat in tool_result.data.get("numeric_columns", [])[:3]:
                                    response_text += f"- {col_stat['column']}: avg={col_stat.get('avg')}, min={col_stat.get('min')}, max={col_stat.get('max')}\n"

                    else:
                        error_msg = tool_result.error
                        if response_text:
                            response_text += "\n\n"
                        response_text += f"⚠️ Tool '{tool_name}' failed: {error_msg}"

                except Exception as tool_exc:
                    error_msg = f"Tool execution failed: {str(tool_exc)}"
                    if response_text:
                        response_text += "\n\n"
                    response_text += f"⚠️ {error_msg}"

    except Exception as exc:  # Fallback to static response if LLM fails
        response_lines: List[str] = []
        response_lines.append(f"[LLM unavailable: {str(exc)}]")
        response_lines.append(
            f"Using agent kit '{agent_kit.name}' to pursue: {config.primary_objective}."
        )

        if summary_payload["numeric_columns"]:
            top_columns = summary_payload["numeric_columns"][:3]
            formatted = "; ".join(
                f"{col['column']}: avg {col['avg']:.2f} (min {col['min']}, max {col['max']})"
                for col in top_columns
                if col["avg"] is not None
            )
            if formatted:
                response_lines.append("Top numeric signals: " + formatted + ".")

        response_text = "\n".join(response_lines)

    # Save context (convert UUIDs to strings for JSON serialization)
    import json
    def make_json_serializable(obj):
        """Convert UUIDs and other non-serializable objects to strings"""
        return json.loads(json.dumps(obj, default=str))

    # Include context management metadata
    context_management_info = {}
    if 'context_result' in locals():
        context_management_info = {
            "was_summarized": context_result.get("was_summarized", False),
            "total_tokens": context_result.get("total_tokens", 0),
            "summarized_count": context_result.get("summarized_count", 0),
            "retained_count": context_result.get("retained_count", 0),
        }

    context_payload = make_json_serializable({
        "summary": summary_payload,
        "sample_rows": sample_rows[:3],
        "simulation": simulation.dict() if simulation else None,
        "simulation_error": simulation_error if simulation_error else None,
        "user_message": user_message,
        "query_results": query_results if 'query_results' in locals() else [],
        "context_management": context_management_info,
    })

    return _append_message(
        db,
        session=session,
        role="assistant",
        content=response_text,
        context=context_payload,
    )
