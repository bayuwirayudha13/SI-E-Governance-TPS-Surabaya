import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import engine
from sqlalchemy import text

def migrate():
    """Add first_admin_response_sent column to chat_conversations for template tracking"""
    with engine.connect() as conn:
        # Check if column exists
        res = conn.execute(text("DESCRIBE chat_conversations"))
        columns = [row[0] for row in res]
        print(f"Current chat_conversations columns: {columns}")
        
        if "first_admin_response_sent" not in columns:
            print("Adding first_admin_response_sent to chat_conversations...")
            conn.execute(text("""
                ALTER TABLE chat_conversations 
                ADD COLUMN first_admin_response_sent BOOLEAN DEFAULT FALSE 
                AFTER status
            """))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column first_admin_response_sent already exists.")
        
        # Check if assigned_petugas_id exists for routing
        if "assigned_petugas_id" not in columns:
            print("Adding assigned_petugas_id to chat_conversations...")
            conn.execute(text("""
                ALTER TABLE chat_conversations 
                ADD COLUMN assigned_petugas_id INT UNSIGNED NULL 
                AFTER first_admin_response_sent
            """))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column assigned_petugas_id already exists.")
        
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
