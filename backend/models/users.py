from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    role = Column(Enum('admin', 'petugas', 'driver', 'superadmin'), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Hapus model Admin & PetugasPengangkut karena sudah jadi satu di User
