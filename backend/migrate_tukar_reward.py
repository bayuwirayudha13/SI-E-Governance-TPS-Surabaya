#!/usr/bin/env python3
"""
Migration script untuk membuat table tukar_reward_history
"""

from sqlalchemy import text
from core.database import engine

def migrate():
    sql = """
    CREATE TABLE IF NOT EXISTS tukar_reward_history (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        warga_id INT UNSIGNED NOT NULL,
        poin_digunakan INT UNSIGNED NOT NULL,
        nominal_rupiah DECIMAL(12, 2) NOT NULL,
        reward_title VARCHAR(255) NOT NULL,
        ewallet_type VARCHAR(50) NOT NULL,
        nomor_ewallet VARCHAR(20) NOT NULL,
        atas_nama VARCHAR(100) NOT NULL,
        status ENUM('Diproses', 'Selesai', 'Gagal', 'Pending') DEFAULT 'Diproses' NOT NULL,
        catatan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        
        FOREIGN KEY (warga_id) REFERENCES warga(id) ON DELETE CASCADE,
        INDEX idx_warga_id (warga_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        with engine.connect() as connection:
            connection.execute(text(sql))
            connection.commit()
            print("[OK] Table tukar_reward_history berhasil dibuat!")
    except Exception as e:
        print(f"[ERROR] Error: {e}")

if __name__ == "__main__":
    migrate()
