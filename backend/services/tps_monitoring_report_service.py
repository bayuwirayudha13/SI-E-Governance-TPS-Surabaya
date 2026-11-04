from sqlalchemy.orm import Session
from typing import List, Optional
from models.tps_monitoring_report import TPSMonitoringReport
from schemas.tps_monitoring_report_schema import TPSMonitoringReportCreate, TPSMonitoringReportUpdate

def get_all_tps_monitoring_reports(db: Session, skip: int = 0, limit: int = 100) -> List[TPSMonitoringReport]:
    """Get all tps_monitoring_reports dengan pagination"""
    return db.query(TPSMonitoringReport).offset(skip).limit(limit).all()

def get_tps_monitoring_report_by_id(db: Session, report_id: int) -> Optional[TPSMonitoringReport]:
    """Get tps_monitoring_report by ID"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.id == report_id).first()

def get_tps_monitoring_reports_by_petugas_id(db: Session, petugas_id: int) -> List[TPSMonitoringReport]:
    """Get tps_monitoring_reports by petugas_id"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.petugas_id == petugas_id).all()

def get_tps_monitoring_reports_by_tps_id(db: Session, tps_id: int) -> List[TPSMonitoringReport]:
    """Get tps_monitoring_reports by tps_id"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.tps_id == tps_id).all()

def get_tps_monitoring_reports_by_verifikator_id(db: Session, verifikator_id: int) -> List[TPSMonitoringReport]:
    """Get tps_monitoring_reports by verifikator_id"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.diverifikasi_oleh == verifikator_id).all()

def create_tps_monitoring_report(db: Session, report_data: TPSMonitoringReportCreate) -> TPSMonitoringReport:
    """Create new tps_monitoring_report"""
    db_report = TPSMonitoringReport(**report_data.dict())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def update_tps_monitoring_report(db: Session, report_id: int, report_data: TPSMonitoringReportUpdate) -> Optional[TPSMonitoringReport]:
    """Update tps_monitoring_report"""
    db_report = db.query(TPSMonitoringReport).filter(TPSMonitoringReport.id == report_id).first()
    if not db_report:
        return None
    
    update_data = report_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_report, field, value)
    
    db.commit()
    db.refresh(db_report)
    return db_report

def delete_tps_monitoring_report(db: Session, report_id: int) -> bool:
    """Delete tps_monitoring_report"""
    db_report = db.query(TPSMonitoringReport).filter(TPSMonitoringReport.id == report_id).first()
    if not db_report:
        return False
    
    db.delete(db_report)
    db.commit()
    return True

def get_pending_tps_monitoring_reports(db: Session) -> List[TPSMonitoringReport]:
    """Get all pending tps_monitoring_reports (status = 'Menunggu Verifikasi')"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.status_verifikasi == 'Menunggu Verifikasi').all()

def get_approved_tps_monitoring_reports(db: Session) -> List[TPSMonitoringReport]:
    """Get all approved tps_monitoring_reports (status = 'Disetujui')"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.status_verifikasi == 'Disetujui').all()

def get_rejected_tps_monitoring_reports(db: Session) -> List[TPSMonitoringReport]:
    """Get all rejected tps_monitoring_reports (status = 'Ditolak')"""
    return db.query(TPSMonitoringReport).filter(TPSMonitoringReport.status_verifikasi == 'Ditolak').all()

def approve_tps_monitoring_report(db: Session, report_id: int, verifikator_id: int, alasan_penolakan: Optional[str] = None) -> Optional[TPSMonitoringReport]:
    """Approve tps_monitoring_report"""
    db_report = db.query(TPSMonitoringReport).filter(TPSMonitoringReport.id == report_id).first()
    if not db_report:
        return None
    
    db_report.status_verifikasi = 'Disetujui'
    db_report.diverifikasi_oleh = verifikator_id
    db_report.waktu_verifikasi = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(db_report)
    return db_report

def reject_tps_monitoring_report(db: Session, report_id: int, verifikator_id: int, alasan_penolakan: str) -> Optional[TPSMonitoringReport]:
    """Reject tps_monitoring_report"""
    from datetime import datetime, timezone
    
    db_report = db.query(TPSMonitoringReport).filter(TPSMonitoringReport.id == report_id).first()
    if not db_report:
        return None
    
    db_report.status_verifikasi = 'Ditolak'
    db_report.diverifikasi_oleh = verifikator_id
    db_report.waktu_verifikasi = datetime.now(timezone.utc)
    db_report.alasan_penolakan = alasan_penolakan
    
    db.commit()
    db.refresh(db_report)
    return db_report