from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional, Tuple
import secrets
import os
from dotenv import load_dotenv

from models.token import RefreshToken, TokenRevocation
from models.warga import Warga
from models.users import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Buat access token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: int, user_type: str, db: Session) -> str:
    """Buat refresh token dan simpan ke database"""
    # Generate token unik
    token = secrets.token_urlsafe(64)
    
    # Hitung expire time
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Simpan ke database
    refresh_token = RefreshToken(
        user_id=user_id,
        user_type=user_type,
        token=token,
        expires_at=expires_at,
        revoked=False
    )
    db.add(refresh_token)
    db.commit()
    
    return token


def verify_access_token(token: str) -> Optional[dict]:
    """Verifikasi access token dan return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def verify_refresh_token(token: str, db: Session) -> Optional[Tuple[int, str]]:
    """Verifikasi refresh token dan return (user_id, user_type)"""
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.revoked == False
    ).first()
    
    if not refresh_token:
        return None
    
    # Cek expired
    now = datetime.now(timezone.utc)
    expires_at = refresh_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        return None
    
    # Cek user masih aktif
    if refresh_token.user_type == "warga":
        user = db.query(Warga).filter(Warga.id == refresh_token.user_id).first()
        if not user:
            return None
    else:
        user = db.query(User).filter(
            User.id == refresh_token.user_id,
            (User.is_active == True) | (User.is_active.is_(None))
        ).first()
        if not user:
            return None
    
    return (refresh_token.user_id, refresh_token.user_type)


def revoke_refresh_token(token: str, db: Session) -> bool:
    """Revoke specific refresh token"""
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).first()
    
    if refresh_token:
        refresh_token.revoked = True
        refresh_token.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False


def revoke_all_user_tokens(user_id: int, user_type: str, db: Session, reason: str = "logout"):
    """Revoke semua refresh token user dan catat revocation"""
    # Revoke semua refresh token
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.user_type == user_type,
        RefreshToken.revoked == False
    ).update({
        "revoked": True,
        "revoked_at": datetime.now(timezone.utc)
    })
    
    # Catat revocation event
    revocation = TokenRevocation(
        user_id=user_id,
        user_type=user_type,
        reason=reason
    )
    db.add(revocation)
    db.commit()


def cleanup_expired_tokens(db: Session):
    """Hapus token expired dari database (untuk cron job)"""
    now = datetime.now(timezone.utc)
    expired = db.query(RefreshToken).filter(
        RefreshToken.expires_at < now
    ).delete()
    db.commit()
    return expired


def refresh_access_token(refresh_token: str, db: Session) -> Optional[Tuple[str, dict]]:
    """Generate access token baru dari refresh token"""
    result = verify_refresh_token(refresh_token, db)
    if not result:
        return None
    
    user_id, user_type = result
    
    # Ambil data user lengkap
    if user_type == "warga":
        user = db.query(Warga).filter(Warga.id == user_id).first()
        if not user:
            return None
        
        user_data = {
            "id": user.id,
            "email": user.email,
            "nama_lengkap": user.nama,
            "nama": user.nama,
            "full_name": user.nama,
            "role": "warga",
            "kecamatan": user.kecamatan,
            "kelurahan": user.kelurahan,
            "alamat_rumah": user.alamat_rumah,
            "total_poin": user.total_poin
        }
        token_data = {"sub": user.email, "role": "warga", "user_id": user.id}
    else:
        user = db.query(User).filter(
            User.id == user_id,
            ((User.is_active == True) | (User.is_active == None))
        ).first()
        if not user:
            return None
        
        user_data = {
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
            "foto_url": getattr(user, "foto_url", None)
        }
        token_data = {"sub": user.email, "role": user.role, "user_id": user.id}
    
    # Buat access token baru
    access_token = create_access_token(token_data)
    
    return (access_token, user_data)
