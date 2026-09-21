from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine

app = FastAPI()


@app.get("/")
def root():
    return {"message": "FastAPI berjalan"}


@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "MySQL berhasil terhubung"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": "Gagal terhubung ke MySQL",
            "detail": str(e)
        }