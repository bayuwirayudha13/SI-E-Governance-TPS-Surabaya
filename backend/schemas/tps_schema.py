from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

class TPSCreate(BaseModel):
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

    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v):
        if v is not None:
            if v < -90 or v > 90:
                raise ValueError(f'Latitude harus antara -90 dan 90, bukan {v}')
        return v

    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v):
        if v is not None:
            if v < -180 or v > 180:
                raise ValueError(f'Longitude harus antara -180 dan 180, bukan {v}')
        return v

class TPSUpdate(BaseModel):
    nama: Optional[str] = None
    nama_lama: Optional[str] = None
    lokasi: Optional[str] = None
    kecamatan: Optional[str] = None
    wilayah_kota: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    jenis_tps: Optional[str] = None
    jumlah_container: Optional[str] = None
    daya_tampung_m3: Optional[float] = None
    status: Optional[str] = None
    sumber_data: Optional[str] = None
    tanggal_update: Optional[date] = None
    catatan: Optional[str] = None

    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v):
        if v is not None:
            if v < -90 or v > 90:
                raise ValueError(f'Latitude harus antara -90 dan 90, bukan {v}')
        return v

    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v):
        if v is not None:
            if v < -180 or v > 180:
                raise ValueError(f'Longitude harus antara -180 dan 180, bukan {v}')
        return v

class KelurahanDetail(BaseModel):
    id: int
    nama: str

    class Config:
        from_attributes = True

class TPSResponse(BaseModel):
    id: int
    nama: str
    nama_lama: Optional[str]
    lokasi: Optional[str]
    kecamatan: str
    wilayah_kota: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    jenis_tps: Optional[str]
    jumlah_container: Optional[str]
    daya_tampung_m3: Optional[float] = None
    status: str
    sumber_data: Optional[str]
    tanggal_update: Optional[date]
    catatan: Optional[str]

    class Config:
        from_attributes = True
