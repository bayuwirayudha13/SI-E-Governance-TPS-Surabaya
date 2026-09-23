import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Muat .env dari folder backend
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """Konfigurasi aplikasi SIPK-TPS."""

    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/sipk_tps"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Path penyimpanan file
    UPLOAD_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "uploads")
    QRCODE_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "static" / "qrcodes")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Pastikan direktori upload & qrcode ada
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.QRCODE_DIR, exist_ok=True)
