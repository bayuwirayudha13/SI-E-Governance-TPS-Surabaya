from sqlalchemy.orm import Session
from models.users import Admin, PetugasPengangkut
from models.warga import Warga
from models.tps import TPS
from schemas.user_schema import AdminCreate, AdminUpdate, PetugasCreate, PetugasUpdate, WargaCreate, WargaUpdate
from passlib.context import CryptContext
from typing import List, Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Admin Management ---
def create_admin(db: Session, admin_data: AdminCreate) -> Admin:
    """Create new admin account"""
    existing = db.query(Admin).filter(Admin.username == admin_data.username).first()
    if existing:
        raise ValueError(f"Username '{admin_data.username}' sudah terdaftar")
    
    hashed_pwd = pwd_context.hash(admin_data.password)
    db_admin = Admin(
        username=admin_data.username,
        password_hash=hashed_pwd,
        nama=admin_data.nama,
        role=admin_data.role
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

def get_admin_by_id(db: Session, admin_id: int) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.id == admin_id).first()

def get_admin_by_username(db: Session, username: str) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.username == username).first()

def list_admins(db: Session, skip: int = 0, limit: int = 100) -> List[Admin]:
    return db.query(Admin).offset(skip).limit(limit).all()

def update_admin(db: Session, admin_id: int, update_data: AdminUpdate) -> Optional[Admin]:
    """Update admin account"""
    admin = get_admin_by_id(db, admin_id)
    if not admin:
        return None
    
    if update_data.username:
        existing = db.query(Admin).filter(Admin.username == update_data.username, Admin.id != admin_id).first()
        if existing:
            raise ValueError(f"Username '{update_data.username}' sudah digunakan")
        admin.username = update_data.username
    
    if update_data.password:
        admin.password_hash = pwd_context.hash(update_data.password)
    
    if update_data.nama:
        admin.nama = update_data.nama
    
    if update_data.role:
        admin.role = update_data.role
    
    db.commit()
    db.refresh(admin)
    return admin

def delete_admin(db: Session, admin_id: int) -> bool:
    """Delete admin account"""
    admin = get_admin_by_id(db, admin_id)
    if not admin:
        return False
    db.delete(admin)
    db.commit()
    return True

# --- Petugas Management ---
def create_petugas(db: Session, petugas_data: PetugasCreate) -> PetugasPengangkut:
    """Create new petugas account"""
    existing = db.query(PetugasPengangkut).filter(PetugasPengangkut.username == petugas_data.username).first()
    if existing:
        raise ValueError(f"Username '{petugas_data.username}' sudah terdaftar")
    
    hashed_pwd = pwd_context.hash(petugas_data.password)
    db_petugas = PetugasPengangkut(
        nama=petugas_data.nama,
        no_hp=petugas_data.no_hp,
        username=petugas_data.username,
        password_hash=hashed_pwd,
        wilayah_tugas=petugas_data.wilayah_tugas,
        status=petugas_data.status
    )
    db.add(db_petugas)
    db.commit()
    db.refresh(db_petugas)
    return db_petugas

def get_petugas_by_id(db: Session, petugas_id: int) -> Optional[PetugasPengangkut]:
    return db.query(PetugasPengangkut).filter(PetugasPengangkut.id == petugas_id).first()

def get_petugas_by_username(db: Session, username: str) -> Optional[PetugasPengangkut]:
    return db.query(PetugasPengangkut).filter(PetugasPengangkut.username == username).first()

def list_petugas(db: Session, skip: int = 0, limit: int = 100) -> List[PetugasPengangkut]:
    return db.query(PetugasPengangkut).offset(skip).limit(limit).all()

def update_petugas(db: Session, petugas_id: int, update_data: PetugasUpdate) -> Optional[PetugasPengangkut]:
    """Update petugas account"""
    petugas = get_petugas_by_id(db, petugas_id)
    if not petugas:
        return None
    
    if update_data.username:
        existing = db.query(PetugasPengangkut).filter(PetugasPengangkut.username == update_data.username, PetugasPengangkut.id != petugas_id).first()
        if existing:
            raise ValueError(f"Username '{update_data.username}' sudah digunakan")
        petugas.username = update_data.username
    
    if update_data.password:
        petugas.password_hash = pwd_context.hash(update_data.password)
    
    if update_data.nama:
        petugas.nama = update_data.nama
    
    if update_data.no_hp:
        petugas.no_hp = update_data.no_hp
    
    if update_data.wilayah_tugas:
        petugas.wilayah_tugas = update_data.wilayah_tugas
    
    if update_data.status:
        petugas.status = update_data.status
    
    db.commit()
    db.refresh(petugas)
    return petugas

def delete_petugas(db: Session, petugas_id: int) -> bool:
    """Delete petugas account"""
    petugas = get_petugas_by_id(db, petugas_id)
    if not petugas:
        return False
    db.delete(petugas)
    db.commit()
    return True

# --- Warga Management ---
def list_warga(db: Session, skip: int = 0, limit: int = 100) -> List[Warga]:
    return db.query(Warga).offset(skip).limit(limit).all()

def get_warga_by_id(db: Session, warga_id: int) -> Optional[Warga]:
    return db.query(Warga).filter(Warga.id == warga_id).first()

def update_warga_status(db: Session, warga_id: int, email_verified: int) -> Optional[Warga]:
    """Approve/verify warga account"""
    warga = get_warga_by_id(db, warga_id)
    if not warga:
        return None
    warga.email_verified = email_verified
    db.commit()
    db.refresh(warga)
    return warga

def delete_warga(db: Session, warga_id: int) -> bool:
    """Delete warga account"""
    warga = get_warga_by_id(db, warga_id)
    if not warga:
        return False
    db.delete(warga)
    db.commit()
    return True

# --- Dashboard Stats ---
def get_dashboard_stats(db: Session) -> dict:
    """Get stats for dashboard: total users, warga count, active petugas, pending verifications"""
    total_users = db.query(Warga).count() + db.query(PetugasPengangkut).count() + db.query(Admin).count()
    warga_count = db.query(Warga).count()
    active_petugas = db.query(PetugasPengangkut).filter(PetugasPengangkut.status == 'Aktif').count()
    pending_users = db.query(Warga).filter(Warga.email_verified == 0).count()
    
    return {
        "total_users": total_users,
        "warga_count": warga_count,
        "active_petugas": active_petugas,
        "pending_verifications": pending_users
    }

def get_recent_registrations(db: Session, limit: int = 4) -> List[Warga]:
    """Get recent warga registrations"""
    return db.query(Warga).order_by(Warga.created_at.desc()).limit(limit).all()

def get_tps_status_list(db: Session) -> List[dict]:
    """Get all TPS with status info"""
    tps_list = db.query(TPS).all()
    result = []
    for tps in tps_list:
        # TODO: Calculate capacity percentage from setoran data
        result.append({
            "id": tps.id,
            "nama": tps.nama,
            "kecamatan": tps.kecamatan,
            "status": tps.status,
            "daya_tampung": tps.daya_tampung_m3,
            "latitude": float(tps.latitude) if tps.latitude else None,
            "longitude": float(tps.longitude) if tps.longitude else None
        })
    return result
