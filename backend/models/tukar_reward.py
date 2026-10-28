from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, DECIMAL
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class TukarRewardHistory(Base):
    __tablename__ = "tukar_reward_history"
    
    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    warga_id = Column(INTEGER(unsigned=True), ForeignKey("warga.id"), nullable=False)
    
    # Reward details
    poin_digunakan = Column(INTEGER(unsigned=True), nullable=False)
    nominal_rupiah = Column(DECIMAL(12, 2), nullable=False)
    reward_title = Column(String(255), nullable=False)
    
    # E-wallet info
    ewallet_type = Column(String(50), nullable=False)  # DANA, OVO, GoPay, ShopeePay
    nomor_ewallet = Column(String(20), nullable=False)
    atas_nama = Column(String(100), nullable=False)
    
    # Status
    status = Column(
        Enum('Diproses', 'Selesai', 'Gagal', 'Pending'),
        default='Diproses',
        nullable=False
    )
    
    # Notes
    catatan = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship
    warga = relationship("Warga", foreign_keys=[warga_id])
