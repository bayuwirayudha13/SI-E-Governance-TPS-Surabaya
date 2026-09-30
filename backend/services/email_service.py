import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from core.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_EMAIL,
    SMTP_PASSWORD,
)


def send_otp_email(receiver_email: str, otp: str):
    subject = "Kode OTP SI-PETASAN SUROBOYO"

    body = f"""
Halo,

Berikut adalah kode OTP untuk verifikasi akun SI-PETASAN SUROBOYO:

{otp}

Kode OTP ini berlaku selama 5 menit.

Jika kamu tidak meminta kode ini, abaikan email ini.

Terima kasih,
SI-PETASAN SUROBOYO
"""

    message = MIMEMultipart()
    message["From"] = SMTP_EMAIL
    message["To"] = receiver_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()

        server.login(
            SMTP_EMAIL,
            SMTP_PASSWORD
        )

        server.sendmail(
            SMTP_EMAIL,
            receiver_email,
            message.as_string()
        )

def send_reset_password_email(receiver_email: str, otp: str):
    subject = "Kode OTP Reset Password SI-PETASAN SUROBOYO"

    body = f"""
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

    message = MIMEMultipart()
    message["From"] = SMTP_EMAIL
    message["To"] = receiver_email
    message["Subject"] = subject

    message.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)

        server.sendmail(
            SMTP_EMAIL,
            receiver_email,
            message.as_string()
        )