from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from core.database import Base

class Admin(Base):
    __tablename__ = "admin"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nama = Column(String(100), nullable=False)
    role = Column(Enum('super_admin', 'petugas'), default='petugas', nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class PetugasPengangkut(Base):
    __tablename__ = "petugas_pengangkut"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    no_hp = Column(String(20), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    wilayah_tugas = Column(String(100), nullable=True)
    status = Column(Enum('Aktif', 'Nonaktif'), default='Aktif', nullable=False)
    created_at = Column(DateTime, default=func.now())
