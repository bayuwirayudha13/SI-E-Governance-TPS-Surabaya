from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    c.execute(text("ALTER TABLE users MODIFY role ENUM('admin','petugas','driver','superadmin','petugas_kelurahan') NOT NULL"))
    c.commit()
    print("Role enum updated: petugas_kelurahan added")
