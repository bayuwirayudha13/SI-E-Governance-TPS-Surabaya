import secrets
from datetime import datetime, timedelta, timezone

from core.config import OTP_EXPIRE_MINUTES


otp_storage = {}


def generate_otp():
    return str(secrets.randbelow(900000) + 100000)


def save_otp(email: str, otp: str):
    expired_at = datetime.now(timezone.utc) + timedelta(
        minutes=OTP_EXPIRE_MINUTES
    )

    otp_storage[email] = {
        "otp": otp,
        "expired_at": expired_at
    }


def verify_otp(email: str, otp: str):
    data = otp_storage.get(email)

    if not data:
        return False, "OTP tidak ditemukan"

    now = datetime.now(timezone.utc)

    if now > data["expired_at"]:
        del otp_storage[email]
        return False, "OTP sudah expired"

    if data["otp"] != otp:
        return False, "OTP salah"

    del otp_storage[email]

    return True, "OTP berhasil diverifikasi"