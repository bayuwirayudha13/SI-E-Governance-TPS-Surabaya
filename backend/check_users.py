import sys
sys.path.append('.')
from core.database import SessionLocal
from models.warga import Warga
from models.users import User
from auth.routes import pwd_context

db = SessionLocal()

print("=== WARGA USERS ===")
for w in db.query(Warga).all():
    print(f"Email: {w.email}")
    print(f"  warga123 match: {pwd_context.verify('warga123', w.password_hash)}")
    print()

print("=== ADMIN/OTHER USERS ===")
for u in db.query(User).all():
    print(f"Email: {u.email}, Role: {u.role}")
    print(f"  admin123 match: {pwd_context.verify('admin123', u.hashed_password)}")
    print()
