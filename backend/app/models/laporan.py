from sqlalchemy import Column, String, Enum, ForeignKey, Text
from sqlalchemy.dialects.mysql import INTEGER, TIMESTAMP
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy.sql import func

class LaporanWarga(Base):
    __tablename__ = "laporan_warga"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    tps_id = Column(INTEGER(unsigned=True), ForeignKey('tps.id', ondelete="CASCADE"), nullable=False)
    warga_id = Column(INTEGER(unsigned=True), ForeignKey('warga.id', ondelete="SET NULL"))
    jenis_laporan = Column(Enum('Penuh', 'Rusak', 'Tidak Terawat', 'Lainnya'), nullable=False)
    deskripsi = Column(Text)
    foto_url = Column(String(255))
    tanggal_lapor = Column(TIMESTAMP, server_default=func.now())
    status_tindak_lanjut = Column(Enum('Belum Ditindaklanjuti', 'Diproses', 'Selesai'), nullable=False, default='Belum Ditindaklanjuti')
    ditindaklanjuti_oleh = Column(INTEGER(unsigned=True), ForeignKey('admin.id', ondelete="SET NULL"))
    catatan_admin = Column(String(255))
