from pydantic import BaseModel
from typing import Optional, List

class StatistikWilayahItem(BaseModel):
    kecamatan_id: Optional[int] = None
    kecamatan_nama: Optional[str] = None
    kelurahan_id: Optional[int] = None
    kelurahan_nama: Optional[str] = None
    jumlah_tps: int = 0
    total_kapasitas_max: float = 0
    total_kapasitas_terisi: float = 0
    persentase_rata: float = 0

class StatistikWilayahResponse(BaseModel):
    data: List[StatistikWilayahItem] = []

class HeatmapItem(BaseModel):
    latitude: float
    longitude: float
    intensitas: float

class HeatmapResponse(BaseModel):
    data: List[HeatmapItem] = []

class KapasitasTrenItem(BaseModel):
    tanggal: str
    rata_rata_persentase: float = 0
    total_terisi: float = 0
    total_max: float = 0

class KapasitasTrenResponse(BaseModel):
    data: List[KapasitasTrenItem] = []

class StatistikPengangkutanResponse(BaseModel):
    total_pengangkutan: int = 0
    total_berat_plastik_kg: float = 0
    rata_rata_berat_per_hari: float = 0
    data_harian: List[dict] = []
