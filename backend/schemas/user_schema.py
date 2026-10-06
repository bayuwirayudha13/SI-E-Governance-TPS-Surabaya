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
