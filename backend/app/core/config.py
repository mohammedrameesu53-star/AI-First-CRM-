import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the path to the .env file in the backend root directory (parent of app/core)
current_dir = os.path.dirname(os.path.abspath(__file__))
env_file_path = os.path.normpath(os.path.join(current_dir, "..", "..", ".env"))

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "AI-First CRM HCP Module"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    # Defaults to PostgreSQL with psycopg v3 driver format
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/crm_assessment"
    
    # AI Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # SettingsConfigDict tells Pydantic to read configuration parameters from the absolute path.
    model_config = SettingsConfigDict(
        env_file=env_file_path,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
