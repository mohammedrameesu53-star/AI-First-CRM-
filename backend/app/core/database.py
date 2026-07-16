from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create engine to establish PostgreSQL connections
# Using the connection URL configured in settings
engine = create_engine(
    settings.DATABASE_URL
)

# SessionLocal is a factory class that generates new Database Session objects.
# We set autocommit=False and autoflush=False to control transactional boundaries manually.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class which all database models will inherit from to be registered by SQLAlchemy
Base = declarative_base()
