from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from schemas.otp import ResetPasswordRequest
from passlib.context import CryptContext

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

    from main import (
        Warga,
        create_access_token,
        ACCESS_TOKEN_EXPIRE_MINUTES
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
        data={"sub": user.email},
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
    from main import Warga

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
    from main import Warga

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