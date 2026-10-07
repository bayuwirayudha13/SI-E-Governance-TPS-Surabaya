from sqlalchemy import Column, Integer, String, DateTime, func
from core.database import Base

class Warga(Base):
    __tablename__ = "warga"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Integer, default=0, nullable=False)
    no_hp = Column(String(20), nullable=True)
    alamat_rumah = Column(String(255), nullable=True)
    kecamatan = Column(String(100), nullable=True)
    kelurahan = Column(String(100), nullable=True)
    total_poin = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
