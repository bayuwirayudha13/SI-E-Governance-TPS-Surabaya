from sqlalchemy import Column, Integer, Text, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class LaporanWarga(Base):
    __tablename__ = "laporan_warga"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tps_id = Column(Integer, ForeignKey("tps.id"), nullable=False)
    warga_id = Column(Integer, ForeignKey("warga.id"), nullable=True)
    jenis_laporan = Column(Enum('Penuh', 'Rusak', 'Tidak Terawat', 'Lainnya'), nullable=False)
    deskripsi = Column(Text, nullable=True)
    foto_url = Column(String(255), nullable=True)
    tanggal_lapor = Column(DateTime, nullable=True)
    status_tindak_lanjut = Column(Enum('Belum Ditindaklanjuti', 'Diproses', 'Selesai'), default='Belum Ditindaklanjuti', nullable=False)
    ditindaklanjuti_oleh = Column(Integer, ForeignKey("users.id"), nullable=True)
    catatan_admin = Column(String(255), nullable=True)

    # relationships (optional)
    tps = relationship("TPS", foreign_keys=[tps_id])
    warga = relationship("Warga", foreign_keys=[warga_id])
    admin = relationship("User", foreign_keys=[ditindaklanjuti_oleh])
