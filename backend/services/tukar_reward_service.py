from sqlalchemy.orm import Session
from models.tukar_reward import TukarRewardHistory
from models.warga import Warga
from schemas.tukar_reward_schema import TukarRewardCreate, TukarRewardUpdate
from typing import List, Optional
from datetime import datetime

def create_tukar_reward(db: Session, tukar_data: TukarRewardCreate) -> TukarRewardHistory:
    """Buat penukaran reward baru & kurangi poin warga"""
    
    # Cek warga exist
    warga = db.query(Warga).filter(Warga.id == tukar_data.warga_id).first()
    if not warga:
        raise ValueError(f"Warga dengan ID {tukar_data.warga_id} tidak ditemukan")
    
    # Validasi poin cukup
    current_poin = warga.total_poin or 0
    if current_poin < tukar_data.poin_digunakan:
        raise ValueError(f"Poin tidak mencukupi. Poin saat ini: {current_poin}, dibutuhkan: {tukar_data.poin_digunakan}")
    
    # Kurangi poin warga
    warga.total_poin = current_poin - tukar_data.poin_digunakan
    
    # Buat record tukar reward
    db_tukar = TukarRewardHistory(
        **tukar_data.dict(),
        status='Diproses'
    )
    
    db.add(db_tukar)
    db.commit()
    db.refresh(db_tukar)
    
    return db_tukar

def get_tukar_by_id(db: Session, tukar_id: int) -> Optional[TukarRewardHistory]:
    return db.query(TukarRewardHistory).filter(TukarRewardHistory.id == tukar_id).first()

def get_tukar_by_warga(db: Session, warga_id: int, skip: int = 0, limit: int = 50) -> List[TukarRewardHistory]:
    return db.query(TukarRewardHistory)\
        .filter(TukarRewardHistory.warga_id == warga_id)\
        .order_by(TukarRewardHistory.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_all_tukar(db: Session, skip: int = 0, limit: int = 100) -> List[TukarRewardHistory]:
    return db.query(TukarRewardHistory)\
        .order_by(TukarRewardHistory.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

def update_tukar_status(db: Session, tukar_id: int, update_data: TukarRewardUpdate) -> Optional[TukarRewardHistory]:
    """Update status penukaran reward"""
    db_tukar = get_tukar_by_id(db, tukar_id)
    if not db_tukar:
        return None
    
    if update_data.status:
        db_tukar.status = update_data.status
    
    if update_data.catatan is not None:
        db_tukar.catatan = update_data.catatan
    
    db_tukar.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_tukar)
    return db_tukar

def get_tukar_stats(db: Session, warga_id: int) -> dict:
    """Ambil statistik penukaran reward warga"""
    
    # Total poin yang telah ditukar
    total_tukar = db.query(TukarRewardHistory)\
        .filter(TukarRewardHistory.warga_id == warga_id)\
        .all()
    
    total_poin_tukar = sum(t.poin_digunakan for t in total_tukar)
    total_rupiah_tukar = sum(float(t.nominal_rupiah or 0) for t in total_tukar)
    
    # Group by status
    status_breakdown = {}
    for tukar in total_tukar:
        status = tukar.status
        if status not in status_breakdown:
            status_breakdown[status] = 0
        status_breakdown[status] += 1
    
    return {
        'total_transaksi': len(total_tukar),
        'total_poin_tukar': total_poin_tukar,
        'total_rupiah_tukar': total_rupiah_tukar,
        'status_breakdown': status_breakdown
    }
