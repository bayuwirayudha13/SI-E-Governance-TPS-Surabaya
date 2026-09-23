from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.notifikasi import Notifikasi
from app.models.user import User
from app.schemas.notifikasi import NotifikasiResponse

router = APIRouter(prefix="/notifikasi", tags=["Notifikasi"])

@router.get("", response_model=List[NotifikasiResponse])
def list_notifikasi(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notifikasi).filter(Notifikasi.user_id == current_user.id).order_by(Notifikasi.created_at.desc()).all()

@router.patch("/{notifikasi_id}/baca", response_model=NotifikasiResponse)
def tandai_dibaca(notifikasi_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notifikasi).filter(Notifikasi.id == notifikasi_id, Notifikasi.user_id == current_user.id).first()
    if not notif: raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.delete("/{notifikasi_id}")
def hapus_notifikasi(notifikasi_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notifikasi).filter(Notifikasi.id == notifikasi_id, Notifikasi.user_id == current_user.id).first()
    if not notif: raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    db.delete(notif)
    db.commit()
    return {"message": "Notifikasi berhasil dihapus"}
