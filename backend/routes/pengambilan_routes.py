from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db

router = APIRouter(prefix="/pengambilan", tags=["Pengambilan Sampah"])

@router.get("/")
def get_pengambilan(db: Session = Depends(get_db)):
    return []

@router.post("/")
def create_pengambilan(db: Session = Depends(get_db)):
    return {"status": "success"}
