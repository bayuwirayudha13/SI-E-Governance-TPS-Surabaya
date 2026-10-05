from sqlalchemy import Column, Integer, String, DECIMAL, Date, Text, Enum, DateTime, func
from sqlalchemy.orm import relationship
from core.database import Base

class TPS(Base):
    __tablename__ = "tps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama = Column(String(150), nullable=False)
    nama_lama = Column(String(150), nullable=True)
    lokasi = Column(String(255), nullable=True)
    kecamatan = Column(String(100), nullable=False)
    wilayah_kota = Column(String(50), nullable=False)
    latitude = Column(DECIMAL(10, 7), nullable=True)
    longitude = Column(DECIMAL(10, 7), nullable=True)
    jenis_tps = Column(String(50), nullable=True)
    jumlah_container = Column(String(50), nullable=True)
    daya_tampung_m3 = Column(DECIMAL(8, 2), nullable=True)
    status = Column(Enum('Aktif', 'Tidak Aktif'), default='Aktif', nullable=False)
    sumber_data = Column(String(100), default='Data internal DLH')
    tanggal_update = Column(Date, nullable=True)
    catatan = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    kelurahans = relationship("TPSKelurahan", back_populates="tps", cascade="all, delete-orphan")
