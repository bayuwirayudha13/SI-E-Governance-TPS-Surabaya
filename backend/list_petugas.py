from core.database import SessionLocal
from models.users import User

db = SessionLocal()
users = db.query(User).filter(User.role == 'petugas').all()
for u in users:
    print(f"{u.id} | {u.email} | {u.wilayah_kelurahan} | {u.wilayah_kecamatan} | active={u.is_active}")