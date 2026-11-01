from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, case
from typing import Dict, List, Any
from core.database import get_db
from core.security import get_current_user
from models.tps import TPS
from models.users import User
from models.laporan import LaporanWarga
from models.jadwal import JadwalPengambilan

router = APIRouter(prefix="/dashboard", tags=["Dashboard Statistics"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard statistics for Superadmin panel
    Returns:
    - total_tps: total TPS count
    - tps_by_status: count by status (Aktif/Tidak Aktif)
    - tps_by_region: count by wilayah_kota
    - avg_capacity_by_region: average daya_tampung_m3 per region
    - total_reports: total laporan warga
    - pending_reports: laporan with status_tindak_lanjut != 'Selesai'
    """
    
    # Total TPS
    total_tps = db.query(func.count(TPS.id)).scalar() or 0
    
    # TPS by status
    tps_by_status = db.query(
        TPS.status,
        func.count(TPS.id).label("count")
    ).group_by(TPS.status).all()
    
    # TPS by wilayah_kota (region)
    region_stats = db.query(
        TPS.wilayah_kota,
        func.count(TPS.id).label("total_tps"),
        func.count(TPS.id.distinct()).label("unique_tps"),
        func.avg(TPS.daya_tampung_m3).label("avg_capacity"),
        func.sum(
            case(
                (TPS.daya_tampung_m3 == None, 1),
                (TPS.daya_tampung_m3 == 0, 1),
                else_=0
            )
        ).label("missing_capacity")
    ).group_by(TPS.wilayah_kota).all()
    
    # Average capacity across all TPS
    avg_capacity_all = db.query(func.avg(TPS.daya_tampung_m3)).scalar() or 0
    
    # Total reports
    total_reports = db.query(func.count(LaporanWarga.id)).scalar() or 0
    
    # Pending reports (not Selesai)
    pending_reports = db.query(func.count(LaporanWarga.id)).filter(
        LaporanWarga.status_tindak_lanjut != 'Selesai'
    ).scalar() or 0
    
    # Format region stats
    region_data = []
    for region in region_stats:
        region_data.append({
            "wilayah_kota": region.wilayah_kota,
            "total_tps": region.total_tps,
            "avg_capacity": float(region.avg_capacity) if region.avg_capacity else None,
            "has_capacity_data": region.missing_capacity < region.total_tps
        })
    
    return {
        "total_tps": total_tps,
        "tps_by_status": [{"status": s.status, "count": s.count} for s in tps_by_status],
        "regions": region_data,
        "avg_capacity_all": float(avg_capacity_all) if avg_capacity_all else None,
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "timestamp": "2026-11-01T16:41:27.970Z"  # static for now
    }