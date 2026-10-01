from sqlalchemy.orm import Session
from models.laporan import LaporanWarga
from schemas.laporan_schema import LaporanCreate, LaporanUpdate
from datetime import datetime
from typing import List, Optional

def create_laporan(db: Session, laporan_data: LaporanCreate) -> LaporanWarga:
    db_laporan = LaporanWarga(
        **laporan_data.dict(),
        tanggal_lapor=datetime.now()
    )
    db.add(db_laporan)
    db.commit()
    db.refresh(db_laporan)
    return db_laporan

def get_laporan_by_id(db: Session, laporan_id: int) -> Optional[LaporanWarga]:
    return db.query(LaporanWarga).filter(LaporanWarga.id == laporan_id).first()

def get_all_laporan(db: Session, skip: int = 0, limit: int = 100) -> List[LaporanWarga]:
    return db.query(LaporanWarga).order_by(LaporanWarga.tanggal_lapor.desc()).offset(skip).limit(limit).all()

def get_laporan_by_tps(db: Session, tps_id: int) -> List[LaporanWarga]:
    return db.query(LaporanWarga).filter(LaporanWarga.tps_id == tps_id).all()

def get_laporan_by_warga(db: Session, warga_id: int) -> List[LaporanWarga]:
    return db.query(LaporanWarga).filter(LaporanWarga.warga_id == warga_id).all()

def update_status_laporan(db: Session, laporan_id: int, status_data: LaporanUpdate, admin_id: Optional[int] = None) -> Optional[LaporanWarga]:
    db_laporan = get_laporan_by_id(db, laporan_id)
    if not db_laporan:
        return None
    
    if status_data.status_tindak_lanjut:
        db_laporan.status_tindak_lanjut = status_data.status_tindak_lanjut
    if status_data.catatan_admin:
        db_laporan.catatan_admin = status_data.catatan_admin
    if admin_id:
        db_laporan.ditindaklanjuti_oleh = admin_id
        
    db.commit()
    db.refresh(db_laporan)
    return db_laporan
