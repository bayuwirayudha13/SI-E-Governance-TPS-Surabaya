from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from schemas.laporan_schema import LaporanCreate, LaporanUpdate, LaporanResponse
from services.laporan_service import (
    create_laporan,
    get_all_laporan,
    get_laporan_by_id,
    get_laporan_by_tps,
    get_laporan_by_warga,
    update_status_laporan
)

router = APIRouter(prefix="/laporan", tags=["Laporan Warga"])

@router.get("/", response_model=List[LaporanResponse])
def list_laporan(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tps_id: Optional[int] = None,
    warga_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List semua laporan warga (bisa filter by tps_id atau warga_id)"""
    if tps_id:
        return get_laporan_by_tps(db, tps_id)
    elif warga_id:
        return get_laporan_by_warga(db, warga_id)
    return get_all_laporan(db, skip, limit)

@router.get("/{laporan_id}", response_model=LaporanResponse)
def get_laporan_detail(laporan_id: int, db: Session = Depends(get_db)):
    """Get detail laporan by ID"""
    laporan = get_laporan_by_id(db, laporan_id)
    if not laporan:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return laporan

@router.post("/", response_model=LaporanResponse, status_code=201)
def buat_laporan(laporan_data: LaporanCreate, db: Session = Depends(get_db)):
    """Kirim laporan/keluhan baru terkait TPS"""
    try:
        return create_laporan(db, laporan_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal membuat laporan: {str(e)}")

@router.patch("/{laporan_id}/status", response_model=LaporanResponse)
def update_status(
    laporan_id: int,
    status_data: LaporanUpdate,
    admin_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Update status tindak lanjut laporan oleh admin"""
    laporan = update_status_laporan(db, laporan_id, status_data, admin_id)
    if not laporan:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return laporan
