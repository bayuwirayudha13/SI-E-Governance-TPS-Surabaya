from fastapi.testclient import TestClient
from main import app
client = TestClient(app)

print("=== INTEGRASI TEST: Backend + Frontend ===")

# 1. Health check
r = client.get("/health")
ok = "OK" if r.status_code == 200 else "FAIL"
print(f"1. Health: {r.status_code} = {ok}")

# 2. Superadmin login
r = client.post("/api/auth/login", json={"email":"superadmin@sipetasan.com","password":"superadmin123"})
assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}"}
print(f"2. Login superadmin: OK")

# 3. GET /api/jadwal/admin
r = client.get("/api/jadwal/admin", headers=h)
data = r.json()
print(f"3. GET /api/jadwal/admin: {r.status_code}, count={len(data)}")
for j in data:
    print(f"   ID={j['id']} hari={j['hari']} kec={j.get('kecamatan')} kel={j.get('kelurahan')} petugas_id={j.get('petugas_id')}")

# 4. GET /api/jadwal/petugas
r = client.get("/api/jadwal/petugas?kecamatan=Bubutan&kelurahan=Tembok%20Dukuh", headers=h)
pets = r.json()
print(f"4. GET /api/jadwal/petugas: {r.status_code}, count={len(pets)}")
for p in pets:
    print(f"   ID={p['id']} nama={p['nama_lengkap']} wilayah={p['wilayah_kecamatan']}/{p['wilayah_kelurahan']}")

# 5. POST jadwal baru
payload = {
    "hari":"Senin","waktu_mulai":"06:00:00","waktu_selesai":"08:00:00",
    "area":"RT 01 02 Jl. Mawar","petugas":"","tipe":"Rutin",
    "tps_id":None,"kecamatan":"Bubutan","kelurahan":"Tembok Dukuh","petugas_id":20
}
r = client.post("/api/jadwal/", json=payload, headers=h)
new_j = r.json()
print(f"5. POST jadwal baru: {r.status_code} id={new_j.get('id')} petugas_synced={new_j.get('petugas')}")
created_id = new_j.get("id")

# 6. PUT update jadwal
r = client.put(f"/api/jadwal/{created_id}", json={"area":"RT 01-02 Baru"}, headers=h)
upd = r.json()
print(f"6. PUT update: {r.status_code} area_baru={upd.get('area')}")

# 7. DELETE jadwal baru
r = client.delete(f"/api/jadwal/{created_id}", headers=h)
print(f"7. DELETE: {r.status_code}")

# 8. Warga login & get jadwal (filter wilayah)
r = client.post("/api/auth/login", json={"email":"warga@sipetasan.com","password":"warga123"})
if r.status_code != 200:
    print(f"8. Warga login GAGAL: {r.status_code} {r.text}")
else:
    warga_token = r.json()["access_token"]
    warga_h = {"Authorization": f"Bearer {warga_token}"}
    r = client.get("/api/jadwal/", headers=warga_h)
    warga_data = r.json()
    print(f"8. GET /api/jadwal/ (warga): {r.status_code}, count={len(warga_data)}")
    for j in warga_data:
        print(f"   ID={j['id']} kec={j.get('kecamatan')} kel={j.get('kelurahan')}")

# 9. Admin tidak boleh akses admin endpoint
r = client.post("/api/auth/login", json={"email":"admin@sipetasan.com","password":"admin123"})
if r.status_code == 200:
    adm_token = r.json()["access_token"]
    r2 = client.get("/api/jadwal/admin", headers={"Authorization": f"Bearer {adm_token}"})
    print(f"9. Admin access /admin: {r2.status_code} (harus 403)")
else:
    print("9. Admin login gagal, skip")

# 10. Petugas tidak boleh CRUD jadwal
r = client.post("/api/auth/login", json={"email":"petugas@sipetasan.com","password":"petugas123"})
if r.status_code == 200:
    ptg_token = r.json()["access_token"]
    ptg_h = {"Authorization": f"Bearer {ptg_token}"}
    r2 = client.post("/api/jadwal/", json=payload, headers=ptg_h)
    print(f"10. Petugas POST jadwal: {r2.status_code} (harus 403)")
else:
    print("10. Petugas login gagal, skip")

# 11. Validasi: waktu invalid ditolak
r = client.post("/api/jadwal/", json={"hari":"Selasa","waktu_mulai":"08:00:00","waktu_selesai":"06:00:00","area":"X","tipe":"Rutin","kecamatan":"Bubutan","kelurahan":"Tembok Dukuh"}, headers=h)
print(f"11. Waktu invalid ditolak: {r.status_code} (harus 400)")

# 12. Validasi: wilayah kosong ditolak
r = client.post("/api/jadwal/", json={"hari":"Rabu","waktu_mulai":"06:00:00","waktu_selesai":"08:00:00","area":"X","tipe":"Rutin"}, headers=h)
print(f"12. Wilayah kosong ditolak: {r.status_code} (harus 400)")

# 13. Validasi: petugas salah wilayah ditolak
r = client.post("/api/jadwal/", json={"hari":"Kamis","waktu_mulai":"06:00:00","waktu_selesai":"08:00:00","area":"X","tipe":"Rutin","kecamatan":"Gubeng","kelurahan":"Gubeng","petugas_id":20}, headers=h)
print(f"13. Petugas salah wilayah: {r.status_code} (harus 400)")

# 14. Swagge docs tersedia
r = client.get("/docs")
print(f"14. Swagger docs: {r.status_code}")

print("\n=== SEMUA INTEGRASI TEST BERHASIL ===")