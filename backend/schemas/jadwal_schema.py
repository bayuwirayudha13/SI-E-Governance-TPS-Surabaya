from pydantic import BaseModel
from typing import Optional
from datetime import time, date
from enum import Enum

class TipeJadwal(str, Enum):
    RUTIN = "Rutin"
    BESAR = "Besar"
    LIBUR = "Libur"

class JadwalCreate(BaseModel):
    hari: str
    waktu_mulai: time
    waktu_selesai: time
    area: str
    petugas: str
    tipe: TipeJadwal = TipeJadwal.RUTIN
    tps_id: Optional[int] = None

class JadwalUpdate(BaseModel):
    hari: Optional[str] = None
    waktu_mulai: Optional[time] = None
    waktu_selesai: Optional[time] = None
    area: Optional[str] = None
    petugas: Optional[str] = None
    tipe: Optional[TipeJadwal] = None
    tps_id: Optional[int] = None

class JadwalResponse(BaseModel):
    id: int
    hari: str
    waktu_mulai: str  # ISO format string for JSON
    waktu_selesai: str
    area: str
    petugas: str
    tipe: TipeJadwal
    tps_id: Optional[int] = None

    class Config:
        from_attributes = True
