from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from schemas.tukar_reward_schema import (
    TukarRewardCreate,
    TukarRewardUpdate,
    TukarRewardResponse,
    TukarRewardHistoryResponse
)
from services.tukar_reward_service import (
    create_tukar_reward,
    get_tukar_by_id,
    get_tukar_by_warga,
    get_all_tukar,
    update_tukar_status,
    get_tukar_stats
)
from models.warga import Warga

router = APIRouter(prefix="/tukar-reward", tags=["Tukar Reward"])

@router.get("/", response_model=List[TukarRewardHistoryResponse])
def list_tukar_reward(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    warga_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List semua penukaran reward (bisa filter by warga_id atau status)"""
    
    if warga_id:
        # Verify warga exists
        warga = db.query(Warga).filter(Warga.id == warga_id).first()
        if not warga:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warga tidak ditemukan"
            )
        
        results = get_tukar_by_warga(db, warga_id, skip, limit)
        
        if status:
            results = [r for r in results if r.status == status]
        return results
    
    # Get all
    results = get_all_tukar(db, skip, limit)
    
    if status:
        results = [r for r in results if r.status == status]
    
    return results

@router.get("/{tukar_id}", response_model=TukarRewardResponse)
def get_tukar_reward(tukar_id: int, db: Session = Depends(get_db)):
    """Get detail penukaran reward by ID"""
    tukar = get_tukar_by_id(db, tukar_id)
    if not tukar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Penukaran reward tidak ditemukan"
        )
    return tukar

@router.post("/", response_model=TukarRewardResponse, status_code=status.HTTP_201_CREATED)
def buat_tukar_reward(tukar_data: TukarRewardCreate, db: Session = Depends(get_db)):
    """Buat penukaran reward baru (tukar poin ke saldo e-wallet)"""
    try:
        tukar = create_tukar_reward(db, tukar_data)
        return tukar
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal membuat penukaran reward: {str(e)}"
        )

@router.patch("/{tukar_id}/status", response_model=TukarRewardResponse)
def update_status_tukar(
    tukar_id: int,
    update_data: TukarRewardUpdate,
    db: Session = Depends(get_db)
):
    """Update status penukaran reward (admin/petugas)"""
    tukar = update_tukar_status(db, tukar_id, update_data)
    if not tukar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Penukaran reward tidak ditemukan"
        )
    return tukar

@router.get("/warga/{warga_id}/stats")
def get_stats_warga(warga_id: int, db: Session = Depends(get_db)):
    """Get statistik penukaran reward untuk warga tertentu"""
    # Verify warga exists
    warga = db.query(Warga).filter(Warga.id == warga_id).first()
    if not warga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warga tidak ditemukan"
        )
    
    try:
        stats = get_tukar_stats(db, warga_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengambil statistik: {str(e)}"
        )

# Endpoint untuk frontend integration (simplified)
@router.post("/simple-tukar")
def simple_tukar_reward(
    warga_id: int = Query(...),
    poin_digunakan: int = Query(...),
    ewallet_type: str = Query(...),
    nomor_ewallet: str = Query(...),
    atas_nama: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Simple endpoint untuk frontend tukar reward dengan data minimal"""
    
    warga = db.query(Warga).filter(Warga.id == warga_id).first()
    if not warga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data warga tidak ditemukan"
        )
    
    # Validasi poin
    current_pts = warga.total_poin or 0
    if current_pts < poin_digunakan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Poin tidak mencukupi. Poin saat ini: {current_pts}"
        )
    
    # Konversi poin ke rupiah (1 poin = 50 rupiah)
    NOMINAL_PER_POIN = 50
    nominal_rupiah = float(poin_digunakan * NOMINAL_PER_POIN)
    
    # Default title
    reward_title = f"Saldo {ewallet_type} - {poin_digunakan} poin"
    atas_nama_final = atas_nama or warga.nama
    
    try:
        tukar_data = TukarRewardCreate(
            warga_id=warga_id,
            poin_digunakan=poin_digunakan,
            reward_title=reward_title,
            ewallet_type=ewallet_type,
            nominal_rupiah=nominal_rupiah,
            nomor_ewallet=nomor_ewallet,
            atas_nama=atas_nama_final,
            catatan=f"Penukaran via frontend web"
        )
        
        tukar = create_tukar_reward(db, tukar_data)
        
        return {
            "status": "success",
            "message": f"Penukaran {reward_title} ke {ewallet_type} ({nomor_ewallet}) berhasil diproses!",
            "sisa_poin": warga.total_poin,
            "detail": {
                "reward_title": reward_title,
                "ewallet_type": ewallet_type,
                "nominal": f"Rp {nominal_rupiah:,.0f}",
                "nomor_ewallet": nomor_ewallet,
                "atas_nama": atas_nama_final,
                "poin_digunakan": poin_digunakan,
                "tukar_id": tukar.id
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menukar reward: {str(e)}"
        )
