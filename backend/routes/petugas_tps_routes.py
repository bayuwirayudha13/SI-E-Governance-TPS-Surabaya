from typing import List, Optional
from datetime import datetime, timezone

from core.database import get_db
from core.security import (
    get_current_user,
    require_petugas_tps,
    require_superadmin,
)
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from models.petugas_tps_assignment import PetugasTPSAssignment
from models.tps import TPS
from models.tps_monitoring_report import TPSMonitoringReport
from models.users import User
from schemas.petugas_tps_assignment_schema import PetugasTPSAssignmentResponse
from schemas.tps_monitoring_report_schema import (
    TPSMonitoringReportCreate,
    TPSMonitoringReportResponse,
)
from services.petugas_tps_assignment_service import (
    create_petugas_tps_assignment,
    get_petugas_tps_assignments_by_user_id,
    get_petugas_tps_assignments_by_tps_id,
    remove_petugas_tps_assignment,
)
from services.tps_monitoring_report_service import (
    approve_tps_monitoring_report,
    create_tps_monitoring_report,
    get_approved_tps_monitoring_reports,
    get_all_tps_monitoring_reports,
    get_pending_tps_monitoring_reports,
    get_rejected_tps_monitoring_reports,
    get_tps_monitoring_reports_by_petugas_id,
    get_tps_monitoring_reports_by_tps_id,
    reject_tps_monitoring_report,
)
from sqlalchemy.orm import Session
import os
import shutil

router = APIRouter(prefix="/petugas-tps", tags=["Petugas TPS"])

UPLOAD_DIR = "uploads/monitoring"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --- Superadmin: List Petugas TPS users ---

@router.get("/users", response_model=List[dict])
def list_petugas_tps_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List semua Petugas TPS (Superadmin only)"""
    users = (
        db.query(User).filter(User.role == "petugas_tps").all()
    )
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "nama_lengkap": u.nama_lengkap,
            "role": u.role,
            "is_active": u.is_active,
            "wilayah_kecamatan": getattr(u, "wilayah_kecamatan", None),
            "wilayah_kelurahan": getattr(u, "wilayah_kelurahan", None),
            "wilayah_kota": getattr(u, "wilayah_kota", None),
            "foto_url": getattr(u, "foto_url", None),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


# --- Superadmin: Assign TPS to Petugas TPS ---

@router.get("/assignments", response_model=List[PetugasTPSAssignmentResponse])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List semua penugasan TPS (Superadmin only)"""
    return get_all_petugas_tps_assignments(db)


@router.get("/assignments/user/{user_id}", response_model=List[PetugasTPSAssignmentResponse])
def get_assignments_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get TPS assignments for a specific user (Superadmin only)"""
    assignments = get_petugas_tps_assignments_by_user_id(db, user_id)
    return assignments


@router.post("/assignments", status_code=201)
def assign_tps_to_petugas(
    tps_ids: List[int],
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Assign TPS(s) to a Petugas TPS (Superadmin only)"""
    # Verify user exists and is petugas_tps
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.role != "petugas_tps":
        raise HTTPException(
            status_code=400, detail="User tidak memiliki role Petugas TPS"
        )

    for tps_id in tps_ids:
        # Verify TPS exists
        tps = db.query(TPS).filter(TPS.id == tps_id).first()
        if not tps:
            raise HTTPException(status_code=404, detail=f"TPS ID {tps_id} tidak ditemukan")

        # Check duplicate assignment
        existing = (
            db.query(PetugasTPSAssignment)
            .filter(
                PetugasTPSAssignment.user_id == user_id,
                PetugasTPSAssignment.tps_id == tps_id,
            )
            .first()
        )
        if existing:
            continue  # skip duplicate

        assignment = PetugasTPSAssignment(user_id=user_id, tps_id=tps_id)
        db.add(assignment)

    db.commit()
    return {"message": "TPS berhasil ditetapkan ke Petugas TPS"}


