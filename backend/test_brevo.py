
from services.email_service import send_otp_email

email_tujuan = input("Masukkan email penerima OTP: ")

try:
    send_otp_email(email_tujuan, "123456")

    print("\nBERHASIL!")
    print("Permintaan pengiriman email diterima oleh Brevo.")

except Exception as e:
    print("\nGAGAL MENGIRIM EMAIL!")
    print(f"Error: {e}")
