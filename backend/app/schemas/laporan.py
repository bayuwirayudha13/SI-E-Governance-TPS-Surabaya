from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LaporanBase(BaseModel):
    tps_id: int
    warga_id: Optional[int] = None
    jenis_laporan: str
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None
    status_tindak_lanjut: str = "Belum Ditindaklanjuti"

class LaporanCreate(BaseModel):
    tps_id: int
    jenis_laporan: str
    deskripsi: Optional[str] = None

class LaporanResponse(LaporanBase):
    id: int
    tanggal_lapor: Optional[datetime]
    ditindaklanjuti_oleh: Optional[int] = None
    catatan_admin: Optional[str] = None

    class Config:
        from_attributes = True
