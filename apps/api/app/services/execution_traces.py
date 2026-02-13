from typing import List
from sqlalchemy.orm import Session
import uuid

from app.models.execution_trace import ExecutionTrace
from app.schemas.execution_trace import ExecutionTraceCreate


def create_trace(db: Session, *, trace_in: ExecutionTraceCreate, tenant_id: uuid.UUID) -> ExecutionTrace:
    db_item = ExecutionTrace(**trace_in.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_traces_by_task(db: Session, task_id: uuid.UUID, tenant_id: uuid.UUID) -> List[ExecutionTrace]:
    return (
        db.query(ExecutionTrace)
        .filter(ExecutionTrace.task_id == task_id, ExecutionTrace.tenant_id == tenant_id)
        .order_by(ExecutionTrace.step_order)
        .all()
    )


def get_traces_by_tenant(
    db: Session, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> List[ExecutionTrace]:
    return (
        db.query(ExecutionTrace)
        .filter(ExecutionTrace.tenant_id == tenant_id)
        .order_by(ExecutionTrace.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
