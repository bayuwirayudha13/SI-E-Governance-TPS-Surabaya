#!/usr/bin/env python3
"""
Safe migration to extend setoran_sampah schema with verification columns.
Does NOT drop existing data.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Check if columns exist before adding
        result = conn.execute(text("SHOW COLUMNS FROM setoran_sampah WHERE Field IN ('berat_aktual_kg', 'jenis_sampah_terverifikasi', 'kondisi_sampah', 'hasil_pemeriksaan', 'catatan_petugas', 'waktu_pemeriksaan')"))
        existing = {row[0] for row in result}
        
        migrations = []
        
        if 'berat_aktual_kg' not in existing:
            migrations.append("ALTER TABLE setoran_sampah ADD COLUMN berat_aktual_kg DECIMAL(6, 2) NULL DEFAULT NULL AFTER perkiraan_berat_kg")
        
        if 'jenis_sampah_terverifikasi' not in existing:
            migrations.append("ALTER TABLE setoran_sampah ADD COLUMN jenis_sampah_terverifikasi VARCHAR(50) NULL DEFAULT NULL AFTER berat_aktual_kg")
        
        if 'kondisi_sampah' not in existing:
            migrations.append("ALTER TABLE setoran_sampah ADD COLUMN kondisi_sampah VARCHAR(100) NULL DEFAULT NULL AFTER jenis_sampah_terverifikasi")
        
        if 'hasil_pemeriksaan' not in existing:
            migrations.append("ALTER TABLE setoran_sampah ADD COLUMN hasil_pemeriksaan VARCHAR(20) NULL DEFAULT NULL AFTER kondisi_sampah")
        
        if 'catatan_petugas' not in existing:
            migrations.append("ALTER TABLE setoran_sampah ADD COLUMN catatan_petugas TEXT NULL DEFAULT NULL AFTER hasil_pemeriksaan")
        
        if 'waktu_pemeriksaan' not in existing:
            migrations.append("ALTER TABLE setoran_sampah ADD COLUMN waktu_pemeriksaan TIMESTAMP NULL DEFAULT NULL AFTER waktu_setor")
        
        # Also extend status enum if needed
        try:
            conn.execute(text("ALTER TABLE setoran_sampah MODIFY COLUMN status ENUM('Menunggu Penjemputan', 'Sedang Diproses', 'Sudah Divalidasi', 'Ditolak', 'Dibatalkan') DEFAULT 'Menunggu Penjemputan'"))
            print("[OK] Status enum extended")
        except Exception as e:
            print(f"[WARN] Status enum update: {e}")
        
        for sql in migrations:
            try:
                conn.execute(text(sql))
                print(f"[OK] {sql[:60]}...")
            except Exception as e:
                print(f"[ERROR] {sql[:60]}... → {e}")
        
        conn.commit()
        print("\n[OK] Migration complete")

if __name__ == '__main__':
    migrate()
