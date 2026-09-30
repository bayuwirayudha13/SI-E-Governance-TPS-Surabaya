import os
from dotenv import load_dotenv

load_dotenv()


SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

OTP_EXPIRE_MINUTES = int(
    os.getenv("OTP_EXPIRE_MINUTES", "5")
)