from core.database import engine
from sqlalchemy import text

conn = engine.connect()
result = conn.execute(text(
    "SELECT id, qr_code FROM setoran_sampah WHERE warga_id = 20 AND status = 'Menunggu Penjemputan'"
))
print("QR codes for warga 20 (Menunggu Penjemputan):")
for row in result:
    print(f"ID {row[0]}: {row[1]}")
