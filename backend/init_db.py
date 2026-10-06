from core.database import SessionLocal, engine, Base
from models.users import Admin
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_superadmin():
    db = SessionLocal()
    try:
        # Check if superadmin exists
        existing = db.query(Admin).filter(Admin.username == "superadmin").first()
        if existing:
            print("Superadmin already exists")
            return

        # Create superadmin
        superadmin = Admin(
            username="superadmin",
            password_hash=pwd_context.hash("superadmin123"),
            nama="Super Admin",
            role="super_admin"
        )
        db.add(superadmin)
        db.commit()
        print("Superadmin created: superadmin / superadmin123")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    init_superadmin()
