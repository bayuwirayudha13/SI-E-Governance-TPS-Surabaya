import httpx

from core.config import (
    BREVO_API_KEY,
    BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME,
)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _send_email(receiver_email: str, subject: str, body: str):
    if not BREVO_API_KEY:
        raise RuntimeError("BREVO_API_KEY belum dikonfigurasi")

    if not BREVO_SENDER_EMAIL:
        raise RuntimeError("BREVO_SENDER_EMAIL belum dikonfigurasi")

    payload = {
        "sender": {
            "name": BREVO_SENDER_NAME,
            "email": BREVO_SENDER_EMAIL,
        },
        "to": [{"email": receiver_email}],
        "subject": subject,
        "textContent": body,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = httpx.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=15.0,
        )

        response.raise_for_status()

    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"Brevo API error {exc.response.status_code}: "
            f"{exc.response.text}"
        ) from exc

    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Koneksi ke Brevo gagal | "
            f"Jenis error: {type(exc).__name__} | "
            f"Detail: {repr(exc)}"
        ) from exc


def send_otp_email(receiver_email: str, otp: str):
    subject = "Kode OTP SI-PETASAN SUROBOYO"

    body = f"""\
Halo,

Berikut adalah kode OTP untuk verifikasi akun SI-PETASAN SUROBOYO:

{otp}

Kode OTP ini berlaku selama 5 menit.

Jika kamu tidak meminta kode ini, abaikan email ini.

Terima kasih,
SI-PETASAN SUROBOYO
"""

    _send_email(receiver_email, subject, body)


def send_reset_password_email(receiver_email: str, otp: str):
    subject = "Kode OTP Reset Password SI-PETASAN SUROBOYO"

    body = f"""\
Halo,

Kami menerima permintaan untuk mereset password akun
SI-PETASAN SUROBOYO Anda.

Berikut kode OTP untuk reset password:

{otp}

Kode OTP ini berlaku selama 5 menit.

Jika kamu tidak meminta reset password, abaikan email ini.

Terima kasih,
SI-PETASAN SUROBOYO
"""

    _send_email(receiver_email, subject, body)