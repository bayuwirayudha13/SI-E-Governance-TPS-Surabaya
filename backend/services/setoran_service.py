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
        
    if update_data.berat_aktual_kg is not None:
        db_setoran.berat_aktual_kg = update_data.berat_aktual_kg
        # Automatically calculate points if not provided
        if update_data.poin_diperoleh is None:
            update_data.poin_diperoleh = hitung_poin_dari_berat(float(update_data.berat_aktual_kg))
            
    if update_data.jenis_sampah_terverifikasi is not None:
        db_setoran.jenis_sampah_terverifikasi = update_data.jenis_sampah_terverifikasi
    if update_data.kondisi_sampah is not None:
        db_setoran.kondisi_sampah = update_data.kondisi_sampah
    if update_data.hasil_pemeriksaan is not None:
        db_setoran.hasil_pemeriksaan = update_data.hasil_pemeriksaan
    if update_data.catatan_petugas is not None:
        db_setoran.catatan_petugas = update_data.catatan_petugas
    if update_data.foto_bukti_url is not None:
        db_setoran.foto_bukti_url = update_data.foto_bukti_url

    if update_data.poin_diperoleh is not None and db_setoran.poin_diperoleh != update_data.poin_diperoleh:
        diff_poin = update_data.poin_diperoleh - (db_setoran.poin_diperoleh or 0)
        db_setoran.poin_diperoleh = update_data.poin_diperoleh
        warga = db.query(Warga).filter(Warga.id == db_setoran.warga_id).first()
        if warga:
            warga.total_poin = max(0, (warga.total_poin or 0) + diff_poin)
    elif update_data.poin_diperoleh is not None and db_setoran.poin_diperoleh is None:
        db_setoran.poin_diperoleh = update_data.poin_diperoleh
        warga = db.query(Warga).filter(Warga.id == db_setoran.warga_id).first()
        if warga:
            warga.total_poin = (warga.total_poin or 0) + update_data.poin_diperoleh
    
    if petugas_id:
        db_setoran.petugas_id = petugas_id
        
    if update_data.status == 'Sudah Divalidasi' and not db_setoran.waktu_validasi:
        db_setoran.waktu_validasi = datetime.now()
        if not db_setoran.waktu_pemeriksaan:
            db_setoran.waktu_pemeriksaan = datetime.now()
            
    db.commit()
    db.refresh(db_setoran)
    return db_setoran

def get_setoran_by_qr(db: Session, qr_code: str) -> Optional[SetoranSampah]:
    return db.query(SetoranSampah).filter(SetoranSampah.qr_code == qr_code).first()

def get_pending_queue(db: Session, kecamatan: Optional[str] = None, kelurahan: Optional[str] = None) -> List[SetoranSampah]:
    query = db.query(SetoranSampah).filter(SetoranSampah.status.in_(['Menunggu Penjemputan', 'Sedang Diproses']))
    if kelurahan:
        # join with Warga to filter by kelurahan
        query = query.join(Warga, SetoranSampah.warga_id == Warga.id).filter(Warga.kelurahan == kelurahan)
    elif kecamatan:
        query = query.join(Warga, SetoranSampah.warga_id == Warga.id).filter(Warga.kecamatan == kecamatan)
    return query.order_by(SetoranSampah.waktu_setor.asc()).all()

def get_daily_stats(db: Session, petugas_id: int, target_date) -> dict:
    from sqlalchemy import func, cast, Date
    completed = db.query(SetoranSampah).filter(
        SetoranSampah.petugas_id == petugas_id,
        SetoranSampah.status == 'Sudah Divalidasi',
        cast(SetoranSampah.waktu_validasi, Date) == target_date
    ).all()
    
    completed_count = len(completed)
    total_kg = sum([float(s.berat_aktual_kg) for s in completed if s.berat_aktual_kg])
    
    return {
        "completed_count": completed_count,
        "total_kg": round(total_kg, 2)
    }

def get_petugas_history(db: Session, petugas_id: int, limit: int = 50) -> List[SetoranSampah]:
    return db.query(SetoranSampah).filter(
        SetoranSampah.petugas_id == petugas_id,
        SetoranSampah.status == 'Sudah Divalidasi'
    ).order_by(SetoranSampah.waktu_validasi.desc()).limit(limit).all()

def hitung_poin_dari_berat(berat_kg: float) -> int:
    """Hitung poin berdasarkan berat (default 10 poin per kg)"""
    return int(round(berat_kg * BERAT_TO_POIN_RATIO))
