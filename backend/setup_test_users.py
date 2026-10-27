import sys
sys.path.append('.')
from core.database import SessionLocal
from models.warga import Warga
from models.users import User
from auth.routes import pwd_context

db = SessionLocal()

# Set warga passwords for testing
new_password = "warga123"
hashed = pwd_context.hash(new_password)

for w in db.query(Warga).all():
    w.password_hash = hashed
    db.commit()
    print(f"Updated {w.email} with password: {new_password}")

# Update superadmin, petugas, driver passwords
new_password = "admin123"
hashed = pwd_context.hash(new_password)

for u in db.query(User).filter(User.email.in_([
    'superadmin@sipetasan.com',
    'petugas@sipetasan.com', 
    'driver@sipetasan.com'
])).all():
    u.hashed_password = hashed
    db.commit()
    print(f"Updated {u.email} with password: {new_password}")

print("\nAll test users ready")
