from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class WargaBase(BaseModel):
    nama: str
    email: EmailStr
    no_hp: Optional[str] = None

class WargaCreate(WargaBase):
    password: str

class WargaResponse(WargaBase):
    id: int
    total_poin: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
