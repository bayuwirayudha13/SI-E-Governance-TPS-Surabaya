from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError('Pesan tidak boleh kosong')
        if len(v.strip()) > 2000:
            raise ValueError('Pesan maksimal 2000 karakter')
        return v.strip()

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_role: str
    sender_name: str
    message: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    warga_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    first_admin_response_sent: bool = False
    assigned_petugas_id: Optional[int] = None
    warga_name: Optional[str] = None
    warga_email: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    pass  # No input needed, auto-create based on warga token

class WebSocketMessage(BaseModel):
    type: str  # "message", "error", "connected"
    data: Optional[dict] = None
    message: Optional[str] = None
