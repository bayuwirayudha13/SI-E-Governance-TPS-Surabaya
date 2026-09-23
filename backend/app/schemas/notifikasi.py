from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotifikasiResponse(BaseModel):
    id: int
    user_id: int
    judul: str
    pesan: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True
