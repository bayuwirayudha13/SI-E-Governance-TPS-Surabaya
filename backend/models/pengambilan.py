from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from core.database import Base
from core.timezone import get_wib_now

class PengambilanSampah(Base):
    __tablename__ = "pengambilan_sampah"

    id = Column(Integer, primary_key=True, index=True)
    warga_id = Column(Integer, nullable=True)
    petugas_id = Column(Integer, nullable=True)
    status = Column(String(50), default="Menunggu")
    waktu_pengambilan = Column(DateTime, default=get_wib_now)
    foto_sampah = Column(String(255), nullable=True)
