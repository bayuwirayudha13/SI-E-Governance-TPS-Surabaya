"""
Migration script untuk menambahkan tabel refresh_tokens dan token_revocations
Run: python migrate_refresh_token.py
"""

from sqlalchemy import create_engine, text
from core.database import engine, Base
from models.token import RefreshToken, TokenRevocation
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    print("Creating refresh_tokens and token_revocations tables...")
    
    try:
        # Create tables
        Base.metadata.create_all(bind=engine, tables=[
            RefreshToken.__table__,
            TokenRevocation.__table__
        ])
        
        print("[SUCCESS] Tables created successfully")
        
        # Verify tables
        with engine.connect() as conn:
            result = conn.execute(text("SHOW TABLES LIKE 'refresh_tokens'"))
            if result.fetchone():
                print("[SUCCESS] refresh_tokens table exists")
            
            result = conn.execute(text("SHOW TABLES LIKE 'token_revocations'"))
            if result.fetchone():
                print("[SUCCESS] token_revocations table exists")
        
        print("\nMigration completed successfully!")
        print("\nNote: Existing users akan perlu login ulang untuk mendapatkan refresh token.")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate()
