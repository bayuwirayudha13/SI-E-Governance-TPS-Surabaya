from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import List
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
            "is_active": u.is_active
        }
        for u in users
    ]

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
        is_active=True
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
