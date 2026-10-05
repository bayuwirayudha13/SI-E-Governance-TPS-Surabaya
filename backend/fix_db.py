from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    # Drop FK yang refer ke admin
    c.execute(text("ALTER TABLE laporan_warga DROP FOREIGN KEY laporan_warga_ibfk_3"))
    c.commit()
    print("FK laporan_warga_ibfk_3 dropped")
