from sqlalchemy import Column, DateTime, Enum, ForeignKey, Text, DECIMAL
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import relationship
from core.database import Base
from core.timezone import get_wib_now

class TPSMonitoringReport(Base):
    __tablename__ = "tps_monitoring_reports"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    petugas_id = Column(INTEGER(unsigned=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tps_id = Column(INTEGER(unsigned=True), ForeignKey("tps.id", ondelete="CASCADE"), nullable=False)
    volume_aktual_m3 = Column(DECIMAL(8, 2), nullable=False)
    persentase_kapasitas = Column(DECIMAL(6, 2), nullable=False)
    foto_url = Column(Text, nullable=True)
    catatan_kondisi = Column(Text, nullable=True)
    waktu_monitoring = Column(DateTime, nullable=False)
    status_verifikasi = Column(Enum('Menunggu Verifikasi', 'Disetujui', 'Ditolak'), nullable=False, default='Menunggu Verifikasi')
    alasan_penolakan = Column(Text, nullable=True)
    diverifikasi_oleh = Column(INTEGER(unsigned=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    waktu_verifikasi = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_wib_now, nullable=False)
    updated_at = Column(DateTime, default=get_wib_now, onupdate=get_wib_now, nullable=False)

    petugas = relationship("User", foreign_keys=[petugas_id])
    tps = relationship("TPS", foreign_keys=[tps_id])
    verifikator = relationship("User", foreign_keys=[diverifikasi_oleh])