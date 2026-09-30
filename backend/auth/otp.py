import secrets
from datetime import datetime, timedelta, timezone

from core.config import OTP_EXPIRE_MINUTES


otp_storage = {}


def generate_otp():
    return str(secrets.randbelow(900000) + 100000)


def get_resend_cooldown(resend_count: int):
    if resend_count == 0:
        return 60
    elif resend_count == 1:
        return 180
    else:
        return 300


def save_otp(email: str, otp: str, resend_count: int = 0):
    now = datetime.now(timezone.utc)

    expired_at = now + timedelta(
        minutes=OTP_EXPIRE_MINUTES
    )

    otp_storage[email] = {
        "otp": otp,
        "expired_at": expired_at,
        "sent_at": now,
        "resend_count": resend_count
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

reset_otp_storage = {}

def save_reset_otp(email: str, otp: str):
    now = datetime.now(timezone.utc)
    expired_at = now + timedelta(minutes=OTP_EXPIRE_MINUTES)

    reset_otp_storage[email] = {
        "otp": otp,
        "expired_at": expired_at,
        "sent_at": now
    }


def verify_reset_otp(email: str, otp: str):
    data = reset_otp_storage.get(email)

    if not data:
        return False, "OTP reset password tidak ditemukan"

    now = datetime.now(timezone.utc)

    if now > data["expired_at"]:
        del reset_otp_storage[email]
        return False, "OTP sudah expired"

    if data["otp"] != otp:
        return False, "OTP salah"

    # Tandai bahwa OTP sudah berhasil diverifikasi
    data["verified"] = True

    return True, "OTP berhasil diverifikasi"