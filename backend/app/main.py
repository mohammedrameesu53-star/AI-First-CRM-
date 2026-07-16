from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Auto-create tables on startup (perfect for local development / testing setup)
Base.metadata.create_all(bind=engine)

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API supporting the Healthcare Professional assessment system.",
    version="1.0.0"
)

# Set up CORS (Cross-Origin Resource Sharing) configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domain
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include the main API router under the API version prefix (e.g., /api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint for health checking
@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "message": f"{settings.PROJECT_NAME} API is running successfully."
    }
