from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    # Drop old FK constraints
    try:
        c.execute(text("ALTER TABLE laporan_warga DROP FOREIGN KEY laporan_warga_ibfk_3"))
        print("Dropped laporan_warga_ibfk_3")
    except:
        print("laporan_warga_ibfk_3 not found or already dropped")
    
    try:
        c.execute(text("ALTER TABLE setoran_sampah DROP FOREIGN KEY setoran_sampah_ibfk_2"))
        print("Dropped setoran_sampah_ibfk_2")
    except:
        print("setoran_sampah_ibfk_2 not found or already dropped")
    
    # Update FK columns to reference users table
    c.execute(text("ALTER TABLE laporan_warga ADD CONSTRAINT fk_laporan_user FOREIGN KEY (ditindaklanjuti_oleh) REFERENCES users(id)"))
    print("Added fk_laporan_user")
    
    c.execute(text("ALTER TABLE setoran_sampah ADD CONSTRAINT fk_setoran_user FOREIGN KEY (petugas_id) REFERENCES users(id)"))
    print("Added fk_setoran_user")
    
    c.commit()
    print("\nFK constraints updated to users table")
