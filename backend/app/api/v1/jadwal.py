from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import RoleChecker
from app.models.jadwal import JadwalTruk
from app.models.wilayah import Kelurahan
from app.models.user import User
from app.schemas.jadwal import JadwalCreate, JadwalUpdate, JadwalResponse, JadwalDetailResponse

router = APIRouter(prefix="/jadwal", tags=["Jadwal Truk"])

@router.get("", response_model=List[JadwalResponse])
def list_jadwal(kelurahan_id: Optional[int] = Query(None), kecamatan_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(JadwalTruk)
    if kelurahan_id: query = query.filter(JadwalTruk.kelurahan_id == kelurahan_id)
    if kecamatan_id: query = query.join(Kelurahan).filter(Kelurahan.kecamatan_id == kecamatan_id)
    return query.order_by(JadwalTruk.hari, JadwalTruk.jam_mulai).all()

@router.get("/wilayah/{kelurahan_id}", response_model=List[JadwalDetailResponse])
def jadwal_by_kelurahan(kelurahan_id: int, db: Session = Depends(get_db)):
    kel = db.query(Kelurahan).filter(Kelurahan.id == kelurahan_id).first()
    if not kel: raise HTTPException(status_code=404, detail="Kelurahan tidak ditemukan")
    jadwal_list = db.query(JadwalTruk).filter(JadwalTruk.kelurahan_id == kelurahan_id).order_by(JadwalTruk.hari, JadwalTruk.jam_mulai).all()
    result = []
    for j in jadwal_list:
        driver = db.query(User).filter(User.id == j.driver_id).first() if j.driver_id else None
        result.append(JadwalDetailResponse(id=j.id, kelurahan_id=j.kelurahan_id, hari=j.hari.value if j.hari else None, jam_mulai=j.jam_mulai, jam_selesai=j.jam_selesai, plat_nomor=j.plat_nomor, driver_id=j.driver_id, keterangan=j.keterangan, created_at=j.created_at, kelurahan_nama=kel.nama, driver_nama=driver.nama_lengkap if driver else None))
    return result

@router.get("/{jadwal_id}", response_model=JadwalDetailResponse)
def get_jadwal(jadwal_id: int, db: Session = Depends(get_db)):
    jadwal = db.query(JadwalTruk).filter(JadwalTruk.id == jadwal_id).first()
    if not jadwal: raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    kel = db.query(Kelurahan).filter(Kelurahan.id == jadwal.kelurahan_id).first()
    driver = db.query(User).filter(User.id == jadwal.driver_id).first() if jadwal.driver_id else None
    return JadwalDetailResponse(id=jadwal.id, kelurahan_id=jadwal.kelurahan_id, hari=jadwal.hari.value if jadwal.hari else None, jam_mulai=jadwal.jam_mulai, jam_selesai=jadwal.jam_selesai, plat_nomor=jadwal.plat_nomor, driver_id=jadwal.driver_id, keterangan=jadwal.keterangan, created_at=jadwal.created_at, kelurahan_nama=kel.nama if kel else None, driver_nama=driver.nama_lengkap if driver else None)

@router.post("", response_model=JadwalResponse, status_code=201)
def create_jadwal(payload: JadwalCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    kel = db.query(Kelurahan).filter(Kelurahan.id == payload.kelurahan_id).first()
    if not kel: raise HTTPException(status_code=404, detail="Kelurahan tidak ditemukan")
    jadwal = JadwalTruk(kelurahan_id=payload.kelurahan_id, hari=payload.hari, jam_mulai=payload.jam_mulai, jam_selesai=payload.jam_selesai, plat_nomor=payload.plat_nomor, driver_id=payload.driver_id, keterangan=payload.keterangan)
    db.add(jadwal)
    db.commit()
    db.refresh(jadwal)
    return jadwal

@router.put("/{jadwal_id}", response_model=JadwalResponse)
def update_jadwal(jadwal_id: int, payload: JadwalUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    jadwal = db.query(JadwalTruk).filter(JadwalTruk.id == jadwal_id).first()
    if not jadwal: raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    for key, value in payload.model_dump(exclude_unset=True).items(): setattr(jadwal, key, value)
    db.commit()
    db.refresh(jadwal)
    return jadwal

@router.delete("/{jadwal_id}")
def delete_jadwal(jadwal_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin"]))):
    jadwal = db.query(JadwalTruk).filter(JadwalTruk.id == jadwal_id).first()
    if not jadwal: raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    db.delete(jadwal)
    db.commit()
    return {"message": "Jadwal berhasil dihapus"}
