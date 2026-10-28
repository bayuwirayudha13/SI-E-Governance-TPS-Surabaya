from core.database import engine
from sqlalchemy import text

# Check petugas user's wilayah
with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT id, username, email, role, wilayah_kecamatan, wilayah_kelurahan FROM users WHERE email = 'petugas@sipetasan.com'"
    ))
    for row in result:
        print(f"ID: {row[0]}, Email: {row[2]}, Role: {row[3]}, Wilayah Kecamatan: {row[4]}, Wilayah Kelurahan: {row[5]}")

# Check warga ID 20
    result = conn.execute(text(
        "SELECT id, nama, kelurahan, kecamatan FROM warga WHERE id = 20"
    ))
    for row in result:
        print(f"Warga ID: {row[0]}, Nama: {row[1]}, Kelurahan: {row[2]}, Kecamatan: {row[3]}")
