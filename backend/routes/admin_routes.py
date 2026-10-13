from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from datetime import datetime
from models.users import User
from models.settings import SystemSettings
from schemas.user_schema import (
    AdminCreate, AdminUpdate, AdminResponse,
    PetugasCreate, PetugasUpdate, PetugasResponse
)
from schemas.settings_schema import SystemSettingsResponse, SystemSettingsUpdate
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import uuid
import shutil

router = APIRouter(prefix="/admin", tags=["Admin Panel"])
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_current_user_from_token(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token tidak valid atau tidak ditemukan")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token tidak valid")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    return user

def get_current_admin(user: User = Depends(get_current_user_from_token)) -> User:
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Akses khusus Admin / Super Admin")
    return user

def get_current_superadmin(user: User = Depends(get_current_user_from_token)) -> User:
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Akses khusus Super Admin")
    return user

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    total_users = db.query(User).count()
    active_petugas = db.query(User).filter(User.role == "petugas", User.is_active == True).count()
    return {
        "total_users": total_users,
        "active_petugas": active_petugas,
        "role": current_user.role
    }

@router.get("/users", response_model=List[dict])
def list_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "nama_lengkap": u.nama_lengkap,
            "role": u.role,
            "is_active": u.is_active,
            "wilayah_kecamatan": getattr(u, "wilayah_kecamatan", None),
            "wilayah_kelurahan": getattr(u, "wilayah_kelurahan", None),
            "wilayah_kota": getattr(u, "wilayah_kota", None),
            "foto_url": getattr(u, "foto_url", None),
        }
        for u in users
    ]

@router.get("/users/{user_id}")
def detail_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Detail petugas/admin untuk tombol View (merah): data + foto + wilayah."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "nama_lengkap": u.nama_lengkap,
        "role": u.role,
        "is_active": u.is_active,
        "wilayah_kecamatan": getattr(u, "wilayah_kecamatan", None),
        "wilayah_kelurahan": getattr(u, "wilayah_kelurahan", None),
        "wilayah_kota": getattr(u, "wilayah_kota", None),
        "foto_url": getattr(u, "foto_url", None),
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }

