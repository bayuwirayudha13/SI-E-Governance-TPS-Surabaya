from typing import List, Optional

from core.database import get_db
from core.security import get_current_user, require_admin, require_superadmin
from fastapi import APIRouter, Depends, HTTPException, Query
from auth.dependencies import get_current_user_from_token
from models.tps_kelurahan import TPSKelurahan
from models.tps_monitoring_report import TPSMonitoringReport
from models.tps import TPS
from models.users import User
from models.warga import Warga
from models.wilayah import Kecamatan, Kelurahan
from schemas.tps_schema import TPSCreate, TPSResponse, TPSUpdate
from services.tps_service import (
    get_active_public_tps,
    get_active_public_tps_with_coords,
)
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

router = APIRouter(prefix="/tps", tags=["TPS Management"])


@router.get("/public", response_model=List[TPSResponse])
def get_public_tps(db: Session = Depends(get_db)):
    """
    Get all active TPS for public display.
    No authentication required.
    Includes TPS without coordinates, but returns lat/lng for those that have them.
    """
    tps_list = get_active_public_tps_with_coords(db)
    return tps_list


@router.get("/warga")
def get_warga_tps_capacity(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_from_token),
):
    """Return active TPS in the authenticated resident's district and approved capacity only."""
    if current_user.get("role") != "warga":
        raise HTTPException(status_code=403, detail="Akses khusus Warga")

    warga = db.query(Warga).filter(Warga.id == current_user["id"]).first()
    if not warga:
        raise HTTPException(status_code=404, detail="Profil warga tidak ditemukan")

    kecamatan = (warga.kecamatan or "").strip()
    kelurahan = (warga.kelurahan or "").strip()
    if not kecamatan or not kelurahan:
        raise HTTPException(status_code=422, detail="Lengkapi kecamatan dan kelurahan pada profil warga")

    valid_kecamatan = db.query(Kecamatan.id).filter(
        func.lower(func.trim(Kecamatan.nama)) == kecamatan.lower()
    ).first()
    valid_kelurahan = db.query(Kelurahan.id).filter(
        func.lower(func.trim(Kelurahan.nama)) == kelurahan.lower(),
        func.lower(func.trim(Kelurahan.kecamatan)) == kecamatan.lower(),
    ).first()
    if not valid_kecamatan or not valid_kelurahan:
        raise HTTPException(status_code=422, detail="Wilayah pada profil warga tidak ditemukan di data wilayah")

    latest_approved_report_id = (
        select(TPSMonitoringReport.id)
        .where(
            TPSMonitoringReport.tps_id == TPS.id,
            TPSMonitoringReport.status_verifikasi == "Disetujui",
        )
        .order_by(
            TPSMonitoringReport.waktu_monitoring.desc(),
            TPSMonitoringReport.id.desc(),
        )
        .limit(1)
        .correlate(TPS)
        .scalar_subquery()
    )
    kelurahan_names = (
        select(func.group_concat(func.distinct(Kelurahan.nama)))
        .select_from(TPSKelurahan)
        .join(Kelurahan, Kelurahan.id == TPSKelurahan.kelurahan_id)
        .where(TPSKelurahan.tps_id == TPS.id)
        .correlate(TPS)
        .scalar_subquery()
    )
    query = (
        db.query(TPS, TPSMonitoringReport, kelurahan_names.label("kelurahan_list"))
        .outerjoin(
            TPSMonitoringReport,
            TPSMonitoringReport.id == latest_approved_report_id,
        )
        .filter(
            TPS.status == "Aktif",
            func.lower(func.trim(TPS.kecamatan)) == kecamatan.lower(),
        )
        .order_by(TPS.nama)
    )

    tps_data = []
    for tps, report, kelurahan_list in query.all():
        percentage = float(report.persentase_kapasitas) if report else None
        remaining_percentage = (
            round(max(0.0, 100.0 - percentage), 2)
            if percentage is not None
            else None
        )
        capacity_status = None
        if percentage is not None:
            capacity_status = (
                "Aman" if percentage <= 60
                else "Waspada" if percentage < 80
                else "Kritis"
            )

        tps_data.append({
            "id": tps.id,
            "nama": tps.nama,
            "nama_lama": tps.nama_lama,
            "lokasi": tps.lokasi,
            "kecamatan": tps.kecamatan,
            "wilayah_kota": tps.wilayah_kota,
            "kelurahan_list": kelurahan_list.split(",") if kelurahan_list else [],
            "latitude": float(tps.latitude) if tps.latitude is not None else None,
            "longitude": float(tps.longitude) if tps.longitude is not None else None,
            "jenis_tps": tps.jenis_tps,
            "jumlah_container": tps.jumlah_container,
            "daya_tampung_m3": float(tps.daya_tampung_m3) if tps.daya_tampung_m3 is not None else None,
            "status": tps.status,
            "persentase_kapasitas": percentage,
            "persentase_tersisa": remaining_percentage,
            "volume_aktual_m3": float(report.volume_aktual_m3) if report else None,
            "waktu_monitoring_terakhir": report.waktu_monitoring.isoformat() if report else None,
            "waktu_verifikasi_terakhir": report.waktu_verifikasi.isoformat() if report and report.waktu_verifikasi else None,
            "status_kapasitas": capacity_status,
            "ada_monitoring_terverifikasi": report is not None,
        })

    return {
        "wilayah_warga": {"kecamatan": kecamatan, "kelurahan": kelurahan},
        "tps": tps_data,
    }


