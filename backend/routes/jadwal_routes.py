from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from schemas.jadwal_schema import JadwalCreate, JadwalUpdate, JadwalResponse
from services.jadwal_service import (
    get_all_jadwal,
    get_jadwal_by_id,
    create_jadwal,
    update_jadwal,
    delete_jadwal
)

router = APIRouter(prefix="/jadwal", tags=["Jadwal Pengambilan"])

@router.get("/", response_model=List[JadwalResponse])
def list_jadwal(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    jadwals = get_all_jadwal(db, skip, limit)
    # Convert time objects to strings for response
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
            "tps_id": j.tps_id
        })
    return result

@router.post("/", response_model=JadwalResponse, status_code=201)
def add_jadwal(jadwal_data: JadwalCreate, db: Session = Depends(get_db)):
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
            "tps_id": j.tps_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{jadwal_id}")
def remove_jadwal(jadwal_id: int, db: Session = Depends(get_db)):
    if not delete_jadwal(db, jadwal_id):
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return {"message": "Jadwal berhasil dihapus"}
