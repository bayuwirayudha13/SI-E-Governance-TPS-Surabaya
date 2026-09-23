from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER, DATETIME
from sqlalchemy.orm import relationship
from app.core.database import Base

class Kecamatan(Base):
    __tablename__ = "kecamatan"
    id = Column(INTEGER(display_width=11), primary_key=True, autoincrement=True)
    nama = Column(String(100), unique=True, nullable=False)
    kode = Column(String(20), unique=True)
    created_at = Column(DATETIME)
    updated_at = Column(DATETIME)

class Kelurahan(Base):
    __tablename__ = "kelurahan"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    kecamatan = Column(String(100), nullable=False)
    wilayah_kota = Column(String(50), nullable=False)

class TPSKelurahan(Base):
    __tablename__ = "tps_kelurahan"
    tps_id = Column(INTEGER(unsigned=True), ForeignKey('tps.id', ondelete="CASCADE"), primary_key=True)
    kelurahan_id = Column(INTEGER(unsigned=True), ForeignKey('kelurahan.id', ondelete="CASCADE"), primary_key=True)
