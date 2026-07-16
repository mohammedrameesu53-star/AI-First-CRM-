from typing import Generator
from app.core.database import SessionLocal

# Database session dependency generator
# This ensures that each API request gets its own database connection session,
# and that connection is closed automatically when the request completes.
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
