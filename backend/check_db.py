from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    tables = c.execute(text('SHOW TABLES')).fetchall()
    print("Tables:", tables)
    
    create_stmt = c.execute(text('SHOW CREATE TABLE laporan_warga')).fetchone()
    print("\nLaporan_warga:", create_stmt[1][:1500])
