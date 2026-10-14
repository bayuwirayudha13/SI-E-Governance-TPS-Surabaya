from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from schemas.setoran_schema import (
    Setoran_SampahCreate,
    Setoran_SampahUpdate,
    Setoran_SampahResponse
)
from services.setoran_service import (
    create_setoran,
    get_setoran_by_id,
    get_all_setoran,
    get_setoran_by_warga,
    get_setoran_by_status,
    update_setoran_status,
    hitung_poin_dari_berat
)

router = APIRouter(prefix="/setoran", tags=["Setoran Sampah"])

@router.get("/", response_model=List[Setoran_SampahResponse])
def list_setoran(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    warga_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List semua setoran sampah (bisa filter by warga_id atau status)"""
    if warga_id:
        return get_setoran_by_warga(db, warga_id)
    elif status:
        return get_setoran_by_status(db, status)
    return get_all_setoran(db, skip, limit)

@router.get("/{setoran_id}", response_model=Setoran_SampahResponse)
def get_setoran(setoran_id: int, db: Session = Depends(get_db)):
    """Get detail setoran by ID"""
    setoran = get_setoran_by_id(db, setoran_id)
    if not setoran:
        raise HTTPException(status_code=404, detail="Setoran tidak ditemukan")
    return setoran

@router.post("/", response_model=Setoran_SampahResponse, status_code=201)
def buat_setoran(setoran_data: Setoran_SampahCreate, db: Session = Depends(get_db)):
    """Buat pencatatan setoran sampah baru / penjemputan"""
    try:
        return create_setoran(db, setoran_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal mencatat setoran: {str(e)}")

@router.patch("/{setoran_id}/status", response_model=Setoran_SampahResponse)
def update_status_setoran(
    setoran_id: int,
    update_data: Setoran_SampahUpdate,
    petugas_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Validasi setoran oleh petugas/admin dan otomatis hitung/tambah poin warga"""
    # Jika status menjadi 'Sudah Divalidasi' dan poin belum diisi, otomatis hitung dari perkiraan berat
    if update_data.status == 'Sudah Divalidasi' and update_data.poin_diperoleh is None:
        db_setoran = get_setoran_by_id(db, setoran_id)
        if db_setoran and db_setoran.perkiraan_berat_kg:
            update_data.poin_diperoleh = hitung_poin_dari_berat(float(db_setoran.perkiraan_berat_kg))
            
    setoran = update_setoran_status(db, setoran_id, update_data, petugas_id)
    if not setoran:
        raise HTTPException(status_code=404, detail="Setoran tidak ditemukan")
    return setoran

from pydantic import BaseModel
from models.warga import Warga

class TukarRewardRequest(BaseModel):
    warga_id: int
    reward_title: str
    ewallet_type: str
    nominal: str
    poin_digunakan: int
    nomor_ewallet: Optional[str] = None
    atas_nama: Optional[str] = None
    catatan: Optional[str] = None

@router.post("/tukar-reward")
def tukar_reward(data: TukarRewardRequest, db: Session = Depends(get_db)):
    """Penukaran poin warga menjadi saldo e-wallet dengan data lengkap penerima"""
    warga = db.query(Warga).filter(Warga.id == data.warga_id).first()
    if not warga:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan")
    current_pts = warga.total_poin or 0
    if current_pts < data.poin_digunakan:
        raise HTTPException(status_code=400, detail="Poin tidak mencukupi untuk penukaran ini")
    
    warga.total_poin = current_pts - data.poin_digunakan
    # Simpan no_hp jika warga belum memiliki no_hp
    if data.nomor_ewallet and not warga.no_hp:
        warga.no_hp = data.nomor_ewallet
    db.commit()
    db.refresh(warga)
    return {
        "status": "success",
        "message": f"Penukaran {data.reward_title} ke {data.ewallet_type} ({data.nomor_ewallet}) berhasil!",
        "sisa_poin": warga.total_poin,
        "detail": {
            "reward_title": data.reward_title,
            "ewallet_type": data.ewallet_type,
            "nominal": data.nominal,
            "nomor_ewallet": data.nomor_ewallet,
            "atas_nama": data.atas_nama,
            "poin_digunakan": data.poin_digunakan
        }
    }


