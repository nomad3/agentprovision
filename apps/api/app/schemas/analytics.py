from pydantic import BaseModel

class AnalyticsSummary(BaseModel):
    total_agents: int = 0
    total_data_sources: int = 0
    total_data_pipelines: int = 0
    total_notebooks: int = 0
    # Add more summary fields as needed
