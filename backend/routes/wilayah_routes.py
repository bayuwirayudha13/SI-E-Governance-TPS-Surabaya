from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from schemas.wilayah_schema import KecamatanResponse, KelurahanResponse
from services.wilayah_service import (
    get_all_kecamatan,
    get_all_kelurahan,
    get_kelurahan_by_id,
    get_kecamatan_by_id,
    get_wilayah_kota_list,
)

router = APIRouter(prefix="/wilayah", tags=["Wilayah"])

@router.get("/kecamatan", response_model=List[KecamatanResponse])
def list_kecamatan(db: Session = Depends(get_db)):
    """List semua kecamatan untuk filter dropdown"""
    return get_all_kecamatan(db)

@router.get("/kelurahan", response_model=List[KelurahanResponse])
def list_kelurahan(
    kecamatan: Optional[str] = Query(None, description="Filter by nama kecamatan"),
    db: Session = Depends(get_db),
):
    """List kelurahan, bisa filter by kecamatan"""
    return get_all_kelurahan(db, kecamatan)

@router.get("/kelurahan/{kelurahan_id}", response_model=KelurahanResponse)
def detail_kelurahan(kelurahan_id: int, db: Session = Depends(get_db)):
    kel = get_kelurahan_by_id(db, kelurahan_id)
    if not kel:
        raise HTTPException(status_code=404, detail="Kelurahan tidak ditemukan")
    return kel

@router.get("/kecamatan/{kecamatan_id}", response_model=KecamatanResponse)
def detail_kecamatan(kecamatan_id: int, db: Session = Depends(get_db)):
    kec = get_kecamatan_by_id(db, kecamatan_id)
    if not kec:
        raise HTTPException(status_code=404, detail="Kecamatan tidak ditemukan")
    return kec

@router.get("/wilayah-kota", response_model=List[str])
def list_wilayah_kota(db: Session = Depends(get_db)):
    """List wilayah kota (Surabaya Pusat, dll) untuk filter"""
    return get_wilayah_kota_list(db)
