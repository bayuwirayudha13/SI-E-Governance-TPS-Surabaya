from sqlalchemy.orm import Session
from models.jadwal import JadwalPengambilan
from models.users import User
from schemas.jadwal_schema import JadwalCreate, JadwalUpdate
from typing import List, Optional

def get_all_jadwal(db: Session, skip: int = 0, limit: int = 100) -> List[JadwalPengambilan]:
    return db.query(JadwalPengambilan).offset(skip).limit(limit).all()

def get_jadwal_by_wilayah(db: Session, kecamatan: str, kelurahan: str) -> List[JadwalPengambilan]:
    return db.query(JadwalPengambilan).filter(
        JadwalPengambilan.kecamatan == kecamatan,
        JadwalPengambilan.kelurahan == kelurahan
    ).all()

def get_jadwal_by_id(db: Session, jadwal_id: int) -> Optional[JadwalPengambilan]:
    return db.query(JadwalPengambilan).filter(JadwalPengambilan.id == jadwal_id).first()

def validate_petugas(db: Session, petugas_id: int, kecamatan: str, kelurahan: str):
    petugas = db.query(User).filter(
        User.id == petugas_id,
        User.role == "petugas",
        User.is_active == True
    ).first()
    
    if not petugas:
        raise Exception("Petugas tidak ditemukan, tidak aktif, atau bukan role petugas")
    
    if petugas.wilayah_kecamatan != kecamatan or petugas.wilayah_kelurahan != kelurahan:
        raise Exception(f"Wilayah petugas ({petugas.wilayah_kecamatan}/{petugas.wilayah_kelurahan}) tidak sesuai dengan wilayah jadwal ({kecamatan}/{kelurahan})")
    
    return petugas

def create_jadwal(db: Session, jadwal_data: JadwalCreate) -> JadwalPengambilan:
    data = jadwal_data.dict()
    
    # Sync petugas name from User table if petugas_id is provided
    if data.get("petugas_id"):
        petugas = validate_petugas(db, data["petugas_id"], data.get("kecamatan"), data.get("kelurahan"))
        data["petugas"] = petugas.nama_lengkap
    elif not data.get("petugas"):
        data["petugas"] = ""
    
    db_jadwal = JadwalPengambilan(**data)
    db.add(db_jadwal)
    db.commit()
    db.refresh(db_jadwal)
    return db_jadwal

def update_jadwal(db: Session, jadwal_id: int, jadwal_data: JadwalUpdate) -> Optional[JadwalPengambilan]:
    db_jadwal = db.query(JadwalPengambilan).filter(JadwalPengambilan.id == jadwal_id).first()
    if not db_jadwal:
        return None
    
    update_data = jadwal_data.dict(exclude_unset=True)
    
    # Validation logic
    kec = update_data.get("kecamatan", db_jadwal.kecamatan)
    kel = update_data.get("kelurahan", db_jadwal.kelurahan)
    
    if "petugas_id" in update_data and update_data["petugas_id"]:
        petugas = validate_petugas(db, update_data["petugas_id"], kec, kel)
        update_data["petugas"] = petugas.nama_lengkap
    
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

def get_eligible_petugas(db: Session, kecamatan: str, kelurahan: str) -> List[User]:
    return db.query(User).filter(
        User.role.in_(["petugas_pengangkut", "driver"]),
        User.is_active == True,
        User.wilayah_kecamatan == kecamatan,
        User.wilayah_kelurahan == kelurahan
    ).all()
