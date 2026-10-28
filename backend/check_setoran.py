from core.database import SessionLocal
from models.setoran import SetoranSampah

db = SessionLocal()
items = db.query(SetoranSampah).all()
for s in items:
    print(f"ID: {s.id}, QR: {s.qr_code}, Status: {s.status}, Warga ID: {s.warga_id}")