@router.delete("/assignments/{user_id}/{tps_id}")
def remove_assignment(
    user_id: int,
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Remove TPS assignment from Petugas TPS (Superadmin only)"""
    success = remove_petugas_tps_assignment(db, user_id, tps_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
    return {"message": "Penugasan TPS berhasil dihapus"}


# --- Petugas TPS: Get assigned TPS ---

@router.get("/my-tps", response_model=List[dict])
def get_my_assigned_tps(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_petugas_tps),
):
    """Get TPS assigned to current Petugas TPS"""
    assignments = get_petugas_tps_assignments_by_user_id(db, current_user.id)
    result = []
    for a in assignments:
        tps = db.query(TPS).filter(TPS.id == a.tps_id).first()
        if tps:
            result.append(
                {
                    "id": tps.id,
                    "nama": tps.nama,
                    "lokasi": tps.lokasi,
                    "kecamatan": tps.kecamatan,
                    "wilayah_kota": tps.wilayah_kota,
                    "latitude": str(tps.latitude) if tps.latitude else None,
                    "longitude": str(tps.longitude) if tps.longitude else None,
                    "daya_tampung_m3": str(tps.daya_tampung_m3) if tps.daya_tampung_m3 else None,
                    "status": tps.status,
                    "jenis_tps": tps.jenis_tps,
                    "jumlah_container": tps.jumlah_container,
                }
            )
    return result


# --- Petugas TPS: Dashboard stats ---

@router.get("/dashboard-stats", response_model=dict)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_petugas_tps),
):
    """Get dashboard statistics for Petugas TPS"""
    assignments = get_petugas_tps_assignments_by_user_id(db, current_user.id)
    total_tps = len(assignments)

    # Count reports by status
    total_monitoring = (
        db.query(TPSMonitoringReport)
        .filter(TPSMonitoringReport.petugas_id == current_user.id)
        .count()
    )
    pending_reports = (
        db.query(TPSMonitoringReport)
        .filter(
            TPSMonitoringReport.petugas_id == current_user.id,
            TPSMonitoringReport.status_verifikasi == "Menunggu Verifikasi",
        )
        .count()
    )
    approved_reports = (
        db.query(TPSMonitoringReport)
        .filter(
            TPSMonitoringReport.petugas_id == current_user.id,
            TPSMonitoringReport.status_verifikasi == "Disetujui",
        )
        .count()
    )
    rejected_reports = (
        db.query(TPSMonitoringReport)
        .filter(
            TPSMonitoringReport.petugas_id == current_user.id,
            TPSMonitoringReport.status_verifikasi == "Ditolak",
        )
        .count()
    )

    # Last monitoring time
    last_report = (
        db.query(TPSMonitoringReport)
        .filter(TPSMonitoringReport.petugas_id == current_user.id)
        .order_by(TPSMonitoringReport.waktu_monitoring.desc())
        .first()
    )
    last_monitoring = last_report.waktu_monitoring.isoformat() if last_report else None

    return {
        "total_tps": total_tps,
        "total_monitoring": total_monitoring,
        "pending_reports": pending_reports,
        "approved_reports": approved_reports,
        "rejected_reports": rejected_reports,
        "last_monitoring": last_monitoring,
    }


# --- Petugas TPS: Monitoring Report ---

@router.post("/monitoring-report", status_code=201)
def create_monitoring_report(
    tps_id: int = Form(...),
    volume_aktual_m3: float = Form(...),
    persentase_kapasitas: float = Form(...),
    catatan_kondisi: Optional[str] = Form(None),
    waktu_monitoring: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_petugas_tps),
):
    """Create a new TPS monitoring report (Petugas TPS only)"""
    # Validate TPS is assigned to this petugas
    assignment = (
        db.query(PetugasTPSAssignment)
        .filter(
            PetugasTPSAssignment.user_id == current_user.id,
            PetugasTPSAssignment.tps_id == tps_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="Anda tidak ditugaskan ke TPS ini",
        )

    # Validate TPS exists
    tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")

    # Upload foto
    foto_url = None
    if foto:
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{current_user.id}_{tps_id}_{foto.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        foto_url = f"/{filepath}".replace("//", "/")

    waktu = (
        datetime.fromisoformat(waktu_monitoring)
        if waktu_monitoring
        else datetime.now(timezone.utc)
    )

    report_data = TPSMonitoringReportCreate(
        petugas_id=current_user.id,
        tps_id=tps_id,
        volume_aktual_m3=volume_aktual_m3,
        persentase_kapasitas=persentase_kapasitas,
        foto_url=foto_url,
        catatan_kondisi=catatan_kondisi,
        waktu_monitoring=waktu,
    )

    report = create_tps_monitoring_report(db, report_data)
    return {
        "message": "Laporan monitoring berhasil dikirim",
        "report_id": report.id,
        "status": report.status_verifikasi,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


# --- Petugas TPS: Monitoring Reports history ---

@router.get("/monitoring-reports", response_model=List[TPSMonitoringReportResponse])
def get_my_monitoring_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_petugas_tps),
):
    """Get monitoring reports by current Petugas TPS"""
    reports = get_tps_monitoring_reports_by_petugas_id(db, current_user.id)
    return reports


@router.get("/tps/{tps_id}/monitoring-reports", response_model=List[TPSMonitoringReportResponse])
def get_tps_monitoring_reports(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_petugas_tps),
):
    """Get monitoring reports for a specific assigned TPS (Petugas TPS only)"""
    # Validate TPS is assigned to this petugas
    assignment = (
        db.query(PetugasTPSAssignment)
        .filter(
            PetugasTPSAssignment.user_id == current_user.id,
            PetugasTPSAssignment.tps_id == tps_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="Anda tidak ditugaskan ke TPS ini",
        )
    reports = get_tps_monitoring_reports_by_tps_id(db, tps_id)
    return reports


# --- Admin/Superadmin: Verify monitoring reports ---

@router.get("/pending-reports", response_model=List[TPSMonitoringReportResponse])
def get_pending_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get all pending monitoring reports (Admin/Superadmin only)"""
    reports = get_pending_tps_monitoring_reports(db)
    return reports


@router.get("/approved-reports", response_model=List[TPSMonitoringReportResponse])
def get_approved_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get all approved monitoring reports (Admin/Superadmin only)"""
    reports = get_approved_tps_monitoring_reports(db)
    return reports


@router.get("/rejected-reports", response_model=List[TPSMonitoringReportResponse])
def get_rejected_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get all rejected monitoring reports (Admin/Superadmin only)"""
    reports = get_rejected_tps_monitoring_reports(db)
    return reports


@router.post("/monitoring-reports/{report_id}/approve", response_model=dict)
def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Approve a monitoring report (Admin/Superadmin only)"""
    report = approve_tps_monitoring_report(db, report_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return {
        "message": "Laporan berhasil disetujui",
        "report_id": report.id,
        "status": report.status_verifikasi,
    }


@router.post("/monitoring-reports/{report_id}/reject", response_model=dict)
def reject_report(
    report_id: int,
    alasan_penolakan: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Reject a monitoring report (Admin/Superadmin only)"""
    report = reject_tps_monitoring_report(db, report_id, current_user.id, alasan_penolakan)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return {
        "message": "Laporan berhasil ditolak",
        "report_id": report.id,
        "status": report.status_verifikasi,
        "alasan_penolakan": report.alasan_penolakan,
    }


# --- Admin/Superadmin: Get TPS with its assigned petugas ---

@router.get("/tps-assignments/{tps_id}", response_model=List[dict])
def get_tps_assigned_users(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get all users assigned to a specific TPS (Superadmin only)"""
    assignments = get_petugas_tps_assignments_by_tps_id(db, tps_id)
    result = []
    for a in assignments:
        user = db.query(User).filter(User.id == a.user_id).first()
        if user:
            result.append(
                {
                    "id": a.id,
                    "user_id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "nama_lengkap": user.nama_lengkap,
                    "role": user.role,
                    "is_active": user.is_active,
                }
            )
    return result


# --- Public/TPS info endpoint (for Petugas TPS dashboard TPS selection) ---

@router.get("/tps-info/{tps_id}", response_model=dict)
def get_tps_info(
    tps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get TPS info by ID (for any authenticated user with access)"""
    tps = db.query(TPS).filter(TPS.id == tps_id).first()
    if not tps:
        raise HTTPException(status_code=404, detail="TPS tidak ditemukan")
    return {
        "id": tps.id,
        "nama": tps.nama,
        "lokasi": tps.lokasi,
        "kecamatan": tps.kecamatan,
        "wilayah_kota": tps.wilayah_kota,
        "latitude": str(tps.latitude) if tps.latitude else None,
        "longitude": str(tps.longitude) if tps.longitude else None,
        "daya_tampung_m3": str(tps.daya_tampung_m3) if tps.daya_tampung_m3 else None,
        "status": tps.status,
        "jenis_tps": tps.jenis_tps,
        "jumlah_container": tps.jumlah_container,
    }
