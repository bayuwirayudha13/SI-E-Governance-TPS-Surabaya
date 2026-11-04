from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER
from sqlalchemy.orm import relationship
from core.database import Base
from core.timezone import get_wib_now

class PetugasTPSAssignment(Base):
    __tablename__ = "petugas_tps_assignments"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    user_id = Column(INTEGER(unsigned=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tps_id = Column(INTEGER(unsigned=True), ForeignKey("tps.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=get_wib_now, nullable=False)
    updated_at = Column(DateTime, default=get_wib_now, onupdate=get_wib_now, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    tps = relationship("TPS", foreign_keys=[tps_id])
