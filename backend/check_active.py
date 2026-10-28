from core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT id, email, is_active FROM users WHERE email = 'petugas@sipetasan.com'"
    ))
    for row in result:
        print(f"ID: {row[0]}, Email: {row[1]}, is_active: {row[2]}")
