from core.database import SessionLocal, engine
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("Checking jadwal_pengambilan table columns...")
        # Check if columns exist
        result = db.execute(text("SHOW COLUMNS FROM jadwal_pengambilan")).fetchall()
        columns = [r[0] for r in result]
        
        # Add kecamatan if not exists
        if 'kecamatan' not in columns:
            print("Adding column kecamatan...")
            db.execute(text("ALTER TABLE jadwal_pengambilan ADD COLUMN kecamatan VARCHAR(100) NULL"))
        
        # Add kelurahan if not exists
        if 'kelurahan' not in columns:
            print("Adding column kelurahan...")
            db.execute(text("ALTER TABLE jadwal_pengambilan ADD COLUMN kelurahan VARCHAR(100) NULL"))
            
        # Add petugas_id if not exists
        if 'petugas_id' not in columns:
            print("Adding column petugas_id...")
            db.execute(text("ALTER TABLE jadwal_pengambilan ADD COLUMN petugas_id INT UNSIGNED NULL"))
            db.execute(text("ALTER TABLE jadwal_pengambilan ADD CONSTRAINT fk_jadwal_petugas FOREIGN KEY (petugas_id) REFERENCES users(id) ON DELETE SET NULL"))
            
        db.commit()
        print("Migration completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
