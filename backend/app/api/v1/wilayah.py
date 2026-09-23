from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.wilayah import Kecamatan, Kelurahan
from app.schemas.wilayah import KecamatanResponse, KelurahanResponse

router = APIRouter()

@router.get("/kecamatan", response_model=List[KecamatanResponse])
def get_kecamatan(db: Session = Depends(get_db)):
    return db.query(Kecamatan).all()

@router.get("/kelurahan", response_model=List[KelurahanResponse])
def get_kelurahan(db: Session = Depends(get_db)):
    return db.query(Kelurahan).all()
