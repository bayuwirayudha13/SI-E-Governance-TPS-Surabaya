from pydantic import BaseModel
from typing import Optional, List

class AlertItem(BaseModel):
    tps_id: int
    tps_nama: str
    alamat: Optional[str] = None
    kapasitas_max: float = 0
    kapasitas_terisi: float = 0
    persentase: float = 0
    status: str = "penuh"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AlertResponse(BaseModel):
    total: int = 0
    alerts: List[AlertItem] = []

class RuteItem(BaseModel):
    urutan: int
    tps_id: int
    tps_nama: str
    alamat: Optional[str] = None
    persentase: float = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RuteResponse(BaseModel):
    total: int = 0
    rute: List[RuteItem] = []
