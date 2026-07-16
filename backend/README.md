# FastAPI Backend Server

FastAPI server powered by SQLAlchemy, PostgreSQL, and LangGraph for AI-First CRM HCP assessments.

## Directory Structure
- `app/core/`: Application settings and database engine config.
- `app/models/`: SQLAlchemy database models (HCP and Assessment).
- `app/schemas/`: Pydantic validation schemas.
- `app/services/`: Core CRUD business logic layer.
- `app/api/`: API router registry, dependencies, and controllers.

## Configuration
Copy `.env.example` to `.env` and fill in:
```ini
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/crm_assessment
GROQ_API_KEY=your-groq-api-key
```

## Running the Server
Activate your virtual environment and run:
```bash
uvicorn app.main:app --port 8000 --reload
```
Once started, you can access the automatic documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
