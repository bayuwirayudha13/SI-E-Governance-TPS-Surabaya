from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean
from core.database import Base
from core.timezone import get_wib_now

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    role = Column(Enum('admin', 'petugas', 'driver', 'superadmin'), nullable=False)
    is_active = Column(Boolean, default=True)
    # Wilayah tugas petugas & foto profil
    wilayah_kecamatan = Column(String(100), nullable=True)
    wilayah_kelurahan = Column(String(100), nullable=True)
    wilayah_kota = Column(String(50), nullable=True, default="Surabaya")
    foto_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_wib_now)
    updated_at = Column(DateTime, default=get_wib_now, onupdate=get_wib_now)

# Hapus model Admin & PetugasPengangkut karena sudah jadi satu di User
