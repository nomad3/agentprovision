from __future__ import annotations

from typing import List, Dict

from sqlalchemy.orm import Session
import uuid

from app.models.agent_kit import AgentKit
from app.models.tool import Tool
from app.models.vector_store import VectorStore
from app.schemas.agent_kit import (
    AgentKitCreate,
    AgentKitUpdate,
    AgentKitConfig,
    AgentKit,
    AgentKitSimulation,
    ResolvedToolBinding,
    ResolvedVectorBinding,
    AgentKitSimulationStep,
)

def get_agent_kit(db: Session, agent_kit_id: uuid.UUID) -> AgentKit | None:
    return db.query(AgentKit).filter(AgentKit.id == agent_kit_id).first()

def get_agent_kits_by_tenant(db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[AgentKit]:
    return db.query(AgentKit).filter(AgentKit.tenant_id == tenant_id).offset(skip).limit(limit).all()

def _normalize_config(config: AgentKitConfig | Dict) -> Dict:
    if config is None:
        return {}
    if isinstance(config, AgentKitConfig):
        return config.dict()
    if isinstance(config, dict):
        return AgentKitConfig.parse_obj(config).dict()
    # Fallback for unexpected inputs
    return AgentKitConfig.parse_obj(config).dict()


def create_tenant_agent_kit(db: Session, *, item_in: AgentKitCreate, tenant_id: uuid.UUID) -> AgentKit:
    payload = item_in.dict()
    payload["config"] = _normalize_config(payload.get("config"))
    db_item = AgentKit(**payload, tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_agent_kit(db: Session, *, db_obj: AgentKit, obj_in: AgentKitUpdate) -> AgentKit:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)

    if "config" in update_data and update_data["config"] is not None:
        update_data["config"] = _normalize_config(update_data["config"])

    for field, value in update_data.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_agent_kit(db: Session, *, agent_kit_id: uuid.UUID) -> AgentKit | None:
    agent_kit = db.query(AgentKit).filter(AgentKit.id == agent_kit_id).first()
    if agent_kit:
        db.delete(agent_kit)
        db.commit()
    return agent_kit


def simulate_agent_kit(db: Session, *, agent_kit: AgentKit) -> AgentKitSimulation:
    if not agent_kit.config:
        raise ValueError("Agent kit configuration is empty.")

    config = AgentKitConfig.parse_obj(agent_kit.config)

    tool_ids = [binding.tool_id for binding in config.tool_bindings]
    vector_ids = [binding.vector_store_id for binding in config.vector_bindings]

    tools: Dict[uuid.UUID, Tool] = {}
    if tool_ids:
        tools = {tool.id: tool for tool in db.query(Tool).filter(Tool.id.in_(tool_ids)).all()}
    vectors: Dict[uuid.UUID, VectorStore] = {}
    if vector_ids:
        vectors = {vs.id: vs for vs in db.query(VectorStore).filter(VectorStore.id.in_(vector_ids)).all()}

    missing_tools = [str(t_id) for t_id in tool_ids if t_id not in tools]
    if missing_tools:
        raise ValueError(f"Referenced tools not found: {', '.join(missing_tools)}")

    missing_vectors = [str(v_id) for v_id in vector_ids if v_id not in vectors]
    if missing_vectors:
        raise ValueError(f"Referenced vector stores not found: {', '.join(missing_vectors)}")

    resolved_tools: List[ResolvedToolBinding] = []
    alias_map: Dict[str, ResolvedToolBinding] = {}
    for binding in config.tool_bindings:
        tool = tools[binding.tool_id]
        resolved = ResolvedToolBinding(
            id=tool.id,
            alias=binding.alias,
            name=tool.name,
            description=tool.description,
            capabilities=binding.capabilities,
            config=tool.config,
        )
        resolved_tools.append(resolved)
        alias_map[binding.alias] = resolved

    resolved_vectors: List[ResolvedVectorBinding] = []
    use_case_map: Dict[str, ResolvedVectorBinding] = {}
    for binding in config.vector_bindings:
        vector_store = vectors[binding.vector_store_id]
        resolved_vector = ResolvedVectorBinding(
            id=vector_store.id,
            use_case=binding.use_case,
            name=vector_store.name,
            description=vector_store.description,
            provider=(vector_store.config or {}).get("provider"),
            config=vector_store.config,
        )
        resolved_vectors.append(resolved_vector)
        use_case_map[binding.use_case] = resolved_vector

    steps: List[AgentKitSimulationStep] = []
    for index, step in enumerate(config.playbook, start=1):
        step_tools = [alias_map[alias] for alias in step.tool_aliases if alias in alias_map]
        step_vectors = [use_case_map[use_case] for use_case in step.vector_use_cases if use_case in use_case_map]

        summary_parts = [step.description]
        if step_tools:
            tool_summary = ", ".join(rt.name for rt in step_tools)
            summary_parts.append(f"Leverages tools: {tool_summary}.")
        if step_vectors:
            vector_summary = ", ".join(rv.name for rv in step_vectors)
            summary_parts.append(f"Grounds answers using vector stores: {vector_summary}.")
        if step.success_criteria:
            summary_parts.append(f"Checks success criteria: {', '.join(step.success_criteria)}.")

        recommended_prompt = None
        if step_tools or step_vectors:
            directive = step.agent_action or step.name
            context_parts = []
            if step_vectors:
                context_parts.append(
                    " and ".join(
                        f"context from {rv.name} ({rv.use_case})" for rv in step_vectors
                    )
                )
            if step_tools:
                context_parts.append(
                    "invoke " + ", ".join(f"{tool.alias} ({tool.name})" for tool in step_tools)
                )
            context_text = "; ".join(context_parts)
            recommended_prompt = f"{directive}. Use {context_text}."

        steps.append(
            AgentKitSimulationStep(
                order=index,
                name=step.name,
                agent_action=step.agent_action,
                summary=" ".join(summary_parts).strip(),
                tools=step_tools,
                vector_context=step_vectors,
                success_criteria=step.success_criteria,
                recommended_prompt=recommended_prompt,
            )
        )

    next_actions = [
        "Validate tool permissions and API credentials for bound integrations.",
        "Schedule a dry run with sample tickets to evaluate success criteria.",
    ]
    if config.handoff_channels:
        next_actions.append(
            "Confirm human handoff process via: " + ", ".join(config.handoff_channels)
        )
    if config.metrics:
        next_actions.append("Set up monitoring for metrics: " + ", ".join(config.metrics))

    return AgentKitSimulation(
        agent_kit_id=agent_kit.id,
        objective=config.primary_objective,
        metrics=config.metrics,
        constraints=config.constraints,
        resolved_tools=resolved_tools,
        resolved_vector_stores=resolved_vectors,
        steps=steps,
        next_actions=next_actions,
    )
