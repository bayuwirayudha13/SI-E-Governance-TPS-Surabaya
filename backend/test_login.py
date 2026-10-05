from core.database import SessionLocal
from models.users import Admin
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()
admin = db.query(Admin).filter(Admin.username == "superadmin@sampahpintar.com").first()
db.close()

if admin:
    print(f"User: {admin.username}")
    print(f"Hash: {admin.password_hash}")
    
    # Test password
    test_pass = "superadmin123"
    is_valid = pwd_context.verify(test_pass, admin.password_hash)
    print(f"Password '{test_pass}' valid: {is_valid}")
    
    # Coba hash baru
    new_hash = pwd_context.hash("superadmin123")
    is_valid2 = pwd_context.verify("superadmin123", new_hash)
    print(f"New hash valid: {is_valid2}")
else:
    print("User tidak ditemukan")
