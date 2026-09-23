from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SetoranBase(BaseModel):
    warga_id: int
    tps_id: Optional[int] = None
    jenis_sampah: str = "Botol Plastik (PET)"
    perkiraan_berat_kg: Optional[float] = None
    metode_setor: str = "Antar ke TPS"
    alamat_penjemputan: Optional[str] = None

class SetoranCreate(SetoranBase):
    pass

class SetoranResponse(SetoranBase):
    id: int
    poin_diperoleh: Optional[int] = None
    foto_bukti_url: Optional[str] = None
    petugas_id: Optional[int] = None
    qr_code: Optional[str] = None
    status: str
    waktu_setor: Optional[datetime]
    waktu_validasi: Optional[datetime]

    class Config:
        from_attributes = True
