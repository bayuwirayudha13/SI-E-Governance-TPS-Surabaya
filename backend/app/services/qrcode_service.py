import os
import qrcode
from qrcode.constants import ERROR_CORRECT_M
from app.core.config import settings

def generate_qr_code(rumah_id: int, data: str) -> str:
    filename = f"rumah_{rumah_id}.png"
    filepath = os.path.join(settings.QRCODE_DIR, filename)
    qr = qrcode.QRCode(version=1, error_correction=ERROR_CORRECT_M, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filepath)
    return f"/static/qrcodes/{filename}"
