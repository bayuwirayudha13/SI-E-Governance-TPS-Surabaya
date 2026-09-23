from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class TPSBase(BaseModel):
    nama: str
    nama_lama: Optional[str] = None
    lokasi: Optional[str] = None
    kecamatan: str
    wilayah_kota: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    jenis_tps: Optional[str] = None
    jumlah_container: Optional[str] = None
    daya_tampung_m3: Optional[float] = None
    status: str = "Aktif"
    sumber_data: Optional[str] = "Data internal DLH"
    tanggal_update: Optional[date] = None
    catatan: Optional[str] = None

class TPSCreate(TPSBase):
    pass

class TPSResponse(TPSBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
