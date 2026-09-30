from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from auth.otp import generate_otp, save_otp, verify_otp
from services.email_service import send_otp_email


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
    request: OTPVerifyRequest
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