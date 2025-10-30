from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import routes as v1_routes
from app.db.session import SessionLocal
from app.db.init_db import init_db

init_db(db=SessionLocal())

app = FastAPI()

# Set up CORS middleware
origins = [
    "https://agentprovision.com",
    "http://localhost:3000", # For local development
    "http://127.0.0.1:3000", # For local development
    "http://localhost:8002", # Docker web service
    "http://127.0.0.1:8002", # Docker web service
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_routes.router, prefix="/api/v1")

# Dummy comment to force rebuild
