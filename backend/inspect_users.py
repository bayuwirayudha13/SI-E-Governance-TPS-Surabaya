from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    create_stmt = c.execute(text('SHOW CREATE TABLE users')).fetchone()
    print("Users table:", create_stmt[1])
    sample_users = c.execute(text('SELECT * FROM users LIMIT 10')).fetchall()
    print("\nSample users:", sample_users)
