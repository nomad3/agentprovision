import logging
import sys
import os

# Add the parent directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.seed_llm_data import seed_llm_providers, seed_llm_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init():
    db = SessionLocal()
    try:
        logger.info("Seeding LLM providers...")
        seed_llm_providers(db)
        logger.info("Seeding LLM models...")
        seed_llm_models(db)
        logger.info("LLM data seeded successfully!")
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")
