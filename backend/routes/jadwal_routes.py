from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from schemas.jadwal_schema import JadwalCreate, JadwalUpdate, JadwalResponse
from models.users import User
from models.warga import Warga
from services.jadwal_service import (
    get_all_jadwal,
    get_jadwal_by_wilayah,
    get_jadwal_by_id,
    create_jadwal,
    update_jadwal,
    delete_jadwal,
    get_eligible_petugas
)
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

router = APIRouter(prefix="/jadwal", tags=["Jadwal Pengambilan"])

async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        
        if email is None or role is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if role in ["petugas", "petugas_pengangkut", "admin", "superadmin", "driver", "petugas_tps"]:
        user = db.query(User).filter(User.id == user_id, User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"id": user.id, "email": user.email, "role": user.role, "wilayah_kecamatan": user.wilayah_kecamatan, "wilayah_kelurahan": user.wilayah_kelurahan}
    
    elif role == "warga":
        warga = db.query(Warga).filter(Warga.id == user_id, Warga.email == email).first()
        if not warga:
            raise HTTPException(status_code=401, detail="Warga not found")
        return {"id": warga.id, "email": warga.email, "role": "warga", "kecamatan": warga.kecamatan, "kelurahan": warga.kelurahan}
    
    raise HTTPException(status_code=401, detail="Invalid role")

async def get_current_superadmin(user = Depends(get_current_user)):
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Akses khusus Super Admin")
    return user

# Public endpoint for warga - filter by their wilayah
@router.get("/", response_model=List[JadwalResponse])
def list_jadwal_warga(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Warga can only see their own wilayah jadwal
    if current_user["role"] == "warga":
        kecamatan = current_user.get("kecamatan")
        kelurahan = current_user.get("kelurahan")
        
        if not kecamatan or not kelurahan:
            raise HTTPException(status_code=400, detail="Profil warga belum memiliki wilayah lengkap")
        
        jadwals = get_jadwal_by_wilayah(db, kecamatan, kelurahan)
        result = []
        for j in jadwals:
            result.append({
                "id": j.id,
                "hari": j.hari,
                "waktu_mulai": j.waktu_mulai.strftime("%H:%M"),
                "waktu_selesai": j.waktu_selesai.strftime("%H:%M"),
                "area": j.area,
                "petugas": j.petugas,
                "tipe": j.tipe.value,
                "tps_id": j.tps_id,
                "kecamatan": j.kecamatan,
                "kelurahan": j.kelurahan,
                "petugas_id": j.petugas_id
            })
        return result
    
    # Admin/Superadmin - return all jadwal
    jadwals = get_all_jadwal(db)
    result = []
    for j in jadwals:
        result.append({
            "id": j.id,
            "hari": j.hari,
            "waktu_mulai": j.waktu_mulai.strftime("%H:%M"),
            "waktu_selesai": j.waktu_selesai.strftime("%H:%M"),
            "area": j.area,
            "petugas": j.petugas,
            "tipe": j.tipe.value,
            "tps_id": j.tps_id,
            "kecamatan": j.kecamatan,
            "kelurahan": j.kelurahan,
            "petugas_id": j.petugas_id
        })
    return result

# Admin endpoint for managing all jadwal
@router.get("/admin", response_model=List[JadwalResponse])
def list_jadwal_admin(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superadmin)
):
    jadwals = get_all_jadwal(db)
    result = []
    for j in jadwals:
        result.append({
            "id": j.id,
            "hari": j.hari,
            "waktu_mulai": j.waktu_mulai.strftime("%H:%M"),
            "waktu_selesai": j.waktu_selesai.strftime("%H:%M"),
            "area": j.area,
            "petugas": j.petugas,
            "tipe": j.tipe.value,
            "tps_id": j.tps_id,
            "kecamatan": j.kecamatan,
            "kelurahan": j.kelurahan,
            "petugas_id": j.petugas_id
        })
    return result

# Create jadwal - superadmin only
@router.post("/", response_model=JadwalResponse, status_code=201)
def add_jadwal(
    jadwal_data: JadwalCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superadmin)
):
    # Validate waktu_selesai > waktu_mulai unless LIBUR with 00:00
    if jadwal_data.tipe != "LIBUR" and jadwal_data.waktu_selesai <= jadwal_data.waktu_mulai:
        raise HTTPException(status_code=400, detail="Waktu selesai harus lebih besar dari waktu mulai")
    
    if not jadwal_data.kecamatan or not jadwal_data.kelurahan:
        raise HTTPException(status_code=400, detail="Kecamatan dan kelurahan wajib diisi")
    
    try:
        j = create_jadwal(db, jadwal_data)
        return {
            "id": j.id,
            "hari": j.hari,
            "waktu_mulai": j.waktu_mulai.strftime("%H:%M"),
            "waktu_selesai": j.waktu_selesai.strftime("%H:%M"),
            "area": j.area,
            "petugas": j.petugas,
            "tipe": j.tipe.value,
            "tps_id": j.tps_id,
            "kecamatan": j.kecamatan,
            "kelurahan": j.kelurahan,
            "petugas_id": j.petugas_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Update jadwal - superadmin only
@router.put("/{jadwal_id}", response_model=JadwalResponse)
def edit_jadwal(
    jadwal_id: int,
    jadwal_data: JadwalUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superadmin)
):
    # Validate waktu_selesai > waktu_mulai
    if jadwal_data.tipe and jadwal_data.tipe != "LIBUR" and jadwal_data.waktu_selesai and jadwal_data.waktu_mulai:
        if jadwal_data.waktu_selesai <= jadwal_data.waktu_mulai:
            raise HTTPException(status_code=400, detail="Waktu selesai harus lebih besar dari waktu mulai")
    
    try:
        j = update_jadwal(db, jadwal_id, jadwal_data)
        if not j:
            raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
        return {
            "id": j.id,
            "hari": j.hari,
            "waktu_mulai": j.waktu_mulai.strftime("%H:%M"),
            "waktu_selesai": j.waktu_selesai.strftime("%H:%M"),
            "area": j.area,
            "petugas": j.petugas,
            "tipe": j.tipe.value,
            "tps_id": j.tps_id,
            "kecamatan": j.kecamatan,
            "kelurahan": j.kelurahan,
            "petugas_id": j.petugas_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Delete jadwal - superadmin only
@router.delete("/{jadwal_id}")
def remove_jadwal(
    jadwal_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superadmin)
):
    if not delete_jadwal(db, jadwal_id):
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return {"message": "Jadwal berhasil dihapus"}

# Get eligible petugas for given kecamatan/kelurahan - superadmin only
@router.get("/petugas")
def list_petugas(
    kecamatan: str = Query(...),
    kelurahan: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superadmin)
):
    petugas_list = get_eligible_petugas(db, kecamatan, kelurahan)
    return [
        {
            "id": p.id,
            "nama_lengkap": p.nama_lengkap,
            "email": p.email,
            "wilayah_kecamatan": p.wilayah_kecamatan,
            "wilayah_kelurahan": p.wilayah_kelurahan
        }
        for p in petugas_list
    ]