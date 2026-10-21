from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint, DateTime
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import relationship
from core.database import Base
from core.timezone import get_wib_now

class TPSKelurahan(Base):
    __tablename__ = "tps_kelurahan"

    tps_id = Column(INTEGER(unsigned=True), ForeignKey("tps.id", ondelete="CASCADE"), nullable=False, index=True)
    kelurahan_id = Column(INTEGER(unsigned=True), ForeignKey("kelurahan.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=get_wib_now)

    __table_args__ = (
        PrimaryKeyConstraint("tps_id", "kelurahan_id"),
    )

    # Relationships
    tps = relationship("TPS", foreign_keys=[tps_id], back_populates="kelurahans")
    kelurahan = relationship("Kelurahan", foreign_keys=[kelurahan_id])
