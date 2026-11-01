from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from core.database import get_db
from core.security import get_current_user, require_admin, require_superadmin
from models.tps import TPS
from models.wilayah import Kelurahan
from models.users import User
from schemas.tps_schema import TPSCreate, TPSUpdate, TPSResponse
from services.tps_service import get_active_public_tps

router = APIRouter(prefix="/tps", tags=["TPS Management"])

@router.get("/public", response_model=List[TPSResponse])
def get_public_tps(db: Session = Depends(get_db)):
    """
    Get all active TPS for public display.
    No authentication required.
    Includes TPS without coordinates.
    """
    tps_list = get_active_public_tps(db)
    return tps_list

@router.get("/", response_model=List[TPSResponse])
def list_tps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    kecamatan: Optional[str] = None,
    wilayah_kota: Optional[str] = None,
    status: Optional[str] = None,
    kelurahan: Optional[str] = None,
    min_kapasitas: Optional[float] = None,
    max_kapasitas: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get TPS dengan filter:
    - search: cari berdasarkan nama, nama_lama, lokasi
    - kecamatan: filter berdasarkan kecamatan
    - kelurahan: filter berdasarkan kelurahan (dari tps_kelurahan)
    - wilayah_kota: filter berdasarkan wilayah kota
    - status: filter berdasarkan status (Aktif/Tidak Aktif)
    - min_kapasitas, max_kapasitas: filter berdasarkan daya_tampung_m3
    """
    query = db.query(TPS).options(db.joinedload(TPS.kelurahans))
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            and_(
                TPS.nama.like(search_pattern) |
                TPS.nama_lama.like(search_pattern) |
                TPS.lokasi.like(search_pattern) |
                TPS.kecamatan.like(search_pattern)
            )
        )
    
    if kecamatan:
        query = query.filter(TPS.kecamatan == kecamatan)
    if wilayah_kota:
        query = query.filter(TPS.wilayah_kota == wilayah_kota)
    if status:
        query = query.filter(TPS.status == status)
    if min_kapasitas is not None:
        query = query.filter(TPS.daya_tampung_m3 >= min_kapasitas)
    if max_kapasitas is not None:
        query = query.filter(TPS.daya_tampung_m3 <= max_kapasitas)
    
    # Kelurahan filter: join tps_kelurahan table
    if kelurahan:
        from models.tps_kelurahan import TPSKelurahan
        query = query.join(TPSKelurahan, TPS.id == TPSKelurahan.tps_id) \
                    .join(Kelurahan, TPSKelurahan.kelurahan_id == Kelurahan.id) \
                    .filter(Kelurahan.nama == kelurahan) \
                    .distinct()
    
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
