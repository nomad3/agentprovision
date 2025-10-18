from fastapi import FastAPI
from app.api.v1 import routes as v1_routes
from app.db.session import SessionLocal
from app.db.init_db import init_db

init_db(db=SessionLocal())

app = FastAPI()

app.include_router(v1_routes.router, prefix="/api/v1")
