from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class KecamatanResponse(BaseModel):
    id: int
    nama: str
    kode: Optional[str] = None

    class Config:
        from_attributes = True

class KelurahanResponse(BaseModel):
    id: int
    nama: str
    kecamatan: str
    wilayah_kota: str

    class Config:
        from_attributes = True
