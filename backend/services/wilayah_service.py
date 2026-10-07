from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import List, Optional

def get_all_kecamatan(db: Session, search: Optional[str] = None) -> List[Kecamatan]:
    from models.wilayah import Kecamatan, Kelurahan
    result = db.query(Kecamatan).order_by(Kecamatan.nama)
    if search:
        result = result.filter(Kecamatan.nama.ilike(f"{search}%"))
    result = result.all()
    if result:
        return result
    # fallback: ambil distinct dari kelurahan jika tabel kecamatan kosong
    q = db.query(distinct(Kelurahan.kecamatan)).order_by(Kelurahan.kecamatan)
    if search:
        q = q.filter(Kelurahan.kecamatan.ilike(f"{search}%"))
    rows = q.all()
    # rows = [(kecamatan,), ...]
    return [Kecamatan(id=i+1, nama=r[0], kode=None) for i, r in enumerate(rows) if r[0]]

def get_all_kelurahan(db: Session, kecamatan: Optional[str] = None, search: Optional[str] = None) -> List[Kelurahan]:
    from models.wilayah import Kelurahan
    q = db.query(Kelurahan).order_by(Kelurahan.nama)
    if kecamatan:
        q = q.filter(Kelurahan.kecamatan == kecamatan)
    if search:
        q = q.filter(Kelurahan.nama.ilike(f"{search}%"))
    return q.all()

def get_kelurahan_by_id(db: Session, kelurahan_id: int) -> Optional[Kelurahan]:
    return db.query(Kelurahan).filter(Kelurahan.id == kelurahan_id).first()

def get_kecamatan_by_id(db: Session, kecamatan_id: int) -> Optional[Kecamatan]:
    return db.query(Kecamatan).filter(Kecamatan.id == kecamatan_id).first()

def get_wilayah_kota_list(db: Session) -> List[str]:
    rows = db.query(distinct(Kelurahan.wilayah_kota)).order_by(Kelurahan.wilayah_kota).all()
    return [r[0] for r in rows if r[0]]
