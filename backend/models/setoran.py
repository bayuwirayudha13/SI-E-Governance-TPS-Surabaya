from sqlalchemy import Column, Integer, String, DECIMAL, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from core.database import Base

class SetoranSampah(Base):
    __tablename__ = "setoran_sampah"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warga_id = Column(Integer, ForeignKey("warga.id"), nullable=False)
    tps_id = Column(Integer, ForeignKey("tps.id"), nullable=True)
    jenis_sampah = Column(String(50), default="Botol Plastik (PET)")
    perkiraan_berat_kg = Column(DECIMAL(6, 2), nullable=True)
    poin_diperoleh = Column(Integer, nullable=True)
    foto_bukti_url = Column(String(255), nullable=True)
    metode_setor = Column(String(50), default='Antar ke TPS')
    alamat_penjemputan = Column(String(255), nullable=True)
    petugas_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    qr_code = Column(String(64), unique=True, nullable=True)
    status = Column(Enum('Menunggu Penjemputan', 'Sudah Divalidasi', 'Dibatalkan'), default='Menunggu Penjemputan')
    waktu_setor = Column(DateTime, nullable=True)
    waktu_validasi = Column(DateTime, nullable=True)

    warga = relationship("Warga", foreign_keys=[warga_id])
    tps = relationship("TPS", foreign_keys=[tps_id])
    petugas = relationship("User", foreign_keys=[petugas_id])
