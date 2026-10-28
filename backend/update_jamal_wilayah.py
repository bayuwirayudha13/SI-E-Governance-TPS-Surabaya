from core.database import SessionLocal
from models.users import User

db = SessionLocal()
user = db.query(User).filter(User.email == "jamal.petugas@sipetasan.com").first()
if user:
    user.wilayah_kelurahan = "Dupak"
    user.wilayah_kecamatan = "Krembangan"
    db.commit()
    print("Updated jamal wilayah to match warga 20")
else:
    print("User not found")
