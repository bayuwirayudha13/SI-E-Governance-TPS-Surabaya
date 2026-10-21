from sqlalchemy import Column, Integer, String, Time, Enum
from sqlalchemy.dialects.mysql import INTEGER
from core.database import Base
import enum

class TipeJadwal(enum.Enum):
    RUTIN = "Rutin"
    BESAR = "Besar"
    LIBUR = "Libur"

class JadwalPengambilan(Base):
    __tablename__ = "jadwal_pengambilan"
    
    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    hari = Column(String(20), nullable=False)
    waktu_mulai = Column(Time, nullable=False)
    waktu_selesai = Column(Time, nullable=False)
    area = Column(String(255), nullable=False)
    petugas = Column(String(100), nullable=False)
    tipe = Column(Enum(TipeJadwal), default=TipeJadwal.RUTIN, nullable=False)
    tps_id = Column(INTEGER(unsigned=True), nullable=True)