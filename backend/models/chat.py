from sqlalchemy import Column, Integer, String, DateTime, Text
from core.database import Base
from core.timezone import get_wib_now

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender_id = Column(Integer, nullable=False) # Bisa users.id atau warga.id
    sender_name = Column(String(100), nullable=False)
    receiver_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=get_wib_now)
