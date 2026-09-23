from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.setoran import SetoranSampah
from app.schemas.setoran import SetoranCreate, SetoranResponse

router = APIRouter()

@router.get("/", response_model=List[SetoranResponse])
def get_setoran(db: Session = Depends(get_db)):
    return db.query(SetoranSampah).all()

@router.post("/")
def create_setoran(setoran: SetoranCreate, db: Session = Depends(get_db)):
    db_setoran = SetoranSampah(**setoran.dict())
    db.add(db_setoran)
    db.commit()
    db.refresh(db_setoran)
    return db_setoran
