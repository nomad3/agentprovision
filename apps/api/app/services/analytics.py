from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.data_source import DataSource
from app.models.data_pipeline import DataPipeline
from app.models.notebook import Notebook
from app.schemas.analytics import AnalyticsSummary
import uuid

def get_analytics_summary(db: Session, tenant_id: uuid.UUID) -> AnalyticsSummary:
    total_agents = db.query(Agent).filter(Agent.tenant_id == tenant_id).count()
    total_data_sources = db.query(DataSource).filter(DataSource.tenant_id == tenant_id).count()
    total_data_pipelines = db.query(DataPipeline).filter(DataPipeline.tenant_id == tenant_id).count()
    total_notebooks = db.query(Notebook).filter(Notebook.tenant_id == tenant_id).count()

    return AnalyticsSummary(
        total_agents=total_agents,
        total_data_sources=total_data_sources,
        total_data_pipelines=total_data_pipelines,
        total_notebooks=total_notebooks,
    )
