from sqlalchemy.orm import Session
from models.jadwal import JadwalPengambilan
from schemas.jadwal_schema import JadwalCreate, JadwalUpdate
from typing import List

def get_all_jadwal(db: Session, skip: int = 0, limit: int = 100) -> List[JadwalPengambilan]:
    return db.query(JadwalPengambilan).offset(skip).limit(limit).all()

def get_jadwal_by_id(db: Session, jadwal_id: int) -> JadwalPengambilan:
    return db.query(JadwalPengambilan).filter(JadwalPengambilan.id == jadwal_id).first()

def create_jadwal(db: Session, jadwal_data: JadwalCreate) -> JadwalPengambilan:
    db_jadwal = JadwalPengambilan(**jadwal_data.dict())
    db.add(db_jadwal)
    db.commit()
    db.refresh(db_jadwal)
    return db_jadwal

def update_jadwal(db: Session, jadwal_id: int, jadwal_data: JadwalUpdate) -> JadwalPengambilan:
    db_jadwal = db.query(JadwalPengambilan).filter(JadwalPengambilan.id == jadwal_id).first()
    if not db_jadwal:
        return None
    
    update_data = jadwal_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_jadwal, field, value)
    
    db.commit()
    db.refresh(db_jadwal)
    return db_jadwal

def delete_jadwal(db: Session, jadwal_id: int) -> bool:
    db_jadwal = db.query(JadwalPengambilan).filter(JadwalPengambilan.id == jadwal_id).first()
    if not db_jadwal:
        return False
    
    db.delete(db_jadwal)
    db.commit()
    return True
