from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from core.database import get_db
from models.users import User

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Extract user dari JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    email: str = payload.get("sub")
    
    if not email:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User tidak aktif")
    
    return user

def require_role(*allowed_roles: str):
    """Middleware untuk cek role"""
    async def check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Akses hanya untuk role: {', '.join(allowed_roles)}"
            )
        return current_user
    return check_role

# Convenience functions
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Admin atau Superadmin only"""
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Akses khusus Admin / Superadmin")
    return current_user

def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """Superadmin only"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Akses khusus Superadmin")
    return current_user

def require_petugas(current_user: User = Depends(get_current_user)) -> User:
    """Petugas only"""
    if current_user.role != "petugas":
        raise HTTPException(status_code=403, detail="Akses khusus Petugas")
    return current_user
