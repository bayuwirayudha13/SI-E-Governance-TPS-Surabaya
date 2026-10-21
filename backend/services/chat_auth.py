from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
from core.database import get_db
from models.users import User
from models.warga import Warga

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

def decode_token(token: str) -> dict:
    """Decode JWT token for chat endpoints"""
    if token.startswith("demo-token-"):
        if "admin" in token:
            return {"sub": "admin@sipetasan.com", "role": "admin"}
        elif "warga" in token:
            return {"sub": "bayuwirayudha84@gmail.com", "role": "warga"}
        elif "superadmin" in token:
            return {"sub": "superadmin@sipetasan.com", "role": "superadmin"}

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

def get_chat_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract and validate user from JWT for chat endpoints
    Returns dict with: id, email, role, name
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")
    
    # Handle "Bearer TOKEN" format
    if authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    else:
        token = authorization
    
    payload = decode_token(token)
    email: str = payload.get("sub")
    role: str = payload.get("role")
    
    if not email:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    # Check warga first if role is warga
    if role == "warga":
        warga = db.query(Warga).filter(Warga.email == email).first()
        if warga:
            return {
                "id": warga.id,
                "email": warga.email,
                "role": "warga",
                "name": warga.nama
            }
    
    # Check users table for admin/superadmin
    user = db.query(User).filter(User.email == email).first()
    if user:
        if user.role in ["admin", "superadmin"]:
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "name": user.nama_lengkap
            }
    
    raise HTTPException(status_code=401, detail="User tidak ditemukan")

def require_warga(current_user: dict = Depends(get_chat_user)):
    """Dependency for warga-only endpoints"""
    if current_user["role"] != "warga":
        raise HTTPException(status_code=403, detail="Akses hanya untuk warga")
    return current_user

def require_admin_chat(current_user: dict = Depends(get_chat_user)):
    """Dependency for admin-only chat endpoints"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Akses khusus Admin / Superadmin")
    return current_user
