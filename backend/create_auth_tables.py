from core.database import engine, Base
from models.users import Admin, PetugasPengangkut

Admin.__table__.create(bind=engine, checkfirst=True)
PetugasPengangkut.__table__.create(bind=engine, checkfirst=True)
print("Admin & Petugas tables created successfully")
