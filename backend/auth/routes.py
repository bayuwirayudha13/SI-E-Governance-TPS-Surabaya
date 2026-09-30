from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import timedelta

from auth.otp import generate_otp, save_otp, verify_otp
from services.email_service import send_otp_email
from core.database import get_db


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
        otp
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
        "message": "OTP berhasil dikirim ke email"
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

    # Import dari main di dalam function
    # untuk menghindari circular import
    from main import Warga, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

    # Cari user
    user = db.query(Warga).filter(
        Warga.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    # Tandai email sudah diverifikasi
    user.email_verified = 1

    db.commit()
    db.refresh(user)

    # Buat access token
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

    success, message = verify_otp(
        request.email,
        request.otp
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    return {
        "message": "OTP berhasil diverifikasi"
    }


@router.post("/resend-otp")
def resend_otp(request: OTPRequest):

    otp = generate_otp()

    save_otp(
        request.email,
        otp
    )

    try:
        send_otp_email(
            request.email,
            otp
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengirim ulang OTP: {str(e)}"
        )

    return {
        "message": "OTP baru berhasil dikirim"
    }