from core.database import SessionLocal, engine, Base
from models.users import Admin, PetugasPengangkut
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_admins():
    db = SessionLocal()
    try:
        admins = [
            {
                "email": "superadmin@sampahpintar.com",
                "password": "superadmin123",
                "nama": "Super Admin System",
                "role": "super_admin"
            },
            {
                "email": "admin@sampahpintar.com",
                "password": "admin123",
                "nama": "Admin Kelurahan",
                "role": "petugas"
            }
        ]

        petugas_list = [
            {
                "email": "petugas1@kelurahan.go.id",
                "password": "petugas123",
                "nama": "Budi Santoso",
                "no_hp": "081234567890",
                "wilayah_tugas": "Wilayah Utara"
            },
            {
                "email": "petugas2@kelurahan.go.id",
                "password": "petugas456",
                "nama": "Rizki Pratama",
                "no_hp": "081234567891",
                "wilayah_tugas": "Wilayah Selatan"
            }
        ]

        # Seed Admin
        for data in admins:
            existing = db.query(Admin).filter(Admin.username == data["email"]).first()
            if existing:
                existing.password_hash = pwd_context.hash(data["password"])
                print(f"Updated password for {data['email']}")
            else:
                admin = Admin(
                    username=data["email"],
                    password_hash=pwd_context.hash(data["password"]),
                    nama=data["nama"],
                    role=data["role"]
                )
                db.add(admin)
                print(f"Admin created: {data['email']} / {data['password']}")

        # Seed Petugas
        for data in petugas_list:
            existing = db.query(PetugasPengangkut).filter(PetugasPengangkut.username == data["email"]).first()
            if existing:
                existing.password_hash = pwd_context.hash(data["password"])
                print(f"Updated password for {data['email']}")
            else:
                petugas = PetugasPengangkut(
                    username=data["email"],
                    password_hash=pwd_context.hash(data["password"]),
                    nama=data["nama"],
                    no_hp=data["no_hp"],
                    wilayah_tugas=data["wilayah_tugas"]
                )
                db.add(petugas)
                print(f"Petugas created: {data['email']} / {data['password']}")
        
        db.commit()
        print("Seeder admin & petugas selesai.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admins()