@router.put("/users/{user_id}", response_model=dict)
def update_user_account(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Edit petugas/admin (tombol hijau): nama, role, wilayah, foto_url."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if data.get("nama_lengkap"):
        u.nama_lengkap = data["nama_lengkap"]
    if data.get("role") in ("admin", "petugas", "driver", "superadmin"):
        u.role = data["role"]
    if "wilayah_kecamatan" in data:
        u.wilayah_kecamatan = (data["wilayah_kecamatan"] or "").strip() or None
    if "wilayah_kelurahan" in data:
        u.wilayah_kelurahan = (data["wilayah_kelurahan"] or "").strip() or None
    if "wilayah_kota" in data:
        u.wilayah_kota = (data["wilayah_kota"] or "").strip() or "Surabaya"
    if "foto_url" in data:
        u.foto_url = data["foto_url"] or None
    if "is_active" in data:
        u.is_active = bool(data["is_active"])
    if data.get("password"):
        u.hashed_password = pwd_context.hash(data["password"])
    db.commit()
    db.refresh(u)
    return {
        "message": "User berhasil diperbarui",
        "id": u.id,
        "nama_lengkap": u.nama_lengkap,
        "role": u.role,
        "wilayah_kecamatan": u.wilayah_kecamatan,
        "wilayah_kelurahan": u.wilayah_kelurahan,
        "wilayah_kota": u.wilayah_kota,
        "foto_url": u.foto_url,
    }

@router.post("/users/{user_id}/foto")
def upload_user_foto(
    user_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Upload foto petugas/admin. Simpan ke /uploads/petugas/."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    ext = (foto.filename or "").rsplit(".", 1)[-1].lower() if "." in (foto.filename or "") else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Format foto harus jpg/png/webp")
    folder = "uploads/petugas"
    os.makedirs(folder, exist_ok=True)
    fname = f"petugas_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    fpath = os.path.join(folder, fname)
    with open(fpath, "wb") as f:
        shutil.copyfileobj(foto.file, f)
    u.foto_url = f"/{fpath}".replace("//", "/")
    db.commit()
    db.refresh(u)
    return {"message": "Foto berhasil diupload", "foto_url": u.foto_url}

@router.put("/users/{user_id}/wilayah")
def update_user_wilayah(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Superadmin set wilayah kerja petugas: kecamatan + kelurahan (hijau di petugas header)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    # optional: validasi kecamatan/kelurahan ada di master wilayah
    kec = data.get("wilayah_kecamatan")
    kel = data.get("wilayah_kelurahan")
    kota = data.get("wilayah_kota", "Surabaya")
    if kec is not None:
        user.wilayah_kecamatan = kec.strip() if kec.strip() else None
    if kel is not None:
        user.wilayah_kelurahan = kel.strip() if kel.strip() else None
    if kota is not None:
        user.wilayah_kota = kota.strip() if kota.strip() else "Surabaya"
    db.commit()
    db.refresh(user)
    return {
        "message": "Wilayah kerja petugas diperbarui",
        "id": user.id,
        "wilayah_kecamatan": user.wilayah_kecamatan,
        "wilayah_kelurahan": user.wilayah_kelurahan,
        "wilayah_kota": user.wilayah_kota,
    }

@router.post("/users", status_code=201)
def create_user_account(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    email = data.get("email")
    if not email or not email.endswith("@sipetasan.com"):
        raise HTTPException(status_code=400, detail="Email harus menggunakan domain @sipetasan.com")
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    hashed_pw = pwd_context.hash(data.get("password", "password123"))
    new_user = User(
        username=data.get("username", email.split("@")[0]),
        email=email,
        hashed_password=hashed_pw,
        nama_lengkap=data.get("nama_lengkap", "User Si Petasan"),
        role=data.get("role", "petugas"),
        is_active=True,
        wilayah_kecamatan=data.get("wilayah_kecamatan"),
        wilayah_kelurahan=data.get("wilayah_kelurahan"),
        wilayah_kota=data.get("wilayah_kota", "Surabaya"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User berhasil dibuat", "id": new_user.id, "email": new_user.email, "role": new_user.role}

@router.delete("/users/{user_id}")
def delete_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus akun sendiri")
    
    db.delete(user)
    db.commit()
    return {"message": "User berhasil dihapus"}

# Chat routes
@router.get("/chat/messages")
def get_chat_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    from models.chat import ChatMessage
    messages = db.query(ChatMessage).order_by(ChatMessage.timestamp.asc()).limit(100).all()
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": m.sender_name,
            "receiver_id": m.receiver_id,
            "message": m.message,
            "timestamp": m.timestamp.isoformat()
        }
        for m in messages
    ]

@router.post("/chat/send")
def send_chat_message(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    from models.chat import ChatMessage
    receiver_id = data.get("receiver_id")
    message = data.get("message")
    if not receiver_id or not message:
        raise HTTPException(status_code=400, detail="receiver_id dan message wajib diisi")
    
    new_msg = ChatMessage(
        sender_id=current_user.id,
        sender_name=current_user.nama_lengkap,
        receiver_id=receiver_id,
        message=message,
        timestamp=datetime.utcnow()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return {"message": "Chat berhasil dikirim", "id": new_msg.id}

# List warga (admin read-only)
@router.get("/warga")
def list_warga(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    from models.warga import Warga
    wargas = db.query(Warga).order_by(Warga.created_at.desc()).all()
    return [
        {
            "id": w.id,
            "nama": w.nama,
            "email": w.email,
            "no_hp": w.no_hp,
            "total_poin": w.total_poin,
            "created_at": w.created_at.isoformat() if w.created_at else None
        }
        for w in wargas
    ]

# Settings routes for Superadmin
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/settings", response_model=SystemSettingsResponse)
def get_system_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=SystemSettingsResponse)
def update_system_settings(
    data: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)
    
    if data.website_name:
        settings.website_name = data.website_name
    if data.website_email:
        settings.website_email = data.website_email
    
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Password saat ini wajib diisi untuk mengganti password")
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Password saat ini tidak sesuai")
        settings.admin_password_hash = pwd_context.hash(data.new_password)
        current_user.hashed_password = pwd_context.hash(data.new_password)
    
    db.commit()
    db.refresh(settings)
    return settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
