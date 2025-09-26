# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base
# from dotenv import load_dotenv
# import os

# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL",'sqlite:///./test')

# engine = create_engine(DATABASE_URL, connect_args={'check_same_thread' : False})
# SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# Base = declarative_base()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test")

def create_database_engine(database_url):
    if database_url.startswith("postgresql"):
        # PostgreSQL configuration
        return create_engine(
            database_url,
            pool_pre_ping=True,      # Verify connections before use
            pool_recycle=3600,       # Recycle connections every hour
            pool_size=10,            # Connection pool size
            max_overflow=20,         # Max connections beyond pool_size
            echo=False               # Set to True for SQL debugging
        )
    else:
        # SQLite configuration (fallback for local development)
        return create_engine(
            database_url, 
            connect_args={"check_same_thread": False},
            echo=False
        )

engine = create_database_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
