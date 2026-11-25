import os
from datetime import datetime, timedelta

from core.database import get_db
from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from models.users import User
from passlib.context import CryptContext
from sqlalchemy.orm import Session

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = (
    1440  # 24 jam untuk dev/testing agar token tidak gampang expired
)

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
    # Support demo tokens for workshop/testing
    if token.startswith("demo-token-"):
        if "admin" in token:
            return {"sub": "admin@sipetasan.com", "role": "admin"}
        elif "petugas_kelurahan" in token:
            return {
                "sub": "petugas_kelurahan@sipetasan.com",
                "role": "petugas_kelurahan",
            }
        elif "petugas" in token or "pengangkut" in token:
            return {"sub": "petugas@sipetasan.com", "role": "petugas_pengangkut"}
        elif "driver" in token:
            return {"sub": "driver@sipetasan.com", "role": "driver"}
        elif "warga" in token:
            return {"sub": "warga@sipetasan.com", "role": "warga"}

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")


def get_current_user(
    authorization: str = Header(None), db: Session = Depends(get_db)
) -> User:
    """Extract user dari JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")

    token = authorization.split(" ")[1]

    # Handle demo tokens (avoid 500 when database user record doesn't exist)
    if token.startswith("demo-token-"):
        role_type = token.replace("demo-token-", "")
        # First try finding real user in db by role/email
        demo_email_map = {
            "superadmin": "superadmin@sipetasan.com",
            "admin": "admin@sipetasan.com",
            "petugas": "petugas@sipetasan.com",
            "driver": "driver@sipetasan.com",
            "warga": "warga@sipetasan.com",
        }
        target_email = demo_email_map.get(role_type)
        if target_email:
            existing = db.query(User).filter(User.email == target_email).first()
            if existing:
                return existing

        # Fallback dummy object if not in DB
        class DummyUser:
            pass

        u = DummyUser()
        u.id = 1
        u.email = target_email or f"{role_type}@sipetasan.com"
        u.role = "superadmin" if "superadmin" in token else "admin" if "admin" in token else "petugas_pengangkut"
        u.nama_lengkap = "Demo User"
        u.is_active = True
        u.wilayah_kecamatan = None
        u.wilayah_kelurahan = None
        u.wilayah_kota = "Surabaya"
        return u

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
                detail=f"Akses hanya untuk role: {', '.join(allowed_roles)}",
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
    if current_user.role not in ["petugas", "petugas_pengangkut"]:
        raise HTTPException(status_code=403, detail="Akses khusus Petugas")
    return current_user


def require_petugas_kelurahan(current_user: User = Depends(get_current_user)) -> User:
    """Petugas Kelurahan only"""
    if current_user.role != "petugas_kelurahan":
        raise HTTPException(status_code=403, detail="Akses khusus Petugas Kelurahan")
    return current_user


def require_petugas_tps(current_user: User = Depends(get_current_user)) -> User:
    """Petugas TPS only"""
    if current_user.role != "petugas_tps":
        raise HTTPException(status_code=403, detail="Akses khusus Petugas TPS")
    return current_user


def require_admin_or_petugas_tps(current_user: User = Depends(get_current_user)) -> User:
    """Admin or Petugas TPS only"""
    if current_user.role not in ["admin", "superadmin", "petugas_tps"]:
        raise HTTPException(status_code=403, detail="Akses khusus Admin / Petugas TPS")
    return current_user
