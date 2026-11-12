"""Comprehensive tests for Jadwal Pengambilan SI-PETASAN backend endpoints."""

import json
from fastapi.testclient import TestClient
from main import app
from core.database import SessionLocal
from models.jadwal import JadwalPengambilan
from models.users import User
from models.warga import Warga
from models.tps import TPS

client = TestClient(app)

def get_auth_token(email: str, password: str):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code != 200:
        raise Exception(f"Login failed for {email}: {response.status_code} {response.text}")
    data = response.json()
    return data["access_token"], data["user"]

def test_health():
    response = client.get("/health")
    print(f"[OK] GET /health: {response.status_code}")
    assert response.status_code == 200
    print(f"  Response: {response.json()}")

def test_superadmin_can_access_jadwal_admin():
    token, user = get_auth_token("superadmin@sipetasan.com", "superadmin123")
    response = client.get("/api/jadwal/admin", headers={"Authorization": f"Bearer {token}"})
    print(f"[OK] GET /api/jadwal/admin (superadmin): {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    print(f"  Found {len(data)} jadwal")
    for j in data:
        print(f"    - ID: {j['id']}, hari: {j['hari']}, kecamatan: {j['kecamatan']}, kelurahan: {j['kelurahan']}, petugas_id: {j['petugas_id']}")

def test_superadmin_crud_jadwal():
    token, user = get_auth_token("superadmin@sipetasan.com", "superadmin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create new jadwal
    new_jadwal = {
        "hari": "Senin",
        "waktu_mulai": "06:00:00",
        "waktu_selesai": "08:00:00",
        "area": "RT 01 02 Jl. Mawar",
        "petugas": "Petugas Pengangkut",
        "tipe": "Rutin",
        "tps_id": None,
        "kecamatan": "Bubutan",
        "kelurahan": "Tembok Dukuh",
        "petugas_id": 20
    }
    response = client.post("/api/jadwal/", json=new_jadwal, headers=headers)
    print(f"[OK] POST /api/jadwal/ (superadmin): {response.status_code}")
    if response.status_code == 201:
        created = response.json()
        print(f"  Created: {json.dumps(created, default=str)}")
        jadwal_id = created["id"]
        # Update
        update_data = {"waktu_mulai": "07:00:00", "waktu_selesai": "09:00:00", "area": "RT 01 02 Jl. Mawar"}
        response = client.put(f"/api/jadwal/{jadwal_id}", json=update_data, headers=headers)
        print(f"[OK] PUT /api/jadwal/{jadwal_id} (superadmin): {response.status_code}")
        assert response.status_code == 200
        # Delete
        response = client.delete(f"/api/jadwal/{jadwal_id}", headers=headers)
        print(f"[OK] DELETE /api/jadwal/{jadwal_id} (superadmin): {response.status_code}")
        assert response.status_code == 200
    else:
        print(f"  ERROR: {response.status_code} {response.text}")
        raise Exception(f"Superadmin create failed: {response.status_code}")

def test_superadmin_cannot_login_as_admin():
    # Admin role should not access admin jadwal
    response = client.post("/api/auth/login", json={"email": "admin@sipetasan.com", "password": "admin123"})
    if response.status_code != 200:
        print("[SKIP] No admin user found or login failed, skipping test")
        return
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/jadwal/admin", headers=headers)
    print(f"[OK] GET /api/jadwal/admin (admin): {response.status_code}")
    assert response.status_code == 403

def test_petugas_cannot_access_jadwal_admin():
    response = client.post("/api/auth/login", json={"email": "petugas@sipetasan.com", "password": "petugas123"})
    if response.status_code != 200:
        print("[SKIP] No petugas user found or login failed, skipping test")
        return
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/jadwal/admin", headers=headers)
    print(f"[OK] GET /api/jadwal/admin (petugas): {response.status_code}")
    assert response.status_code == 403

def test_petugas_get_jadwal_for_own_wilayah():
    response = client.post("/api/auth/login", json={"email": "petugas@sipetasan.com", "password": "petugas123"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/jadwal/", headers=headers)
    print(f"[OK] GET /api/jadwal/ (petugas): {response.status_code}")
    assert response.status_code == 200

def test_petugas_list_eligible():
    response = client.post("/api/auth/login", json={"email": "superadmin@sipetasan.com", "password": "superadmin123"})
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/jadwal/petugas", params={"kecamatan": "Bubutan", "kelurahan": "Tembok Dukuh"}, headers=headers)
    print(f"[OK] GET /api/jadwal/petugas (superadmin): {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for p in data:
        print(f"    - Petugas ID: {p['id']}, nama: {p['nama_lengkap']}, wilayah: {p['wilayah_kecamatan']}/{p['wilayah_kelurahan']}")

def test_warga_get_jadwal_own_wilayah():
    response = client.post("/api/auth/login", json={"email": "warga@sipetasan.com", "password": "warga123"})
    if response.status_code != 200:
        print("[SKIP] No warga user found, skipping test")
        return
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/jadwal/", headers=headers)
    print(f"[OK] GET /api/jadwal/ (warga): {response.status_code}")
    assert response.status_code == 200

def test_invalid_time_validation():
    token, user = get_auth_token("superadmin@sipetasan.com", "superadmin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # waktu_selesai < waktu_mulai should fail
    invalid_jadwal = {
        "hari": "Selasa",
        "waktu_mulai": "08:00:00",
        "waktu_selesai": "06:00:00",
        "area": "RT 01 02 Jl. Melati",
        "petugas": "Petugas Pengangkut",
        "tipe": "Rutin",
        "tps_id": None,
        "kecamatan": "Bubutan",
        "kelurahan": "Tembok Dukuh",
        "petugas_id": 20
    }
    response = client.post("/api/jadwal/", json=invalid_jadwal, headers=headers)
    print(f"[OK] POST /api/jadwal/ (invalid time): {response.status_code}")
    assert response.status_code == 400

def test_missing_wilayah():
    token, user = get_auth_token("superadmin@sipetasan.com", "superadmin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Missing kecamatan/kelurahan should fail
    missing_wilayah = {
        "hari": "Selasa",
        "waktu_mulai": "08:00:00",
        "waktu_selesai": "09:00:00",
        "area": "RT 01 02 Jl. Melati",
        "petugas": "Petugas Pengangkut",
        "tipe": "Rutin",
        "tps_id": None,
        "kecamatan": None,
        "kelurahan": None
    }
    response = client.post("/api/jadwal/", json=missing_wilayah, headers=headers)
    print(f"[OK] POST /api/jadwal/ (missing wilayah): {response.status_code}")
    assert response.status_code == 400

def test_wrong_petugas_wilayah():
    token, user = get_auth_token("superadmin@sipetasan.com", "superadmin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Using wrong petugas from different wilayah should fail
    wrong_petugas = {
        "hari": "Rabu",
        "waktu_mulai": "06:00:00",
        "waktu_selesai": "08:00:00",
        "area": "RT 01 02 Jl. Kenanga",
        "petugas": "",
        "tipe": "Rutin",
        "tps_id": None,
        "kecamatan": "Gubeng",  # Different kecamatan
        "kelurahan": "Gubeng",
        "petugas_id": 20  # This petugas is from Bubutan, not Gubeng
    }
    response = client.post("/api/jadwal/", json=wrong_petugas, headers=headers)
    print(f"[OK] POST /api/jadwal/ (wrong petugas wilayah): {response.status_code}")
    assert response.status_code == 400

def main():
    print("=== Testing Jadwal Pengambilan SI-PETASAN Backend ===\n")
    test_health()
    test_superadmin_can_access_jadwal_admin()
    test_superadmin_crud_jadwal()
    test_superadmin_cannot_login_as_admin()
    test_petugas_cannot_access_jadwal_admin()
    test_petugas_get_jadwal_for_own_wilayah()
    test_petugas_list_eligible()
    test_warga_get_jadwal_own_wilayah()
    test_invalid_time_validation()
    test_missing_wilayah()
    test_wrong_petugas_wilayah()
    print("\nAll tests passed!")

if __name__ == "__main__":
    main()