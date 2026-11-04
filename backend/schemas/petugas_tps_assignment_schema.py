from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PetugasTPSAssignmentCreate(BaseModel):
    user_id: int
    tps_id: int

class PetugasTPSAssignmentUpdate(BaseModel):
    user_id: Optional[int] = None
    tps_id: Optional[int] = None

class PetugasTPSAssignmentResponse(BaseModel):
    id: int
    user_id: int
    tps_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True