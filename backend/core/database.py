import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

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
        ca_cert_content = os.getenv("DB_CA_CERT")
        ca_cert_path = Path(__file__).resolve().parents[1] / "ca.pem"

        if ca_cert_content:
            # Tulis isi sertifikat dari env var ke file sementara
            tmp_ca = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
            tmp_ca.write(ca_cert_content.replace("\\n", "\n").encode("utf-8"))
            tmp_ca.close()
            connect_args["ssl"] = {"ca": tmp_ca.name}
        elif ca_cert_path.is_file():
            connect_args["ssl"] = {"ca": str(ca_cert_path)}
        else:
            connect_args["ssl"] = {"ssl_mode": "REQUIRED"}

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