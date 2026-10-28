from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class TukarRewardCreate(BaseModel):
    warga_id: int
    poin_digunakan: int
    reward_title: str
    ewallet_type: str
    nominal_rupiah: Decimal
    nomor_ewallet: str
    atas_nama: str
    catatan: Optional[str] = None

class TukarRewardUpdate(BaseModel):
    status: Optional[str] = None
    catatan: Optional[str] = None

class TukarRewardResponse(BaseModel):
    id: int
    warga_id: int
    poin_digunakan: int
    nominal_rupiah: Decimal
    reward_title: str
    ewallet_type: str
    nomor_ewallet: str
    atas_nama: str
    status: str
    catatan: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TukarRewardHistoryResponse(BaseModel):
    id: int
    warga_id: int
    poin_digunakan: int
    nominal_rupiah: Decimal
    reward_title: str
    ewallet_type: str
    nomor_ewallet: str
    atas_nama: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
