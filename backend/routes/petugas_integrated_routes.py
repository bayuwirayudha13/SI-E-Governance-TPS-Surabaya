from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from models.setoran import SetoranSampah
from models.warga import Warga
from models.users import User
from schemas.setoran_schema import Setoran_SampahUpdate
from services.setoran_service import (
    get_setoran_by_qr, 
    get_pending_queue, 
    get_daily_stats,
    get_petugas_history,
    update_setoran_status
)
from core.security import get_current_user
from typing import Optional
from datetime import datetime, date
import shutil
import os

router = APIRouter(prefix="/petugas", tags=["Petugas Integrated"])

UPLOAD_DIR = "uploads/pengambilan"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/scan-qr-validate")
def scan_qr_validate(
    qr_code: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1: Validate QR code and check petugas authority.
    Returns setoran data if valid.
    """
    # Find setoran by QR
    setoran = get_setoran_by_qr(db, qr_code)
    if not setoran:
        raise HTTPException(status_code=404, detail="QR tidak ditemukan di sistem")
    
    if setoran.status not in ['Menunggu Penjemputan', 'Sedang Diproses']:
        raise HTTPException(status_code=400, detail=f"Setoran sudah {setoran.status}")
    
    # Get warga data
    warga = db.query(Warga).filter(Warga.id == setoran.warga_id).first()
    if not warga:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan")
    
    # Check petugas authority
    petugas_kelurahan = current_user.wilayah_kelurahan
    petugas_kecamatan = current_user.wilayah_kecamatan
    
    if petugas_kelurahan and warga.kelurahan != petugas_kelurahan:
        raise HTTPException(status_code=403, detail=f"Setoran di luar wilayah tugas Anda (Kelurahan {petugas_kelurahan})")
    elif petugas_kecamatan and warga.kecamatan != petugas_kecamatan:
        raise HTTPException(status_code=403, detail=f"Setoran di luar wilayah tugas Anda (Kecamatan {petugas_kecamatan})")
    
    # Mark as being processed
    setoran.status = 'Sedang Diproses'
    setoran.petugas_id = current_user.id
    db.commit()
    
    return {
        "setoran_id": setoran.id,
        "qr_code": setoran.qr_code,
        "warga": {
            "id": warga.id,
            "nama": warga.nama,
            "alamat_rumah": warga.alamat_rumah,
            "kelurahan": warga.kelurahan,
            "kecamatan": warga.kecamatan
        },
        "jenis_sampah_dilaporkan": setoran.jenis_sampah,
        "perkiraan_berat_kg": float(setoran.perkiraan_berat_kg) if setoran.perkiraan_berat_kg else 0,
        "status": setoran.status
    }

@router.post("/complete-verification")
async def complete_verification(
    setoran_id: int = Form(...),
    berat_aktual_kg: float = Form(...),
    kondisi_sampah: str = Form(...),
    jenis_sampah_terverifikasi: Optional[str] = Form(None),
    hasil_pemeriksaan: str = Form("Sesuai"),
    catatan_petugas: Optional[str] = Form(None),
    foto_bukti: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 2: Complete verification with photo, weight, and condition check.
    Calculates points and finalizes transaction.
    """
    setoran = db.query(SetoranSampah).filter(SetoranSampah.id == setoran_id).first()
    if not setoran:
        raise HTTPException(status_code=404, detail="Setoran tidak ditemukan")
    
    if setoran.status == 'Sudah Divalidasi':
        raise HTTPException(status_code=400, detail="Setoran sudah divalidasi sebelumnya")
    
    # Upload foto
    foto_url = None
    if foto_bukti:
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{setoran_id}_{foto_bukti.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(foto_bukti.file, buffer)
        foto_url = f"/uploads/pengambilan/{filename}"
    
    # Update setoran with verification data
    update_data = Setoran_SampahUpdate(
        status='Sudah Divalidasi',
        berat_aktual_kg=berat_aktual_kg,
        kondisi_sampah=kondisi_sampah,
        jenis_sampah_terverifikasi=jenis_sampah_terverifikasi or setoran.jenis_sampah,
        hasil_pemeriksaan=hasil_pemeriksaan,
        catatan_petugas=catatan_petugas,
        foto_bukti_url=foto_url
    )
    
    updated = update_setoran_status(db, setoran_id, update_data, current_user.id)
    
    return {
        "status": "success",
        "message": "Verifikasi berhasil",
        "setoran_id": setoran_id,
        "poin_diperoleh": updated.poin_diperoleh,
        "berat_aktual_kg": float(updated.berat_aktual_kg),
        "foto_url": foto_url
    }

@router.get("/queue")
def get_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pending setoran queue filtered by petugas wilayah"""
    kelurahan = current_user.wilayah_kelurahan
    kecamatan = current_user.wilayah_kecamatan
    
    pending = get_pending_queue(db, kecamatan, kelurahan)
    
    result = []
    for s in pending:
        warga = db.query(Warga).filter(Warga.id == s.warga_id).first()
        result.append({
            "setoran_id": s.id,
            "qr_code": s.qr_code,
            "warga_nama": warga.nama if warga else "Unknown",
            "warga_alamat": warga.alamat_rumah if warga else "",
            "kelurahan": warga.kelurahan if warga else "",
            "kecamatan": warga.kecamatan if warga else "",
            "jenis_sampah": s.jenis_sampah,
            "perkiraan_berat_kg": float(s.perkiraan_berat_kg) if s.perkiraan_berat_kg else 0,
            "waktu_setor": s.waktu_setor.isoformat() if s.waktu_setor else None,
            "status": s.status
        })
    
    return result

@router.get("/daily-stats")
def get_daily_petugas_stats(
    target_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily completion stats for current petugas"""
    petugas_id = current_user.id
    dt = date.fromisoformat(target_date) if target_date else date.today()
    
    stats = get_daily_stats(db, petugas_id, dt)
    
    # Get target from jadwal or use default
    # TODO: Implement proper target fetching from jadwal_pengambilan
    target = 10  # Default target
    
    return {
        "target_pengambilan": target,
        "sudah_diambil": stats["completed_count"],
        "persentase_selesai": round((stats["completed_count"] / target * 100)) if target > 0 else 0,
        "total_muatan_kg": stats["total_kg"],
        "tanggal": dt.isoformat()
    }

@router.get("/riwayat")
def get_riwayat_petugas(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get history of setoran handled by current petugas"""
    petugas_id = current_user.id
    history = get_petugas_history(db, petugas_id, limit)
    
    result = []
    for s in history:
        warga = db.query(Warga).filter(Warga.id == s.warga_id).first()
        result.append({
            "id": s.id,
            "waktu_validasi": s.waktu_validasi.isoformat() if s.waktu_validasi else None,
            "warga_nama": warga.nama if warga else "Unknown",
            "warga_alamat": warga.alamat_rumah if warga else "",
            "kelurahan": warga.kelurahan if warga else "",
            "jenis_sampah": s.jenis_sampah_terverifikasi or s.jenis_sampah,
            "berat_aktual_kg": float(s.berat_aktual_kg) if s.berat_aktual_kg else 0,
            "kondisi_sampah": s.kondisi_sampah,
            "hasil_pemeriksaan": s.hasil_pemeriksaan,
            "foto_bukti_url": s.foto_bukti_url,
            "catatan_petugas": s.catatan_petugas,
            "poin_diperoleh": s.poin_diperoleh,
            "status": s.status
        })
    
    return result

@router.get("/setoran/{setoran_id}")
def get_setoran_detail(
    setoran_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed setoran info"""
    setoran = db.query(SetoranSampah).filter(SetoranSampah.id == setoran_id).first()
    if not setoran:
        raise HTTPException(status_code=404, detail="Setoran tidak ditemukan")
    
    warga = db.query(Warga).filter(Warga.id == setoran.warga_id).first()
    petugas = db.query(User).filter(User.id == setoran.petugas_id).first() if setoran.petugas_id else None
    
    return {
        "id": setoran.id,
        "qr_code": setoran.qr_code,
        "warga": {
            "id": warga.id if warga else None,
            "nama": warga.nama if warga else "Unknown",
            "alamat": warga.alamat_rumah if warga else "",
            "kelurahan": warga.kelurahan if warga else "",
            "kecamatan": warga.kecamatan if warga else ""
        },
        "jenis_sampah_dilaporkan": setoran.jenis_sampah,
        "perkiraan_berat_kg": float(setoran.perkiraan_berat_kg) if setoran.perkiraan_berat_kg else 0,
        "berat_aktual_kg": float(setoran.berat_aktual_kg) if setoran.berat_aktual_kg else None,
        "jenis_sampah_terverifikasi": setoran.jenis_sampah_terverifikasi,
        "kondisi_sampah": setoran.kondisi_sampah,
        "hasil_pemeriksaan": setoran.hasil_pemeriksaan,
        "foto_bukti_url": setoran.foto_bukti_url,
        "catatan_petugas": setoran.catatan_petugas,
        "petugas_nama": petugas.nama_lengkap if petugas else None,
        "poin_diperoleh": setoran.poin_diperoleh,
        "status": setoran.status,
        "waktu_setor": setoran.waktu_setor.isoformat() if setoran.waktu_setor else None,
        "waktu_pemeriksaan": setoran.waktu_pemeriksaan.isoformat() if setoran.waktu_pemeriksaan else None,
        "waktu_validasi": setoran.waktu_validasi.isoformat() if setoran.waktu_validasi else None
    }
