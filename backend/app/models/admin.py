from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.mysql import INTEGER, TIMESTAMP
from app.core.database import Base
from sqlalchemy.sql import func

class Admin(Base):
    __tablename__ = "admin"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nama = Column(String(100), nullable=False)
    role = Column(Enum('super_admin', 'petugas'), nullable=False, default='petugas')
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
