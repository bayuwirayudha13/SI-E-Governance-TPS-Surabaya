# Manual Testing Guide - Jadwal Pengambilan SI-PETASAN

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | superadmin@sipetasan.com | superadmin123 |
| Admin | admin@sipetasan.com | (same as before) |
| Petugas | petugas@sipetasan.com | petugas123 |
| Petugas TPS | petugas.tps@sipetasan.com | petugastps123 |
| Warga | warga@sipetasan.com | warga123 |

## Step 1: Login & Get Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@sipetasan.com", "password": "superadmin123"}'
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "token_type": "bearer",
  "user": { ... }
}
```

Simpan `access_token` untuk digunakan di semua request berikutnya.

## Step 2: Test Superadmin Endpoints

### 2a. GET /api/jadwal/admin - Lihat semua jadwal
```bash
curl -X GET http://localhost:8000/api/jadwal/admin \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Expected:** Array of semua jadwal (termasuk yang lama dengan kecamatan/kelurahan NULL)

### 2b. GET /api/jadwal/petugas - Daftar petugas sesuai wilayah
```bash
curl -X GET "http://localhost:8000/api/jadwal/petugas?kecamatan=Bubutan&kelurahan=Tembok%20Dukuh" \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Expected:** 
```json
[
  {"id": 20, "nama_lengkap": "petugas pengangkut", "email": "petugas@sipetasan.com", "wilayah_kecamatan": "Bubutan", "wilayah_kelurahan": "Tembok Dukuh"},
  {"id": 22, "nama_lengkap": "petugas pengangkut", "email": "petugas@sipetasan.com", "wilayah_kecamatan": "Bubutan", "wilayah_kelurahan": "Tembok Dukuh"}
]
```

### 2c. POST /api/jadwal/ - Buat jadwal baru
```bash
curl -X POST http://localhost:8000/api/jadwal/ \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "hari": "Senin",
    "waktu_mulai": "06:00:00",
    "waktu_selesai": "08:00:00",
    "area": "RT 01 02 Jl. Mawar",
    "petugas": "Petugas Pengangkut",
    "tipe": "Rutin",
    "tps_id": null,
    "kecamatan": "Bubutan",
    "kelurahan": "Tembok Dukuh",
    "petugas_id": 20
  }'
```

**Expected:** Response 201 dengan data jadwal baru

### 2d. PUT /api/jadwal/{id} - Update jadwal
```bash
curl -X PUT http://localhost:8000/api/jadwal/[JADWAL_ID] \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "waktu_mulai": "07:00:00",
    "waktu_selesai": "09:00:00"
  }'
```

**Expected:** Response 200 dengan data jadwal yang diperbarui

### 2e. DELETE /api/jadwal/{id} - Hapus jadwal
```bash
curl -X DELETE http://localhost:8000/api/jadwal/[JADWAL_ID] \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Expected:** Response 200 dengan message "Jadwal berhasil dihapus"

## Step 3: Test Warga Endpoint

### 3a. Login sebagai warga
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "warga@sipetasan.com", "password": "warga123"}'
```

Simpan token warga.

### 3b. GET /api/jadwal/ - Jadwal warga sendiri
```bash
curl -X GET http://localhost:8000/api/jadwal/ \
  -H "Authorization: Bearer [TOKEN_WARGA]"
```

**Expected:** Hanya jadwal dengan kecamatan="Bubutan" dan kelurahan="Tembok Dukuh"
Jadwal lama dengan kecamatan/kelurahan NULL tidak muncul.

## Step 4: Test Validasi Backend

### 4a. Waktu invalid (waktu_selesai < waktu_mulai)
```bash
curl -X POST http://localhost:8000/api/jadwal/ \
  -H "Authorization: Bearer [TOKEN_SUPERADMIN]" \
  -H "Content-Type: application/json" \
  -d '{
    "hari": "Selasa",
    "waktu_mulai": "08:00:00",
    "waktu_selesai": "06:00:00",
    "area": "Test",
    "petugas": "",
    "tipe": "Rutin",
    "kecamatan": "Bubutan",
    "kelurahan": "Tembok Dukuh"
  }'
```

**Expected:** 400 BadRequest "Waktu selesai harus lebih besar dari waktu mulai"

### 4b. Wilayah tidak lengkap
```bash
curl -X POST http://localhost:8000/api/jadwal/ \
  -H "Authorization: Bearer [TOKEN_SUPERADMIN]" \
  -H "Content-Type: application/json" \
  -d '{
    "hari": "Rabu",
    "waktu_mulai": "06:00:00",
    "waktu_selesai": "08:00:00",
    "area": "Test",
    "petugas": "",
    "tipe": "Rutin"
  }'
```

**Expected:** 400 BadRequest "Kecamatan dan kelurahan wajib diisi"

### 4c. Petugas salah wilayah
```bash
curl -X POST http://localhost:8000/api/jadwal/ \
  -H "Authorization: Bearer [TOKEN_SUPERADMIN]" \
  -H "Content-Type: application/json" \
  -d '{
    "hari": "Kamis",
    "waktu_mulai": "06:00:00",
    "waktu_selesai": "08:00:00",
    "area": "Test",
    "tipe": "Rutin",
    "kecamatan": "Gubeng",
    "kelurahan": "Gubeng",
    "petugas_id": 20
  }'
```

**Expected:** 400 BadRequest "Wilayah petugas (Bubutan/Tembok Dukuh) tidak sesuai dengan wilayah jadwal (Gubeng/Gubeng)"

## Step 5: Test Akses Unauthorized

### 5a. Admin coba akses endpoint superadmin
```bash
# Login admin dulu
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sipetasan.com", "password": "admin123"}'

# Then use token admin untuk access admin endpoint
curl -X GET http://localhost:8000/api/jadwal/admin \
  -H "Authorization: Bearer [TOKEN_ADMIN]"
```

**Expected:** 403 Forbidden "Akses khusus Super Admin"

### 5b. Petugas coba akses endpoint superadmin
Sama seperti di atas tapi pakai token petugas.

**Expected:** 403 Forbidden

## Step 6: Verifikasi Data Lama

### Cek jadwal lama masih ada
```bash
curl -X GET http://localhost:8000/api/jadwal/admin \
  -H "Authorization: Bearer [TOKEN_SUPERADMIN]"
```

**Expected:** 7 jadwal lama tetap ada (ID 1-7), kecamatan dan kelurahan tetap NULL.

## Checklist Testing

- [ ] Semua login berhasil
- [ ] Superadmin dapat GET semua jadwal
- [ ] Superadmin dapat membuat jadwal baru
- [ ] Superadmin dapat update jadwal
- [ ] Superadmin dapat hapus jadwal
- [ ] Admin tidak bisa akses endpoint superadmin (403)
- [ ] Petugas tidak bisa akses endpoint superadmin (403)
- [ ] Warga hanya lihat jadwal wilayah mereka
- [ ] Jadwal lama dengan wilayah NULL tidak muncul untuk warga
- [ ] Validasi waktu ditolak (400)
- [ ] Validasi wilayah kosong ditolak (400)
- [ ] Validasi petugas salah wilayah ditolak (400)
- [ ] Endpoint /petugas mengembalikan daftar petugas sesuai wilayah

## Notes

1. Token JWT berlaku 30 menit (ACCESS_TOKEN_EXPIRE_MINUTES)
2. Untuk refresh token: `/api/auth/refresh`
3. Jika ingin reset database test, backup dulu data production
4. Swagger documentation tersedia di: `http://localhost:8000/docs` atau `http://localhost:8000/redoc`