from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from core.database import get_db
from models.users import User
from models.warga import Warga
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"


def get_current_user_from_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """
    Extract JWT token from Authorization header, verify it, query User/Warga,
    and return user data dict with id, email, role, wilayah fields.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # Decode JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        
        if email is None or role is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Query User table for petugas/admin/driver
    if role in ["petugas", "admin", "superadmin", "driver"]:
        user = db.query(User).filter(User.id == user_id, User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "id": user.id,
            "email": user.email,
            "nama_lengkap": user.nama_lengkap,
            "nama": user.nama_lengkap,
            "full_name": user.nama_lengkap,
            "role": user.role,
            "username": user.username,
            "wilayah_kecamatan": getattr(user, "wilayah_kecamatan", None),
            "wilayah_kelurahan": getattr(user, "wilayah_kelurahan", None),
            "wilayah_kota": getattr(user, "wilayah_kota", None),
            "foto_url": getattr(user, "foto_url", None),
            "is_active": getattr(user, "is_active", True),
        }
    
    # Query Warga table for warga role
    elif role == "warga":
        warga = db.query(Warga).filter(Warga.id == user_id, Warga.email == email).first()
        if not warga:
            raise HTTPException(status_code=401, detail="Warga not found")
        
        return {
            "id": warga.id,
            "email": warga.email,
            "nama_lengkap": warga.nama,
            "nama": warga.nama,
            "full_name": warga.nama,
            "role": "warga",
            "kecamatan": warga.kecamatan,
            "kelurahan": warga.kelurahan,
            "alamat_rumah": warga.alamat_rumah,
            "total_poin": warga.total_poin,
        }
    
    raise HTTPException(status_code=401, detail="Invalid role")