@router.get("/")
def list_tps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    kecamatan: Optional[str] = None,
    wilayah_kota: Optional[str] = None,
    status: Optional[str] = None,
    kelurahan: Optional[str] = None,
    min_kapasitas: Optional[float] = None,
    max_kapasitas: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get TPS dengan filter:
    - search: cari berdasarkan nama, nama_lama, lokasi
    - kecamatan: filter berdasarkan kecamatan
    - kelurahan: filter berdasarkan kelurahan (dari tps_kelurahan)
    - wilayah_kota: filter berdasarkan wilayah kota
    - status: filter berdasarkan status (Aktif/Tidak Aktif)
    - min_kapasitas, max_kapasitas: filter berdasarkan daya_tampung_m3
    """
    kelurahan_names = (
        select(func.group_concat(func.distinct(Kelurahan.nama)))
        .select_from(TPSKelurahan)
        .join(Kelurahan, Kelurahan.id == TPSKelurahan.kelurahan_id)
        .where(TPSKelurahan.tps_id == TPS.id)
        .correlate(TPS)
        .scalar_subquery()
    )
    query = db.query(TPS, kelurahan_names.label("kelurahan"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                TPS.nama.like(search_pattern),
                TPS.nama_lama.like(search_pattern),
                TPS.lokasi.like(search_pattern),
                TPS.kecamatan.like(search_pattern),
            )
        )

    if kecamatan:
        query = query.filter(TPS.kecamatan == kecamatan)
    if wilayah_kota:
        query = query.filter(TPS.wilayah_kota == wilayah_kota)
    if status:
        query = query.filter(TPS.status == status)
    if min_kapasitas is not None:
        query = query.filter(TPS.daya_tampung_m3 >= min_kapasitas)
    if max_kapasitas is not None:
        query = query.filter(TPS.daya_tampung_m3 <= max_kapasitas)

    # Kelurahan filter: join tps_kelurahan table
    if kelurahan:
        from models.tps_kelurahan import TPSKelurahan

        query = (
            query.join(TPSKelurahan, TPS.id == TPSKelurahan.tps_id)
            .join(Kelurahan, TPSKelurahan.kelurahan_id == Kelurahan.id)
            .filter(Kelurahan.nama == kelurahan)
            .distinct()
        )

    results = query.offset(skip).limit(limit).all()
    # Return as dict to avoid Pydantic issues
    return [
        {
            "id": tps.id,
            "nama": tps.nama,
            "nama_lama": tps.nama_lama,
            "lokasi": tps.lokasi,
            "kecamatan": tps.kecamatan,
            "wilayah_kota": tps.wilayah_kota,
            "kelurahan": kelurahan_names,
            "latitude": str(tps.latitude) if tps.latitude else None,
            "longitude": str(tps.longitude) if tps.longitude else None,
            "jenis_tps": tps.jenis_tps,
            "jumlah_container": tps.jumlah_container,
            "daya_tampung_m3": str(tps.daya_tampung_m3)
            if tps.daya_tampung_m3
            else None,
            "status": tps.status,
            "sumber_data": tps.sumber_data,
            "tanggal_update": tps.tanggal_update,
            "catatan": tps.catatan,
        }
        for tps, kelurahan_names in results
    ]


@router.get("/{tps_id}", response_model=TPSResponse)
def get_tps(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detail TPS berdasarkan ID"""
    tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    return tps


