
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# Lokal: Laragon
# Deployment: DATABASE_URL dari Environment Variables
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost:3306/sipk_tps_baru"
)

url = make_url(DATABASE_URL)

connect_args = {}

if url.get_backend_name() == "mysql":
    connect_args["connect_timeout"] = 10

    # SSL untuk database cloud seperti Aiven
    if url.host not in ("localhost", "127.0.0.1"):
        ca_cert_path = Path(__file__).resolve().parents[1] / "ca.pem"

        if not ca_cert_path.is_file():
            raise FileNotFoundError(
                f"Sertifikat CA tidak ditemukan: {ca_cert_path}"
            )

        connect_args["ssl"] = {
            "ca": str(ca_cert_path)
        }

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()