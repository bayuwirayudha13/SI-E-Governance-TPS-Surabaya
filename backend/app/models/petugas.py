from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.mysql import INTEGER, TIMESTAMP
from app.core.database import Base
from sqlalchemy.sql import func

class PetugasPengangkut(Base):
    __tablename__ = "petugas_pengangkut"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    no_hp = Column(String(20), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    wilayah_tugas = Column(String(100))
    status = Column(Enum('Aktif', 'Nonaktif'), nullable=False, default='Aktif')
    created_at = Column(TIMESTAMP, server_default=func.now())
