from sqlalchemy import Column, Integer, String, DateTime
from core.database import Base
from core.timezone import get_wib_now

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    website_name = Column(String(255), default="SI-PETASAN", nullable=False)
    website_email = Column(String(255), default="admin@sipetasan.com", nullable=False)
    admin_password_hash = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=get_wib_now, onupdate=get_wib_now)
