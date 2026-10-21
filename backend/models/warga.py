from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.dialects.mysql import INTEGER
from core.database import Base
from core.timezone import get_wib_now

class Warga(Base):
    __tablename__ = "warga"
    
    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Integer, default=0, nullable=False)
    no_hp = Column(String(20), nullable=True)
    alamat_rumah = Column(String(255), nullable=True)
    kecamatan = Column(String(100), nullable=True)
    kelurahan = Column(String(100), nullable=True)
    total_poin = Column(INTEGER(unsigned=True), default=0)
    qr_token = Column(String(64), unique=True, index=True, nullable=True)
    qr_created_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_wib_now)
