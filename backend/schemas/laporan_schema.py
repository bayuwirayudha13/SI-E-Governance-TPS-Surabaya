from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LaporanCreate(BaseModel):
    tps_id: int
    warga_id: Optional[int] = None
    jenis_laporan: str
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None

class LaporanUpdate(BaseModel):
    status_tindak_lanjut: Optional[str] = None
    catatan_admin: Optional[str] = None

class LaporanResponse(BaseModel):
    id: int
    tps_id: int
    warga_id: Optional[int]
    jenis_laporan: str
    deskripsi: Optional[str]
    foto_url: Optional[str]
    tanggal_lapor: datetime
    status_tindak_lanjut: str
    catatan_admin: Optional[str]

    class Config:
        from_attributes = True
