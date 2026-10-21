from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.mysql import INTEGER
from core.database import Base

class Kecamatan(Base):
    __tablename__ = "kecamatan"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    nama = Column(String(100), unique=True, nullable=False)
    kode = Column(String(20), unique=True, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)

class Kelurahan(Base):
    __tablename__ = "kelurahan"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    kecamatan = Column(String(100), nullable=False)
    wilayah_kota = Column(String(50), nullable=False)
