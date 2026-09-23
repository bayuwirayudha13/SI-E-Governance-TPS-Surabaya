from sqlalchemy import Column, String
from sqlalchemy.dialects.mysql import INTEGER, TIMESTAMP
from app.core.database import Base
from sqlalchemy.sql import func

class Warga(Base):
    __tablename__ = "warga"
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    no_hp = Column(String(20))
    total_poin = Column(INTEGER(unsigned=True), nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
