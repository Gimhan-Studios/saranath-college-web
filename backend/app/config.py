"""Application settings, loaded from environment variables or a .env file.

Every secret has to come from the environment in production. The app refuses
to start in production mode when a secret is missing or still set to a
development placeholder.
"""
from functools import lru_cache
from pathlib import Path
from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"  # "production" on the live server

    # Database. SQLite by default; set to a MySQL URL on cPanel if preferred:
    # mysql+pymysql://user:password@localhost/dbname?charset=utf8mb4
    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'saranath.db'}"

    # Used to sign CSRF tokens. Generate with: python -m app.cli gen-secret
    secret_key: str = "dev-only-change-me"
    # Fernet key used to encrypt feedback at rest. Generate with: python -m app.cli gen-fernet
    data_encryption_key: str = ""

    # Hostnames the site is served on (Host header allow-list).
    allowed_hosts: Annotated[List[str], NoDecode] = ["localhost", "127.0.0.1", "testserver"]

    # Cookie settings
    session_cookie_name: str = "sc_session"
    csrf_cookie_name: str = "sc_csrf"
    session_idle_minutes: int = 30
    session_absolute_hours: int = 8

    # Brute-force protection
    login_max_attempts: int = 5
    login_lockout_minutes: int = 15
    login_ip_max_attempts: int = 20

    # Public feedback form limits (per IP)
    feedback_max_per_hour: int = 5

    # Uploads
    upload_dir: Path = BASE_DIR / "data" / "uploads"
    max_upload_mb: int = 6

    # Built React app (frontend/dist). Served by FastAPI if present.
    frontend_dist: Path = (BASE_DIR / "frontend_dist") if (BASE_DIR / "frontend_dist").is_dir() else (BASE_DIR.parent / "frontend" / "dist")

    # Path prefix the admin SPA lives at; only used in docs/robots. Auth protects it either way.
    admin_path: str = "/admin"

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def split_hosts(cls, v):
        if isinstance(v, str):
            return [h.strip() for h in v.split(",") if h.strip()]
        return v

    @field_validator("upload_dir", "frontend_dist", mode="after")
    @classmethod
    def absolute_paths(cls, v: Path) -> Path:
        return v if v.is_absolute() else (BASE_DIR / v).resolve()

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def validate_for_production(self) -> None:
        if not self.is_production:
            return
        problems = []
        if self.secret_key.startswith("dev-") or len(self.secret_key) < 32:
            problems.append("SECRET_KEY must be a random value of at least 32 characters")
        if not self.data_encryption_key:
            problems.append("DATA_ENCRYPTION_KEY is required")
        if any(h in ("*",) for h in self.allowed_hosts):
            problems.append("ALLOWED_HOSTS must list real hostnames, not *")
        if problems:
            raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.validate_for_production()
    return s
