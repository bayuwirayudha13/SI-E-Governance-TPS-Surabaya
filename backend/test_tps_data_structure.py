import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.tps import TPS
from models.tps_kelurahan import TPSKelurahan
from models.wilayah import Kelurahan

db = SessionLocal()

# Test 1: Get all TPS data
print("=" * 60)
print("TEST 1: Get all TPS data")
print("=" * 60)
tps_list = db.query(TPS).all()
print(f"Total TPS records: {len(tps_list)}")

for t in tps_list:
    print(f"\nID: {t.id}, Nama: {t.nama}")
    print(f"  Kecamatan: {t.kecamatan}")
    print(f"  Wilayah Kota: {t.wilayah_kota}")
    print(f"  Latitude: {t.latitude}, Longitude: {t.longitude}")
    print(f"  Status: {t.status}")
    print(f"  Daya Tampung: {t.daya_tampung_m3}")
    print(f"  Lokasi: {t.lokasi}")
    
    # Check kelurahans
    kelurahans = db.query(TPSKelurahan).filter(TPSKelurahan.tps_id == t.id).all()
    print(f"  Jumlah kelurahan: {len(kelurahans)}")
    for k in kelurahans:
        kelurahan_obj = db.query(Kelurahan).filter(Kelurahan.id == k.kelurahan_id).first()
        print(f"    - {kelurahan_obj.nama if kelurahan_obj else 'N/A'}")

db.close()