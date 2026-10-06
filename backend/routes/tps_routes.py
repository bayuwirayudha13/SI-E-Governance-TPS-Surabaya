from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from core.database import get_db
from core.security import get_current_user, require_admin, require_superadmin
from models.tps import TPS
from models.users import User
from schemas.tps_schema import TPSCreate, TPSUpdate, TPSResponse

router = APIRouter(prefix="/tps", tags=["TPS Management"])

@router.get("/", response_model=List[TPSResponse])
def list_tps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    kecamatan: Optional[str] = None,
    wilayah_kota: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get TPS dengan filter:
    - kecamatan: filter berdasarkan kecamatan
    - wilayah_kota: filter berdasarkan wilayah kota
    - status: filter berdasarkan status (Aktif/Tidak Aktif)
    """
    query = db.query(TPS)
    
    if kecamatan:
        query = query.filter(TPS.kecamatan == kecamatan)
    if wilayah_kota:
        query = query.filter(TPS.wilayah_kota == wilayah_kota)
    if status:
        query = query.filter(TPS.status == status)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{tps_id}", response_model=TPSResponse)
def get_tps(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detail TPS berdasarkan ID"""
    tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    return tps

@router.post("/", response_model=TPSResponse, status_code=201)
def create_tps(
    tps_data: TPSCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Tambah TPS baru (Superadmin only)"""
    try:
        db_tps = TPS(**tps_data.dict())
        db.add(db_tps)
        db.commit()
        db.refresh(db_tps)
        return db_tps
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal menambah TPS: {str(e)}")

@router.put("/{tps_id}", response_model=TPSResponse)
def update_tps(
    tps_id: int,
    tps_data: TPSUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update data TPS (Admin/Superadmin only)"""
    db_tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not db_tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    
    update_data = tps_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tps, field, value)
    
    db.commit()
    db.refresh(db_tps)
    return db_tps

@router.delete("/{tps_id}")
def delete_tps(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Hapus TPS (Superadmin only)"""
    db_tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not db_tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    
    db.delete(db_tps)
    db.commit()
    return {"message": "TPS berhasil dihapus", "id": tps_id}

@router.get("/wilayah/{wilayah_kota}", response_model=List[TPSResponse])
def get_tps_by_wilayah(
    wilayah_kota: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Filter TPS by wilayah kota"""
    tps_list = db.query(TPS).filter(TPS.wilayah_kota == wilayah_kota).all()
    if not tps_list:
        raise HTTPException(status_code=404, detail=f"Tidak ada TPS di wilayah {wilayah_kota}")
    return tps_list
