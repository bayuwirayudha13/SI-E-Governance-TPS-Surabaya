from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    # Disable checks
    c.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    
    # Change users.id to unsigned
    c.execute(text("ALTER TABLE users MODIFY id INT UNSIGNED AUTO_INCREMENT"))
    print("Modified users.id to unsigned")
    
    # Add FK constraints
    try:
        c.execute(text("ALTER TABLE laporan_warga ADD CONSTRAINT fk_laporan_user FOREIGN KEY (ditindaklanjuti_oleh) REFERENCES users(id)"))
        print("Added fk_laporan_user")
    except Exception as e:
        print(f"Error fk_laporan_user: {e}")
        
    try:
        c.execute(text("ALTER TABLE setoran_sampah ADD CONSTRAINT fk_setoran_user FOREIGN KEY (petugas_id) REFERENCES users(id)"))
        print("Added fk_setoran_user")
    except Exception as e:
        print(f"Error fk_setoran_user: {e}")
    
    c.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
    c.commit()
    print("\nDatabase schema fixed.")
