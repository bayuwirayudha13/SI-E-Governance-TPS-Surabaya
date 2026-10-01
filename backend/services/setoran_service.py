from sqlalchemy.orm import Session
from models.setoran import SetoranSampah
from models.warga import Warga
from schemas.setoran_schema import Setoran_SampahCreate, Setoran_SampahUpdate
from datetime import datetime
from typing import List, Optional
import secrets

# Konversi berat ke poin (contoh: 1 kg = 10 poin)
BERAT_TO_POIN_RATIO = 10

def generate_qr_code() -> str:
    return "QR-" + secrets.token_hex(8).upper()

def create_setoran(db: Session, setoran_data: Setoran_SampahCreate) -> SetoranSampah:
    # Generate QR code unik
    qr = generate_qr_code()
    
    db_setoran = SetoranSampah(
        **setoran_data.dict(),
        qr_code=qr,
        waktu_setor=datetime.now()
    )
    
    db.add(db_setoran)
    db.commit()
    db.refresh(db_setoran)
    return db_setoran

def get_setoran_by_id(db: Session, setoran_id: int) -> Optional[SetoranSampah]:
    return db.query(SetoranSampah).filter(SetoranSampah.id == setoran_id).first()

def get_all_setoran(db: Session, skip: int = 0, limit: int = 100) -> List[SetoranSampah]:
    return db.query(SetoranSampah).order_by(SetoranSampah.waktu_setor.desc()).offset(skip).limit(limit).all()

def get_setoran_by_warga(db: Session, warga_id: int) -> List[SetoranSampah]:
    return db.query(SetoranSampah).filter(SetoranSampah.warga_id == warga_id).all()

def get_setoran_by_status(db: Session, status: str) -> List[SetoranSampah]:
    return db.query(SetoranSampah).filter(SetoranSampah.status == status).all()

def update_setoran_status(db: Session, setoran_id: int, update_data: Setoran_SampahUpdate, petugas_id: Optional[int] = None) -> Optional[SetoranSampah]:
    db_setoran = get_setoran_by_id(db, setoran_id)
    if not db_setoran:
        return None
    
    if update_data.status:
        db_setoran.status = update_data.status
        
    if update_data.poin_diperoleh is not None:
        db_setoran.poin_diperoleh = update_data.poin_diperoleh
        # Update total poin warga
        warga = db.query(Warga).filter(Warga.id == db_setoran.warga_id).first()
        if warga:
            warga.total_poin = (warga.total_poin or 0) + update_data.poin_diperoleh
    
    if petugas_id:
        db_setoran.petugas_id = petugas_id
        
    if update_data.status == 'Sudah Divalidasi' and not db_setoran.waktu_validasi:
        db_setoran.waktu_validasi = datetime.now()
        
    db.commit()
    db.refresh(db_setoran)
    return db_setoran

def hitung_poin_dari_berat(berat_kg: float) -> int:
    return int(berat_kg * BERAT_TO_POIN_RATIO)
