from fastapi.testclient import TestClient
from main import app
client = TestClient(app)

print("=== WARGA WILAYAH FILTER TEST ===")

# Login superadmin
r = client.post("/api/auth/login", json={"email":"superadmin@sipetasan.com","password":"superadmin123"})
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}"}

# Create jadwal for Bubutan/Tembok Dukuh
r = client.post("/api/jadwal/", json={
    "hari":"Senin","waktu_mulai":"06:00:00","waktu_selesai":"08:00:00",
    "area":"RT 01-03 Jl. Mawar","tipe":"Rutin","kecamatan":"Bubutan","kelurahan":"Tembok Dukuh","petugas_id":20
}, headers=h)
created = r.json()
jadwal_id = created["id"]
print(f"[OK] Created jadwal ID={jadwal_id} for Bubutan/Tembok Dukuh")

# Login warga Bubutan
r = client.post("/api/auth/login", json={"email":"warga@sipetasan.com","password":"warga123"})
warga_token = r.json()["access_token"]
warga_h = {"Authorization": f"Bearer {warga_token}"}

# Warga should see this jadwal
r = client.get("/api/jadwal/", headers=warga_h)
data = r.json()
print(f"[TEST] Warga Bubutan sees {len(data)} jadwal")
for j in data:
    print(f"  - ID={j['id']} hari={j['hari']} kec={j.get('kecamatan')} kel={j.get('kelurahan')}")
assert len(data) >= 1, "Warga harusnya lihat jadwal wilayahnya"
assert any(j["id"] == jadwal_id for j in data), "Warga harus lihat jadwal yang baru dibuat"
print("[OK] Warga melihat jadwal wilayahnya sendiri")

# Login warga Benowo (beda wilayah)
r = client.post("/api/auth/login", json={"email":"bayuwirayudha99999@gmail.com","password":"babab"})
if r.status_code == 200:
    other_token = r.json()["access_token"]
    other_h = {"Authorization": f"Bearer {other_token}"}
    r2 = client.get("/api/jadwal/", headers=other_h)
    data2 = r2.json()
    print(f"[TEST] Warga Benowo/Romokalisari sees {len(data2)} jadwal")
    for j in data2:
        print(f"  - ID={j['id']} hari={j['hari']} kec={j.get('kecamatan')} kel={j.get('kelurahan')}")
    assert len(data2) == 0, "Warga Benowo TIDAK boleh lihat jadwal Bubutan"
    print("[OK] Warga beda wilayah tidak bisa lihat jadwal wilayah lain")
else:
    print("[SKIP] Warga Benowo login gagal")

# Cleanup
client.delete(f"/api/jadwal/{jadwal_id}", headers=h)
print(f"[OK] Cleaned up test jadwal ID={jadwal_id}")

# Verify old 7 jadwal still there
r = client.get("/api/jadwal/admin", headers=h)
old_count = len(r.json())
print(f"[OK] Total jadwal admin: {old_count} (harus 7)")
assert old_count == 7, "Jadwal lama harus tetap ada"

print("\n=== SEMUA WILAYAH FILTER TEST BERHASIL ===")