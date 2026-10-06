from pydantic import BaseModel, ConfigDict
from typing import Optional

class SystemSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    website_name: str
    website_email: str

class SystemSettingsUpdate(BaseModel):
    website_name: Optional[str] = None
    website_email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
