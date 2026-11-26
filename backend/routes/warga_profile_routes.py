
import uuid
import logging
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from core.database import get_db
from core.supabase import supabase, BUCKET_NAME
from auth.dependencies import get_current_user_from_token
from models.warga import Warga
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/warga/profile",
    tags=["Warga Profile"]
)

MAX_FILE_SIZE = 2 * 1024 * 1024

ALLOWED_IMAGES = {
    "image/jpeg": ("jpg", b"\xff\xd8\xff"),
    "image/png": ("png", b"\x89PNG\r\n\x1a\n"),
    "image/webp": ("webp", b"RIFF"),
}


def get_storage_path(photo_url: str):
    """Mengambil path file dari URL Public Supabase."""
    try:
        path = urlparse(photo_url).path
        marker = f"/storage/v1/object/public/{BUCKET_NAME}/"

        if marker not in path:
            return None

        return path.split(marker, 1)[1]
    except Exception:
        return None

class WargaProfileUpdate(BaseModel):
    nama: str = Field(..., min_length=2, max_length=100)
    no_hp: str | None = Field(default=None, max_length=20)
    alamat_rumah: str | None = Field(default=None, max_length=255)
    kecamatan: str | None = Field(default=None, max_length=100)
    kelurahan: str | None = Field(default=None, max_length=100)

@router.post("/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "warga":
        raise HTTPException(
            status_code=403,
            detail="Fitur ini hanya tersedia untuk warga"
        )

    warga = db.query(Warga).filter(
        Warga.id == current_user["id"]
    ).first()

    if not warga:
        raise HTTPException(status_code=404, detail="Warga tidak ditemukan")

    content_type = file.content_type

    if content_type not in ALLOWED_IMAGES:
        raise HTTPException(
            status_code=400,
            detail="Format foto harus JPG, PNG, atau WEBP"
        )

    image_data = await file.read(MAX_FILE_SIZE + 1)

    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Ukuran foto maksimal 2 MB"
        )

    extension, signature = ALLOWED_IMAGES[content_type]

    if not image_data.startswith(signature):
        raise HTTPException(
            status_code=400,
            detail="Isi file tidak sesuai dengan format gambar"
        )

    if content_type == "image/webp" and image_data[8:12] != b"WEBP":
        raise HTTPException(
            status_code=400,
            detail="File WEBP tidak valid"
        )

    file_path = f"warga/{warga.id}/{uuid.uuid4().hex}.{extension}"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=image_data,
            file_options={
                "content-type": content_type,
                "cache-control": "3600",
                "upsert": "false"
            }
        )

        photo_url = supabase.storage.from_(
            BUCKET_NAME
        ).get_public_url(file_path)

        old_photo_url = warga.foto_profil

        warga.foto_profil = photo_url
        db.commit()
        db.refresh(warga)

    except Exception as e:
        logger.error("ERROR UPLOAD FOTO PROFIL: %s", repr(e))

        db.rollback()

        try:
            supabase.storage.from_(BUCKET_NAME).remove([file_path])
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="Gagal mengunggah foto profil"
        )

    # Hapus foto lama setelah foto baru berhasil disimpan.
    if old_photo_url:
        old_path = get_storage_path(old_photo_url)

        if old_path and old_path != file_path:
            try:
                supabase.storage.from_(BUCKET_NAME).remove([old_path])
            except Exception:
                pass

    return {
        "message": "Foto profil berhasil diperbarui",
        "foto_profil": warga.foto_profil
    }


@router.delete("/photo")
def delete_profile_photo(
    current_user: dict = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "warga":
        raise HTTPException(
            status_code=403,
            detail="Fitur ini hanya tersedia untuk warga"
        )

    warga = db.query(Warga).filter(
        Warga.id == current_user["id"]
    ).first()

    if not warga:
        raise HTTPException(status_code=404, detail="Warga tidak ditemukan")

    if not warga.foto_profil:
        raise HTTPException(
            status_code=404,
            detail="Foto profil belum tersedia"
        )

    old_photo_url = warga.foto_profil
    old_path = get_storage_path(old_photo_url)

    if not old_path:
        raise HTTPException(
            status_code=400,
            detail="Lokasi foto profil tidak valid"
        )

    try:
        supabase.storage.from_(BUCKET_NAME).remove([old_path])

        warga.foto_profil = None
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Gagal menghapus foto profil"
        )

    return {
        "message": "Foto profil berhasil dihapus",
        "foto_profil": None
    }

@router.get("")
def get_warga_profile(
    current_user: dict = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "warga":
        raise HTTPException(status_code=403, detail="Akses khusus warga")

    warga = db.query(Warga).filter(
        Warga.id == current_user["id"]
    ).first()

    if not warga:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan")

    return {
        "id": warga.id,
        "nama": warga.nama,
        "email": warga.email,
        "no_hp": warga.no_hp,
        "alamat_rumah": warga.alamat_rumah,
        "kecamatan": warga.kecamatan,
        "kelurahan": warga.kelurahan,
        "foto_profil": warga.foto_profil,
        "total_poin": warga.total_poin
    }

@router.put("")
def update_warga_profile(
    payload: WargaProfileUpdate,
    current_user: dict = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "warga":
        raise HTTPException(status_code=403, detail="Akses khusus warga")

    warga = db.query(Warga).filter(
        Warga.id == current_user["id"]
    ).first()

    if not warga:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan")

    nama = payload.nama.strip()
    if len(nama) < 2:
        raise HTTPException(status_code=422, detail="Nama minimal 2 karakter")

    kecamatan = payload.kecamatan.strip() if payload.kecamatan else None
    kelurahan = payload.kelurahan.strip() if payload.kelurahan else None

    if not kecamatan and kelurahan:
        raise HTTPException(
            status_code=422,
            detail="Kecamatan harus dipilih terlebih dahulu"
        )

    warga.nama = nama
    warga.no_hp = payload.no_hp.strip() if payload.no_hp else None
    warga.alamat_rumah = payload.alamat_rumah.strip() if payload.alamat_rumah else None
    warga.kecamatan = kecamatan
    warga.kelurahan = kelurahan

    try:
        db.commit()
        db.refresh(warga)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Gagal menyimpan perubahan profil"
        )

    return {
        "message": "Profil berhasil diperbarui",
        "id": warga.id,
        "nama": warga.nama,
        "email": warga.email,
        "no_hp": warga.no_hp,
        "alamat_rumah": warga.alamat_rumah,
        "kecamatan": warga.kecamatan,
        "kelurahan": warga.kelurahan,
        "foto_profil": warga.foto_profil
    }
