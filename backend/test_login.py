from core.database import SessionLocal
from models.users import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()
admin = db.query(User).filter(User.email == "superadmin@sipetasan.com").first()
db.close()

if admin:
    print(f"User: {admin.username} ({admin.email})")
    print(f"Hash: {admin.hashed_password}")
    
    test_pass = "admin123"
    is_valid = pwd_context.verify(test_pass, admin.hashed_password)
    print(f"Password '{test_pass}' valid: {is_valid}")
else:
    print("User tidak ditemukan")
