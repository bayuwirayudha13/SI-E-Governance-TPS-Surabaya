from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from core.database import Base
from core.timezone import get_wib_now

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    warga_id = Column(Integer, ForeignKey("warga.id"), nullable=False, index=True)
    status = Column(Enum("open", "closed"), default="open", nullable=False)
    created_at = Column(DateTime, default=get_wib_now)
    updated_at = Column(DateTime, default=get_wib_now, onupdate=get_wib_now)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, nullable=False)
    sender_role = Column(Enum("warga", "admin", "superadmin"), nullable=False)
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=get_wib_now)
