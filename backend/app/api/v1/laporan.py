from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.laporan import LaporanWarga
from app.schemas.laporan import LaporanCreate, LaporanResponse

router = APIRouter()

@router.get("/", response_model=List[LaporanResponse])
def get_laporan(db: Session = Depends(get_db)):
    return db.query(LaporanWarga).all()

@router.post("/")
def create_laporan(laporan: LaporanCreate, db: Session = Depends(get_db)):
    db_laporan = LaporanWarga(**laporan.dict())
    db.add(db_laporan)
    db.commit()
    db.refresh(db_laporan)
    return db_laporan
