from core.database import engine
from sqlalchemy import text

conn = engine.connect()
result = conn.execute(text('SELECT id, email, wilayah_kelurahan, wilayah_kecamatan FROM users WHERE email = "jamal.petugas@sipetasan.com"'))
for row in result:
    print(f"ID: {row[0]}, Email: {row[1]}, Kelurahan: {row[2]}, Kecamatan: {row[3]}")
