from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import date, datetime

class TPSCreate(BaseModel):
    nama: str
    nama_lama: Optional[str] = None
    lokasi: Optional[str] = None
    kecamatan: str
    wilayah_kota: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    jenis_tps: Optional[str] = None
    jumlah_container: Optional[str] = None
    daya_tampung_m3: Optional[Decimal] = None
    status: str = "Aktif"
    sumber_data: Optional[str] = "Data internal DLH"
    tanggal_update: Optional[date] = None
    catatan: Optional[str] = None

class TPSUpdate(BaseModel):
    nama: Optional[str] = None
    nama_lama: Optional[str] = None
    lokasi: Optional[str] = None
    kecamatan: Optional[str] = None
    wilayah_kota: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    jenis_tps: Optional[str] = None
    jumlah_container: Optional[str] = None
    daya_tampung_m3: Optional[Decimal] = None
    status: Optional[str] = None
    sumber_data: Optional[str] = None
    tanggal_update: Optional[date] = None
    catatan: Optional[str] = None

class TPSResponse(BaseModel):
    id: int
    nama: str
    nama_lama: Optional[str]
    lokasi: Optional[str]
    kecamatan: str
    wilayah_kota: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    jenis_tps: Optional[str]
    jumlah_container: Optional[str]
    daya_tampung_m3: Optional[Decimal]
    status: str
    sumber_data: Optional[str]
    tanggal_update: Optional[date]
    catatan: Optional[str]

    class Config:
        from_attributes = True
