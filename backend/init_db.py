"""
Initialize the database by creating all tables.
Run this script once to set up the database.
"""
from database import engine, Base
import models

# Import all models to ensure they're registered with Base
# This is important for create_all() to work

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
