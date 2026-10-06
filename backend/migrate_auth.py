from core.database import SessionLocal, engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        conn.execute(text("DROP TABLE IF EXISTS admin"))
        conn.execute(text("DROP TABLE IF EXISTS petugas_pengangkut"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        conn.commit()
        print("Tables dropped with FK bypass")

if __name__ == "__main__":
    migrate()
