from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.tps import TPS
from app.schemas.tps import TPSCreate, TPSResponse

router = APIRouter()

@router.get("/", response_model=List[TPSResponse])
def get_all_tps(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(TPS).offset(skip).limit(limit).all()

@router.post("/", response_model=TPSResponse, status_code=status.HTTP_201_CREATED)
def create_tps(tps: TPSCreate, db: Session = Depends(get_db)):
    db_tps = TPS(**tps.dict())
    db.add(db_tps)
    db.commit()
    db.refresh(db_tps)
    return db_tps
