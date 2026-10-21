from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER
from core.database import Base

class PengambilanSampah(Base):
    __tablename__ = "pengambilan_sampah"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True)
    warga_id = Column(INTEGER(unsigned=True), nullable=True)
    petugas_id = Column(INTEGER(unsigned=True), nullable=True)
    status = Column(String(50), default="Menunggu")
    foto_sampah = Column(String(255), nullable=True)
