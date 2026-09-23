"""
SIPK-TPS Surabaya — Backend API
Sistem Informasi Pengelolaan Kebersihan & TPS Kota Surabaya (Legacy DB Integration)

Jalankan:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base

# Import semua model
from app.models.admin import Admin
from app.models.warga import Warga
from app.models.petugas import PetugasPengangkut
from app.models.tps import TPS
from app.models.wilayah import Kecamatan, Kelurahan, TPSKelurahan
from app.models.laporan import LaporanWarga
from app.models.setoran import SetoranSampah
from app.models.jadwal import JadwalPengangkutan

# Import semua router
from app.api.v1 import auth, tps, wilayah, laporan, setoran

# Base.metadata.create_all(bind=engine) # Dimatikan karena menggunakan schema DB lama

app = FastAPI(
    title="SIPK-TPS Surabaya API (Legacy)",
    description="API untuk Sistem Informasi Pengelolaan Kebersihan & TPS Kota Surabaya menggunakan DB Legacy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=str(
    __import__("pathlib").Path(settings.QRCODE_DIR).parent
)), name="static")

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(tps.router, prefix=f"{API_PREFIX}/tps", tags=["TPS"])
app.include_router(wilayah.router, prefix=f"{API_PREFIX}/wilayah", tags=["Wilayah"])
app.include_router(laporan.router, prefix=f"{API_PREFIX}/laporan", tags=["Laporan"])
app.include_router(setoran.router, prefix=f"{API_PREFIX}/setoran", tags=["Setoran"])

@app.get("/")
def root():
    return {
        "nama": "SIPK-TPS Surabaya API (Legacy)",
        "versi": "1.0.0",
        "docs": "/docs",
        "status": "aktif"
    }
