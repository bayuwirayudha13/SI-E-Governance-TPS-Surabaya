from pydantic import BaseModel
from typing import Optional
from datetime import time

class JadwalBase(BaseModel):
    tps_id: int
    hari: str
    jam: time
    keterangan: Optional[str] = None

class JadwalResponse(JadwalBase):
    id: int

    class Config:
        from_attributes = True
