from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PetugasBase(BaseModel):
    nama: str
    no_hp: str
    username: str
    wilayah_tugas: Optional[str] = None
    status: str = "Aktif"

class PetugasCreate(PetugasBase):
    password: str

class PetugasResponse(PetugasBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
