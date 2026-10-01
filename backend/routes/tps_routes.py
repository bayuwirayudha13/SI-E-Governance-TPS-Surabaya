from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from schemas.tps_schema import TPSCreate, TPSUpdate, TPSResponse
from services.tps_service import (
    get_all_tps,
    get_tps_by_id,
    get_tps_by_kecamatan,
    get_tps_by_status,
    create_tps,
    update_tps,
    delete_tps
)

router = APIRouter(prefix="/tps", tags=["TPS Management"])

@router.get("/", response_model=List[TPSResponse])
def list_tps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    kecamatan: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get semua data TPS dengan filter opsional:
    - skip: offset untuk pagination
    - limit: jumlah data per halaman
    - kecamatan: filter berdasarkan kecamatan
    - status: filter berdasarkan status (Aktif/Tidak Aktif)
    """
    if kecamatan:
        return get_tps_by_kecamatan(db, kecamatan)
    elif status:
        return get_tps_by_status(db, status)
    else:
        return get_all_tps(db, skip, limit)

@router.get("/{tps_id}", response_model=TPSResponse)
def get_tps(tps_id: int, db: Session = Depends(get_db)):
    """Get detail TPS berdasarkan ID"""
    tps = get_tps_by_id(db, tps_id)
    if not tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    return tps

@router.post("/", response_model=TPSResponse, status_code=201)
def add_tps(tps_data: TPSCreate, db: Session = Depends(get_db)):
    """Tambah TPS baru"""
    try:
        return create_tps(db, tps_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal menambah TPS: {str(e)}")

@router.put("/{tps_id}", response_model=TPSResponse)
def edit_tps(tps_id: int, tps_data: TPSUpdate, db: Session = Depends(get_db)):
    """Update data TPS"""
    tps = update_tps(db, tps_id, tps_data)
    if not tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    return tps

@router.delete("/{tps_id}")
def remove_tps(tps_id: int, db: Session = Depends(get_db)):
    """Hapus TPS"""
    success = delete_tps(db, tps_id)
    if not success:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    return {"message": "TPS berhasil dihapus"}
