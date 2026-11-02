from core.database import SessionLocal
from models.users import User
from models.warga import Warga

db = SessionLocal()
wargas = db.query(Warga).all()
for w in wargas:
    print(f'Warga ID {w.id}: nama={w.nama}, kecamatan={w.kecamatan}, kelurahan={w.kelurahan}')
db.close()