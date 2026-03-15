from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireAI"
    DATABASE_URL: str = "postgresql://postgres:120303@localhost:5432/nexthire"
    SECRET_KEY: str = "yoursecretkeyhere"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Drive sync settings (optional – only used by drive_sync_orchestrator.py)
    GOOGLE_DRIVE_FOLDER_ID: str = ""
    BACKEND_API_URL: str = "http://localhost:8001"
    USE_OAUTH: bool = True
    GOOGLE_SERVICE_ACCOUNT_JSON_PATH: str = ""
    ANTHROPIC_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"   # silently ignore any .env keys not declared above

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