@router.post("/", response_model=TPSResponse, status_code=201)
def create_tps(
    tps_data: TPSCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Tambah TPS baru (Superadmin only)"""
    try:
        db_tps = TPS(**tps_data.dict())
        db.add(db_tps)
        db.commit()
        db.refresh(db_tps)
        return db_tps
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal menambah TPS: {str(e)}")


@router.put("/{tps_id}", response_model=TPSResponse)
def update_tps(
    tps_id: int,
    tps_data: TPSUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update data TPS (Admin/Superadmin only)"""
    db_tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not db_tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")

    update_data = tps_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tps, field, value)

    db.commit()
    db.refresh(db_tps)
    return db_tps


@router.delete("/{tps_id}")
def delete_tps(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Hapus TPS (Superadmin only)"""
    db_tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not db_tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")

    db.delete(db_tps)
    db.commit()
    return {"message": "TPS berhasil dihapus", "id": tps_id}


@router.get("/kecamatan/{kecamatan}")
def get_tps_by_kecamatan(
    kecamatan: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all TPS by kecamatan for warga tracking map.
    Returns only TPS with valid coordinates (latitude, longitude).
    Kecamatan is validated against current user's profile kecamatan.
    """
    # Normalize kecamatan (strip whitespace, case-insensitive comparison)
    kecamatan_normalized = kecamatan.strip()

    # Validate user's kecamatan access: warga can only query their own kecamatan
    if current_user.role == "warga":
        # Get warga's kecamatan from kelurahan
        if not current_user.wilayah_kelurahan:
            raise HTTPException(
                status_code=403,
                detail="Profil warga belum memiliki kelurahan terdaftar",
            )

        warga_kelurahan = (
            db.query(Kelurahan)
            .filter(Kelurahan.nama == current_user.wilayah_kelurahan)
            .first()
        )

        if not warga_kelurahan or not warga_kelurahan.kecamatan:
            raise HTTPException(
                status_code=403, detail="Kelurahan warga tidak terdaftar"
            )

        warga_kecamatan = warga_kelurahan.kecamatan.strip()

        # Warga can only access their own kecamatan
        if kecamatan_normalized.lower() != warga_kecamatan.lower():
            raise HTTPException(
                status_code=403,
                detail="Akses ditolak: kecamatan tidak sesuai dengan profil warga",
            )

    # Query TPS by kecamatan with valid coordinates
    tps_list = (
        db.query(TPS)
        .filter(
            TPS.kecamatan.ilike(kecamatan_normalized),
            TPS.latitude.isnot(None),
            TPS.longitude.isnot(None),
            TPS.status == "Aktif",
        )
        .all()
    )

    # Return as dict to avoid Pydantic Decimal issues
    return [
        {
            "id": tps.id,
            "nama": tps.nama,
            "lokasi": tps.lokasi,
            "kecamatan": tps.kecamatan,
            "wilayah_kota": tps.wilayah_kota,
            "latitude": str(tps.latitude),
            "longitude": str(tps.longitude),
            "status": tps.status,
            "daya_tampung_m3": str(tps.daya_tampung_m3)
            if tps.daya_tampung_m3
            else None,
            "jenis_tps": tps.jenis_tps,
        }
        for tps in tps_list
    ]


@router.get("/wilayah/{wilayah_kota}", response_model=List[TPSResponse])
def get_tps_by_wilayah(
    wilayah_kota: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Filter TPS by wilayah kota"""
    tps_list = db.query(TPS).filter(TPS.wilayah_kota == wilayah_kota).all()
    if not tps_list:
        raise HTTPException(
            status_code=404, detail=f"Tidak ada TPS di wilayah {wilayah_kota}"
        )
    return tps_list
