from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.mysql import INTEGER
from core.database import Base
from core.timezone import get_wib_now

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    warga_id = Column(INTEGER(unsigned=True), ForeignKey("warga.id"), nullable=False, index=True)
    status = Column(Enum("open", "closed"), default="open", nullable=False)
    first_admin_response_sent = Column(Boolean, default=False, nullable=False)
    assigned_petugas_id = Column(INTEGER(unsigned=True), ForeignKey("users.id"), nullable=True)
    conversation_type = Column(String(50), default="general", nullable=False)
    created_at = Column(DateTime, default=get_wib_now)
    updated_at = Column(DateTime, default=get_wib_now, onupdate=get_wib_now)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(INTEGER(unsigned=True), primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(INTEGER(unsigned=True), ForeignKey("chat_conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, nullable=False)
    sender_role = Column(Enum("warga", "admin", "superadmin"), nullable=False)
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=get_wib_now)
