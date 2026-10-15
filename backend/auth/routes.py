from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from schemas.otp import ResetPasswordRequest
from passlib.context import CryptContext
import secrets

from auth.otp import (
    generate_otp,
    save_otp,
    verify_otp,
    otp_storage,
    get_resend_cooldown,
    save_reset_otp,
    verify_reset_otp,
    reset_otp_storage
)

from services.email_service import (
    send_otp_email,
    send_reset_password_email
)
from core.database import get_db

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Import models and auth helpers
from models.warga import Warga
from models.users import User
from jose import JWTError, jwt
from dotenv import load_dotenv
import os

load_dotenv()

# JWT Config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Request models
class LoginRequest(BaseModel):
    email: str = None
    username: str = None
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    alamat_rumah: str = None
    kecamatan: str = None
    kelurahan: str = None

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


@router.post("/send-otp")
def send_otp(request: OTPRequest):

    otp = generate_otp()

    save_otp(
        request.email,
        otp,
        resend_count=0
    )

    try:
        send_otp_email(
            request.email,
            otp
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengirim email: {str(e)}"
        )

    return {
        "message": "OTP berhasil dikirim ke email",
        "cooldown_seconds": 60
    }


@router.post("/verify-otp")
def verify_otp_endpoint(
    request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):

    success, message = verify_otp(
        request.email,
        request.otp
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    user = db.query(Warga).filter(
        Warga.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    user.email_verified = 1

    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = create_access_token(
        data={"sub": user.email, "role": "warga"},
        expires_delta=access_token_expires
    )

    return {
        "message": "OTP berhasil diverifikasi",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.nama,
            "nama_lengkap": user.nama,
            "nama": user.nama,
            "role": "warga",
            "kecamatan": user.kecamatan,
            "kelurahan": user.kelurahan,
            "alamat_rumah": user.alamat_rumah,
            "total_poin": user.total_poin
        }
    }


@router.post("/resend-otp")
def resend_otp(request: OTPRequest):

    data = otp_storage.get(request.email)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="OTP tidak ditemukan. Silakan daftar atau kirim OTP terlebih dahulu."
        )

    now = datetime.now(timezone.utc)

    resend_count = data.get("resend_count", 0)

    cooldown = get_resend_cooldown(resend_count)

    elapsed = (now - data["sent_at"]).total_seconds()

    if elapsed < cooldown:

        remaining = int(cooldown - elapsed)

        raise HTTPException(
            status_code=429,
            detail=f"Silakan tunggu {remaining} detik sebelum mengirim ulang OTP."
        )

    new_otp = generate_otp()

    new_resend_count = resend_count + 1

    save_otp(
        request.email,
        new_otp,
        resend_count=new_resend_count
    )

    try:
        send_otp_email(
            request.email,
            new_otp
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengirim ulang OTP: {str(e)}"
        )

    next_cooldown = get_resend_cooldown(new_resend_count)

    return {
        "message": "OTP baru berhasil dikirim",
        "cooldown_seconds": next_cooldown,
        "resend_count": new_resend_count
    }

@router.post("/forgot-password")
def forgot_password(
    request: OTPRequest,
    db: Session = Depends(get_db)
):
    user = db.query(Warga).filter(
        Warga.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak terdaftar"
        )

    otp = generate_otp()

    save_reset_otp(
        request.email,
        otp
    )

    try:
        send_reset_password_email(
            request.email,
            otp
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengirim email: {str(e)}"
        )

    return {
        "message": "OTP reset password berhasil dikirim ke email",
        "email": request.email,
        "cooldown_seconds": 60
    }

@router.post("/verify-reset-otp")
def verify_reset_password_otp(
    request: OTPVerifyRequest
):
    success, message = verify_reset_otp(
        request.email,
        request.otp
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    return {
        "message": "OTP reset password berhasil diverifikasi"
    }

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    # Cek apakah email mempunyai OTP reset
    data = reset_otp_storage.get(request.email)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Silakan minta OTP reset password terlebih dahulu"
        )

    # Pastikan OTP sudah diverifikasi
    if not data.get("verified", False):
        raise HTTPException(
            status_code=400,
            detail="Silakan verifikasi OTP terlebih dahulu"
        )

    # Cek OTP masih berlaku
    now = datetime.now(timezone.utc)

    if now > data["expired_at"]:
        del reset_otp_storage[request.email]

        raise HTTPException(
            status_code=400,
            detail="OTP sudah expired"
        )

    # Cari user
    user = db.query(Warga).filter(
        Warga.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    # Validasi password
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password minimal 6 karakter"
        )

    # Hash password baru
    user.password_hash = pwd_context.hash(
        request.new_password
    )

    db.commit()

    # OTP hanya boleh digunakan satu kali
    del reset_otp_storage[request.email]

    return {
        "message": "Password berhasil diubah"
    }


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        login_id = request.email or request.username
        if not login_id:
            raise HTTPException(status_code=400, detail="Email atau username wajib diisi")

        user = db.query(User).filter(
            (User.email == login_id) | (User.username == login_id)
        ).first()
        
        if user and verify_password(request.password, user.hashed_password):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role},
                expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.nama_lengkap,
                    "nama_lengkap": user.nama_lengkap,
                    "nama": user.nama_lengkap,
                    "role": user.role,
                    "username": user.username,
                    "wilayah_kecamatan": getattr(user, "wilayah_kecamatan", None),
                    "wilayah_kelurahan": getattr(user, "wilayah_kelurahan", None),
                    "wilayah_kota": getattr(user, "wilayah_kota", None),
                    "foto_url": getattr(user, "foto_url", None),
                }
            }

        warga = db.query(Warga).filter(Warga.email == login_id).first()
        if warga and verify_password(request.password, warga.password_hash):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": warga.email, "role": "warga"},
                expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": warga.id,
                    "email": warga.email,
                    "full_name": warga.nama,
                    "role": "warga",
                    "total_poin": warga.total_poin,
                    "kecamatan": warga.kecamatan,
                    "kelurahan": warga.kelurahan,
                    "nama_lengkap": warga.nama,
                    "nama": warga.nama
                }
            }

        raise HTTPException(status_code=401, detail="Email/Username atau password salah")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error login: {str(e)}")


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(Warga).filter(
            Warga.email == request.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email sudah terdaftar"
            )

        hashed_password = get_password_hash(request.password)

        user = Warga(
            email=request.email,
            password_hash=hashed_password,
            nama=request.full_name,
            alamat_rumah=request.alamat_rumah,
            kecamatan=request.kecamatan,
            kelurahan=request.kelurahan,
            email_verified=0,
            qr_token=secrets.token_hex(32)
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        otp = generate_otp()
        save_otp(user.email, otp)

        try:
            send_otp_email(user.email, otp)
        except Exception as e:
            db.delete(user)
            db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Gagal mengirim OTP: {str(e)}"
            )

        return {
            "message": "Registrasi berhasil. OTP telah dikirim ke email.",
            "email": user.email
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error register: {str(e)}"
        )


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}