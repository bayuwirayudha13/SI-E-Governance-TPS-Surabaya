from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class Setoran_SampahCreate(BaseModel):
    warga_id: int
    tps_id: Optional[int] = None
    jenis_sampah: str
    perkiraan_berat_kg: Optional[Decimal] = None
    metode_setor: str
    alamat_penjemputan: Optional[str] = None
    petugas_id: Optional[int] = None

class Setoran_SampahUpdate(BaseModel):
    status: Optional[str] = None
    poin_diperoleh: Optional[int] = None

class Setoran_SampahResponse(BaseModel):
    id: int
    warga_id: int
    tps_id: Optional[int]
    jenis_sampah: str
    perkiraan_berat_kg: Optional[Decimal]
    poin_diperoleh: Optional[int]
    foto_bukti_url: Optional[str]
    metode_setor: str
    alamat_penjemputan: Optional[str]
    petugas_id: Optional[int]
    qr_code: Optional[str]
    status: str
    waktu_setor: datetime
    waktu_validasi: Optional[datetime]

    class Config:
        from_attributes = True
