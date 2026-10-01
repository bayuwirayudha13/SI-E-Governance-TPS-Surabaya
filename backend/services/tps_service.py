from sqlalchemy.orm import Session
from models.tps import TPS
from schemas.tps_schema import TPSCreate, TPSUpdate
from typing import List

def get_all_tps(db: Session, skip: int = 0, limit: int = 100) -> List[TPS]:
    """Get all TPS dengan pagination"""
    return db.query(TPS).offset(skip).limit(limit).all()

def get_tps_by_id(db: Session, tps_id: int) -> TPS:
    """Get TPS by ID"""
    return db.query(TPS).filter(TPS.id == tps_id).first()

def get_tps_by_kecamatan(db: Session, kecamatan: str) -> List[TPS]:
    """Get TPS by kecamatan"""
    return db.query(TPS).filter(TPS.kecamatan == kecamatan).all()

def get_tps_by_status(db: Session, status: str) -> List[TPS]:
    """Get TPS by status"""
    return db.query(TPS).filter(TPS.status == status).all()

def create_tps(db: Session, tps_data: TPSCreate) -> TPS:
    """Create new TPS"""
    db_tps = TPS(**tps_data.dict())
    db.add(db_tps)
    db.commit()
    db.refresh(db_tps)
    return db_tps

def update_tps(db: Session, tps_id: int, tps_data: TPSUpdate) -> TPS:
    """Update TPS"""
    db_tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not db_tps:
        return None
    
    update_data = tps_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tps, field, value)
    
    db.commit()
    db.refresh(db_tps)
    return db_tps

def delete_tps(db: Session, tps_id: int) -> bool:
    """Delete TPS"""
    db_tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not db_tps:
        return False
    
    db.delete(db_tps)
    db.commit()
    return True
