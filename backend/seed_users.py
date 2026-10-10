import bcrypt
from core.database import SessionLocal
from models.users import User

def hash_pw(pw: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw.encode('utf-8'), salt).decode('utf-8')

def seed_users():
    db = SessionLocal()
    try:
        users = [
            {
                "username": "superadmin",
                "email": "superadmin@sipetasan.com",
                "password": "superadmin123",
                "nama_lengkap": "Super Admin",
                "role": "superadmin"
            },
            {
                "username": "admin",
                "email": "admin@sipetasan.com",
                "password": "admin123",
                "nama_lengkap": "Administrator",
                "role": "admin"
            },
            {
                "username": "petugas",
                "email": "petugas@sipetasan.com",
                "password": "petugas123",
                "nama_lengkap": "Petugas TPS",
                "role": "petugas"
            },
            {
                "username": "driver",
                "email": "driver@sipetasan.com",
                "password": "driver123",
                "nama_lengkap": "Driver Pengangkut",
                "role": "driver"
            }
        ]

        for data in users:
            existing = db.query(User).filter(User.email == data["email"]).first()
            if existing:
                existing.hashed_password = hash_pw(data["password"])
                existing.role = data["role"]
                print(f"Updated: {data['email']} (role: {data['role']})")
            else:
                user = User(
                    username=data["username"],
                    email=data["email"],
                    hashed_password=hash_pw(data["password"]),
                    nama_lengkap=data["nama_lengkap"],
                    role=data["role"]
                )
                db.add(user)
                print(f"Created: {data['email']} / {data['password']}")
        
        db.commit()
        print("\nSeeding complete!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
