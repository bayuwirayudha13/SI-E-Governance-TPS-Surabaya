from sqlalchemy import Column, Integer, String, Time, Enum
from core.database import Base
import enum

class TipeJadwal(enum.Enum):
    RUTIN = "Rutin"
    BESAR = "Besar"
    LIBUR = "Libur"

class JadwalPengambilan(Base):
    __tablename__ = "jadwal_pengambilan"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hari = Column(String(20), nullable=False)
    waktu_mulai = Column(Time, nullable=False)
    waktu_selesai = Column(Time, nullable=False)
    area = Column(String(255), nullable=False)
    petugas = Column(String(100), nullable=False)
    tipe = Column(Enum(TipeJadwal), default=TipeJadwal.RUTIN, nullable=False)
    tps_id = Column(Integer, nullable=True)