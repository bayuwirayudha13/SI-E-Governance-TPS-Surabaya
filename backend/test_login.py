from core.database import SessionLocal
from models.users import User
from models.warga import Warga
from models.jadwal import JadwalPengambilan
from sqlalchemy import text
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Create test superadmin if not exists
superadmin = db.query(User).filter(User.email == "superadmin@sipetasan.com").first()
if not superadmin:
    superadmin_hash = pwd_context.hash("superadmin123")
    superadmin = User(
        username="superadmin",
        email="superadmin@sipetasan.com",
        hashed_password=superadmin_hash,
        nama_lengkap="Super Admin",
        role="superadmin",
        is_active=True
    )
    db.add(superadmin)
    db.commit()
    db.refresh(superadmin)
    print(f"Created superadmin: {superadmin.email}")

# Create test petugas pengangkut if not exists
petugas_pengangkut = db.query(User).filter(User.email == "petugas@sipetasan.com").first()
if not petugas_pengangkut:
    petugas_hash = pwd_context.hash("petugas123")
    petugas_pengangkut = User(
        username="petugas.pengangkut",
        email="petugas@sipetasan.com",
        hashed_password=petugas_hash,
        nama_lengkap="Petugas Pengangkut",
        role="petugas",
        is_active=True,
        wilayah_kecamatan="Bubutan",
        wilayah_kelurahan="Tembok Dukuh"
    )
    db.add(petugas_pengangkut)
    db.commit()
    db.refresh(petugas_pengangkut)
    print(f"Created petugas pengangkut: {petugas_pengangkut.email}")

# Create test petugas tps if not exists
petugas_tps = db.query(User).filter(User.email == "petugas.tps@sipetasan.com").first()
if not petugas_tps:
    petugas_tps_hash = pwd_context.hash("petugastps123")
    petugas_tps = User(
        username="petugas.tps",
        email="petugas.tps@sipetasan.com",
        hashed_password=petugas_tps_hash,
        nama_lengkap="Petugas TPS",
        role="petugas_tps",
        is_active=True,
        wilayah_kecamatan="Bubutan",
        wilayah_kelurahan="Tembok Dukuh"
    )
    db.add(petugas_tps)
    db.commit()
    db.refresh(petugas_tps)
    print(f"Created petugas tps: {petugas_tps.email}")

# Create test warga if not exists
warga = db.query(Warga).filter(Warga.email == "warga@sipetasan.com").first()
if not warga:
    warga_hash = pwd_context.hash("warga123")
    warga = Warga(
        email="warga@sipetasan.com",
        password_hash=warga_hash,
        nama="Test Warga",
        alamat_rumah="Jl. Test No. 123",
        kecamatan="Bubutan",
        kelurahan="Tembok Dukuh",
        total_poin=100,
        qr_token=str(uuid.uuid4()),
        email_verified=1
    )
    db.add(warga)
    db.commit()
    db.refresh(warga)
    print(f"Created warga: {warga.email}")

print("\nAll test data created/verified.")
print(f"\nSuperadmin credentials: superadmin@sipetasan.com / superadmin123")
print(f"Petugas pengangkut credentials: petugas@sipetasan.com / petugas123")
print(f"Petugas tps credentials: petugas.tps@sipetasan.com / petugastps123")
print(f"Warga credentials: warga@sipetasan.com / warga123")

db.close()