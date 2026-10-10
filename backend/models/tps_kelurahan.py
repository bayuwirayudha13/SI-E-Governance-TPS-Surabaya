from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint, DateTime, func
from sqlalchemy.orm import relationship
from core.database import Base

class TPSKelurahan(Base):
    __tablename__ = "tps_kelurahan"

    tps_id = Column(Integer, ForeignKey("tps.id", ondelete="CASCADE"), nullable=False, index=True)
    kelurahan_id = Column(Integer, ForeignKey("kelurahan.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        PrimaryKeyConstraint("tps_id", "kelurahan_id"),
    )

    # Relationships
    tps = relationship("TPS", foreign_keys=[tps_id], back_populates="kelurahans")
    kelurahan = relationship("Kelurahan", foreign_keys=[kelurahan_id])
