from sqlalchemy import Column, String, Enum, Date
from sqlalchemy.dialects.mysql import INTEGER, TIMESTAMP, DECIMAL
from app.core.database import Base
from sqlalchemy.sql import func

class TPS(Base):
    __tablename__ = "tps"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    nama = Column(String(150), nullable=False)
    nama_lama = Column(String(150))
    lokasi = Column(String(255))
    kecamatan = Column(String(100), nullable=False)
    wilayah_kota = Column(String(50), nullable=False)
    latitude = Column(DECIMAL(10, 7))
    longitude = Column(DECIMAL(10, 7))
    jenis_tps = Column(String(50))
    jumlah_container = Column(String(50))
    daya_tampung_m3 = Column(DECIMAL(8, 2))
    status = Column(Enum('Aktif', 'Tidak Aktif'), nullable=False, default='Aktif')
    sumber_data = Column(String(100), default='Data internal DLH')
    tanggal_update = Column(Date)
    catatan = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
