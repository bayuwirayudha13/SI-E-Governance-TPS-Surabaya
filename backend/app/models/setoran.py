from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER, TIMESTAMP, DECIMAL
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy.sql import func

class SetoranSampah(Base):
    __tablename__ = "setoran_sampah"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    warga_id = Column(INTEGER(unsigned=True), ForeignKey('warga.id', ondelete="CASCADE"), nullable=False)
    tps_id = Column(INTEGER(unsigned=True), ForeignKey('tps.id', ondelete="CASCADE"))
    jenis_sampah = Column(String(50), nullable=False, default='Botol Plastik (PET)')
    perkiraan_berat_kg = Column(DECIMAL(6, 2))
    poin_diperoleh = Column(INTEGER(unsigned=True))
    foto_bukti_url = Column(String(255))
    metode_setor = Column(Enum('Antar ke TPS', 'Dijemput Petugas'), nullable=False, default='Antar ke TPS')
    alamat_penjemputan = Column(String(255))
    petugas_id = Column(INTEGER(unsigned=True), ForeignKey('petugas_pengangkut.id', ondelete="SET NULL"))
    qr_code = Column(String(64), unique=True)
    status = Column(Enum('Menunggu Penjemputan', 'Sudah Divalidasi', 'Dibatalkan'), nullable=False, default='Menunggu Penjemputan')
    waktu_setor = Column(TIMESTAMP, server_default=func.now())
    waktu_validasi = Column(TIMESTAMP)
