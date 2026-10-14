from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    petugas_id = Column(Integer, nullable=True)
    warga_id = Column(Integer, nullable=True)
    qr_token = Column(Text, nullable=False)
    nama_warga = Column(String(100), nullable=True)
    alamat_warga = Column(String(255), nullable=True)
    kelurahan = Column(String(100), nullable=True)
    jenis_sampah = Column(String(100), nullable=True)
    berat = Column(String(50), nullable=True)
    foto_bukti_url = Column(String(255), nullable=True)
    catatan = Column(Text, nullable=True)
    scanned_at = Column(DateTime, default=datetime.utcnow)
