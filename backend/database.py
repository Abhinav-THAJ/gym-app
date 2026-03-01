from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
import os

# Use a default URL for local dev if env var not set
# TODO: Update with actual credentials or use env vars
password = quote_plus("abhinav@12")
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"postgresql://postgres:{password}@localhost:5432/project")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
