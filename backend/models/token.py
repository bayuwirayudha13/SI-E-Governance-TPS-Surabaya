from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.dialects.mysql import INTEGER
from core.database import Base
from core.timezone import get_wib_now

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    user_id = Column(INTEGER(unsigned=True), nullable=False, index=True)
    user_type = Column(Enum('warga', 'admin', 'petugas', 'driver', 'superadmin'), nullable=False)
    token = Column(String(500), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=get_wib_now)
    revoked_at = Column(DateTime, nullable=True)


class TokenRevocation(Base):
    __tablename__ = "token_revocations"
    
    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    user_id = Column(INTEGER(unsigned=True), nullable=False, index=True)
    user_type = Column(Enum('warga', 'admin', 'petugas', 'driver', 'superadmin'), nullable=False)
    reason = Column(String(255), nullable=True)
    revoked_at = Column(DateTime, default=get_wib_now)
