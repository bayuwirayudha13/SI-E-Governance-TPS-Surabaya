import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Check chat_conversations
        try:
            conn.execute(text("SELECT 1 FROM chat_conversations LIMIT 1"))
            print("Table chat_conversations exists.")
        except Exception:
            print("Creating chat_conversations...")
            conn.execute(text("""
                CREATE TABLE chat_conversations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    warga_id INT UNSIGNED NOT NULL,
                    status ENUM('open', 'closed') DEFAULT 'open' NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (warga_id)
                ) ENGINE=InnoDB;
            >""").replace(">", ""))
            conn.commit()

        # Check chat_messages columns
        res = conn.execute(text("DESCRIBE chat_messages"))
        columns = [row[0] for row in res]
        print(f"Current chat_messages columns: {columns}")

        if "conversation_id" not in columns:
            print("Adding conversation_id to chat_messages...")
            conn.execute(text("ALTER TABLE chat_messages ADD COLUMN conversation_id INT UNSIGNED NOT NULL AFTER id, ADD INDEX (conversation_id)"))
            conn.commit()

        if "sender_role" not in columns:
            print("Adding sender_role to chat_messages...")
            conn.execute(text("ALTER TABLE chat_messages ADD COLUMN sender_role ENUM('warga', 'admin', 'superadmin') NOT NULL AFTER sender_id"))
            conn.commit()

        if "sender_name" not in columns:
            print("Adding sender_name to chat_messages...")
            conn.execute(text("ALTER TABLE chat_messages ADD COLUMN sender_name VARCHAR(100) NOT NULL AFTER sender_role"))
            conn.commit()

        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
