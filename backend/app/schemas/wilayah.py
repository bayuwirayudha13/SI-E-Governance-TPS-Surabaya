from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class KecamatanBase(BaseModel):
    nama: str
    kode: Optional[str] = None

class KecamatanResponse(KecamatanBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class KelurahanBase(BaseModel):
    nama: str
    kecamatan: str
    wilayah_kota: str

class KelurahanResponse(KelurahanBase):
    id: int

    class Config:
        from_attributes = True
