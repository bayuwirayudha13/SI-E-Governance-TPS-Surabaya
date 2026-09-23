from sqlalchemy import Column, String, ForeignKey, Time
from sqlalchemy.dialects.mysql import INTEGER, SET
from app.core.database import Base

class JadwalPengangkutan(Base):
    __tablename__ = "jadwal_pengangkutan"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    tps_id = Column(INTEGER(unsigned=True), ForeignKey('tps.id', ondelete="CASCADE"), nullable=False)
    hari = Column(SET('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), nullable=False)
    jam = Column(Time, nullable=False)
    keterangan = Column(String(100))
