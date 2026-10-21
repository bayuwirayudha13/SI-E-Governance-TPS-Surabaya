"""
Migration: Add conversation_type column to track bicara_langsung vs keluhan
"""
from sqlalchemy import text
from core.database import SessionLocal

def add_conversation_type_column():
    """Add conversation_type column to chat_conversations"""
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("SHOW COLUMNS FROM chat_conversations LIKE 'conversation_type'"))
        if not result.fetchone():
            print("Adding conversation_type to chat_conversations...")
            db.execute(text("""
                ALTER TABLE chat_conversations
                ADD COLUMN conversation_type VARCHAR(50) DEFAULT 'general'
                AFTER assigned_petugas_id
            """))
            db.commit()
            print("OK: Column conversation_type added successfully")
        else:
            print("Column conversation_type already exists.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_conversation_type_column()
