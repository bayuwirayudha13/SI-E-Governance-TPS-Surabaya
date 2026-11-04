from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TPSMonitoringReportCreate(BaseModel):
    petugas_id: int
    tps_id: int
    volume_aktual_m3: float
    persentase_kapasitas: float
    foto_url: Optional[str] = None
    catatan_kondisi: Optional[str] = None
    waktu_monitoring: Optional[datetime] = None
    status_verifikasi: str = "Menunggu Verifikasi"
    alasan_penolakan: Optional[str] = None
    diverifikasi_oleh: Optional[int] = None
    waktu_verifikasi: Optional[datetime] = None

class TPSMonitoringReportUpdate(BaseModel):
    petugas_id: Optional[int] = None
    tps_id: Optional[int] = None
    volume_aktual_m3: Optional[float] = None
    persentase_kapasitas: Optional[float] = None
    foto_url: Optional[str] = None
    catatan_kondisi: Optional[str] = None
    waktu_monitoring: Optional[datetime] = None
    status_verifikasi: Optional[str] = None
    alasan_penolakan: Optional[str] = None
    diverifikasi_oleh: Optional[int] = None
    waktu_verifikasi: Optional[datetime] = None

class TPSMonitoringReportResponse(BaseModel):
    id: int
    petugas_id: int
    tps_id: int
    volume_aktual_m3: float
    persentase_kapasitas: float
    foto_url: Optional[str] = None
    catatan_kondisi: Optional[str] = None
    waktu_monitoring: Optional[datetime] = None
    status_verifikasi: str
    alasan_penolakan: Optional[str] = None
    diverifikasi_oleh: Optional[int] = None
    waktu_verifikasi: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True