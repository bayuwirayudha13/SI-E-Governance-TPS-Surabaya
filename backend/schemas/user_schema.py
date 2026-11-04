from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- Admin Schemas ---
class AdminCreate(BaseModel):
    username: str
    password: str
    nama: str
    role: str = "petugas"  # 'super_admin' or 'petugas'

class AdminUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    nama: Optional[str] = None
    role: Optional[str] = None

class AdminResponse(BaseModel):
    id: int
    username: str
    nama: str
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Petugas Pengangkut Schemas ---
class PetugasCreate(BaseModel):
    nama: str
    no_hp: str
    username: str
    password: str
    wilayah_tugas: Optional[str] = None
    status: str = "Aktif"

class PetugasUpdate(BaseModel):
    nama: Optional[str] = None
    no_hp: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    wilayah_tugas: Optional[str] = None
    status: Optional[str] = None

class PetugasResponse(BaseModel):
    id: int
    nama: str
    no_hp: str
    username: str
    wilayah_tugas: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Warga Schemas ---
class WargaCreate(BaseModel):
    nama: str
    email: EmailStr
    password: str
    no_hp: Optional[str] = None

class WargaUpdate(BaseModel):
    nama: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    no_hp: Optional[str] = None
    total_poin: Optional[int] = None

class WargaResponse(BaseModel):
    id: int
    nama: str
    email: str
    no_hp: Optional[str] = None
    total_poin: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Petugas TPS Schemas ---
class PetugasTPSCreate(BaseModel):
    username: str
    password: str
    nama_lengkap: str
    email: EmailStr
    role: str = "petugas_tps"
    is_active: bool = True
    wilayah_kecamatan: Optional[str] = None
    wilayah_kelurahan: Optional[str] = None
    wilayah_kota: Optional[str] = "Surabaya"
    foto_url: Optional[str] = None

class PetugasTPSUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    nama_lengkap: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    wilayah_kecamatan: Optional[str] = None
    wilayah_kelurahan: Optional[str] = None
    wilayah_kota: Optional[str] = None
    foto_url: Optional[str] = None

class PetugasTPSResponse(BaseModel):
    id: int
    username: str
    email: str
    nama_lengkap: str
    role: str
    is_active: bool
    wilayah_kecamatan: Optional[str] = None
    wilayah_kelurahan: Optional[str] = None
    wilayah_kota: Optional[str] = None
    foto_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True