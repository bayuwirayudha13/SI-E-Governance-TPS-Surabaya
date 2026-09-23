from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import RoleChecker
from app.models.tps import TPS
from app.models.user import User
from app.schemas.alert import AlertItem, AlertResponse, RuteItem, RuteResponse

router = APIRouter(prefix="/alerts", tags=["Alert / Early Warning"])

@router.get("", response_model=AlertResponse)
def list_alerts(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin", "driver"]))):
    tps_list = db.query(TPS).filter(TPS.kapasitas_max > 0, TPS.status != "nonaktif").all()
    alerts = []
    for tps in tps_list:
        persentase = (tps.kapasitas_terisi / tps.kapasitas_max * 100) if tps.kapasitas_max > 0 else 0
        if persentase >= 80:
            alerts.append(AlertItem(tps_id=tps.id, tps_nama=tps.nama, alamat=tps.alamat, kapasitas_max=tps.kapasitas_max, kapasitas_terisi=tps.kapasitas_terisi, persentase=round(persentase, 1), status=tps.status.value if tps.status else "aktif", latitude=tps.latitude, longitude=tps.longitude))
    alerts.sort(key=lambda x: x.persentase, reverse=True)
    return AlertResponse(total=len(alerts), alerts=alerts)

@router.get("/rute", response_model=RuteResponse)
def rute_prioritas(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["driver"]))):
    tps_list = db.query(TPS).filter(TPS.kapasitas_max > 0, TPS.status != "nonaktif").all()
    items = []
    for tps in tps_list:
        persentase = (tps.kapasitas_terisi / tps.kapasitas_max * 100) if tps.kapasitas_max > 0 else 0
        if persentase >= 50: items.append({"tps": tps, "persentase": round(persentase, 1)})
    items.sort(key=lambda x: x["persentase"], reverse=True)
    rute = []
    for i, item in enumerate(items, 1):
        tps = item["tps"]
        rute.append(RuteItem(urutan=i, tps_id=tps.id, tps_nama=tps.nama, alamat=tps.alamat, persentase=item["persentase"], latitude=tps.latitude, longitude=tps.longitude))
    return RuteResponse(total=len(rute), rute=rute)
