# PROJECT CONTEXT — SI-PETASAN SUROBOYO (Backend)

> Dokumen ini berisi seluruh konteks proyek backend, ditulis supaya bisa dibaca AI coding assistant (Claude Code, Cursor, Copilot, dll) sebagai referensi saat generate kode baru. Tempel/simpan file ini di root folder project (`CLAUDE.md` atau `PROJECT_CONTEXT.md`) supaya AI otomatis paham konteksnya tanpa perlu dijelaskan ulang tiap sesi.

## 1. Ringkasan Proyek

- **Nama**: SI-PETASAN SUROBOYO — Sistem Informasi Pemetaan Kapasitas TPS Surabaya
- **Konteks**: Tugas kuliah Workshop Pemrograman Framework, D3 Teknik Informatika PSDKU Lamongan, PENS
- **Tim**: 2 orang — Bayu Wirayudha (Backend), Muhammad Hanif Wijayanto (Frontend)
- **Fungsi utama**: Web GIS untuk memetakan sebaran & kapasitas TPS (Tempat Penampungan Sampah Sementara) Kota Surabaya, dengan fitur pelaporan warga, setor sampah plastik bereward, dan jadwal pengangkutan.

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy |
| Database | MySQL |
| Driver DB | PyMySQL |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Frontend | React JS (dikerjakan terpisah oleh anggota tim lain — TIDAK termasuk scope backend ini) |

## 3. Skema Database (Sumber Kebenaran)

Skema lengkap ada di `schema.sql` (sudah divalidasi jalan di MySQL). **Semua model SQLAlchemy WAJIB mengikuti skema ini persis** — jangan mengubah nama kolom/tipe data tanpa mengubah `schema.sql` terlebih dulu.

### Tabel & Relasi

```
admin (1) ---menindaklanjuti---< (N) laporan_warga
kelurahan (1) ---dilayani---< (N) tps_kelurahan >---melayani--- (1) tps
tps (1) ---punya---< (N) jadwal_pengangkutan
tps (1) ---menerima---< (N) laporan_warga
tps (1) ---menerima (opsional)---< (N) setoran_sampah
warga (1) ---melakukan---< (N) setoran_sampah
warga (1) ---membuat (opsional)---< (N) laporan_warga
petugas_pengangkut (1) ---memvalidasi (opsional)---< (N) setoran_sampah
```

### Detail Kolom per Tabel

**admin**
`id PK, username UK, password_hash, nama, role ENUM('super_admin','petugas'), created_at`

**kelurahan**
`id PK, nama, kecamatan, wilayah_kota`

**tps**
`id PK, nama, nama_lama, lokasi, kecamatan, wilayah_kota, latitude DECIMAL(10,7), longitude DECIMAL(10,7), jenis_tps, jumlah_container, daya_tampung_m3 DECIMAL(8,2) NULLABLE, status ENUM('Aktif','Tidak Aktif'), sumber_data, tanggal_update, catatan, created_at, updated_at`

**tps_kelurahan** (junction, many-to-many)
`tps_id PK+FK, kelurahan_id PK+FK`

**warga**
`id PK, nama, email UK, password_hash, no_hp, alamat, qr_code UK NOT NULL (permanen, generate saat registrasi), total_poin INT DEFAULT 0, created_at`

**petugas_pengangkut**
`id PK, nama, no_hp, username UK, password_hash, wilayah_tugas, status ENUM('Aktif','Nonaktif'), created_at`

**jadwal_pengangkutan**
`id PK, tps_id FK, hari SET(7 hari), jam TIME, keterangan`

**laporan_warga**
`id PK, tps_id FK, warga_id FK NULLABLE, jenis_laporan ENUM('Penuh','Rusak','Tidak Terawat','Lainnya'), deskripsi TEXT, foto_url, tanggal_lapor, status_tindak_lanjut ENUM('Belum Ditindaklanjuti','Diproses','Selesai'), ditindaklanjuti_oleh FK admin, catatan_admin`

**setoran_sampah** (mendukung 2 metode: antar sendiri / dijemput petugas)
`id PK, warga_id FK, tps_id FK NULLABLE, jenis_sampah, perkiraan_berat_kg DECIMAL NULLABLE (estimasi warga), berat_aktual_kg DECIMAL NULLABLE (hasil timbang petugas), poin_diperoleh INT NULLABLE (NULL sampai tervalidasi), foto_bukti_url, metode_setor ENUM('Antar ke TPS','Dijemput Petugas'), alamat_penjemputan, petugas_id FK NULLABLE, status ENUM('Menunggu Penjemputan','Sudah Divalidasi','Dibatalkan'), waktu_setor, waktu_validasi`

### Aturan Bisnis Penting (WAJIB dipatuhi saat generate logic)

1. `daya_tampung_m3` NULL berarti "data tidak tersedia" — jangan pernah di-treat sebagai 0 di kalkulasi.
2. `poin_diperoleh` pada `setoran_sampah` HANYA diisi setelah petugas validasi via scan `qr_code` **permanen milik warga** (endpoint `PATCH /setoran/{id}/validasi`), bukan QR per transaksi. Jangan menambah `warga.total_poin` sebelum status = `'Sudah Divalidasi'`.
3. `laporan_warga` boleh dibuat tanpa login (`warga_id` NULL) — jangan wajibkan autentikasi di endpoint `POST /laporan`.
4. `tps_id` di `setoran_sampah` nullable karena metode `'Dijemput Petugas'` tidak selalu terikat satu TPS.
5. `perkiraan_berat_kg` (estimasi warga saat request) dan `berat_aktual_kg` (hasil timbang petugas saat validasi) adalah kolom TERPISAH — jangan menimpa salah satu dengan yang lain; `poin_diperoleh` dihitung dari `berat_aktual_kg`, bukan dari estimasi warga.

## 4. Struktur Folder

```
backend/
├── main.py
├── requirements.txt
├── .env / .env.example
├── core/
│   ├── config.py       # baca .env
│   └── security.py     # hash password & JWT
├── database.py           # SQLAlchemy engine, SessionLocal, get_db()
├── models/                # 1 file = 1 tabel, class mewarisi Base dari database.py
├── schemas/               # Pydantic: bentuk request/response API
└── routers/               # endpoint, dikelompokkan per fitur
```

## 5. Konvensi Kode

- Nama file: `snake_case.py`
- Nama class model/schema: `PascalCase`
- Nama endpoint: `/kebab-atau-singular`, mis. `/tps`, `/tps/{id}`, `/setoran/qr/{kode}`
- Semua endpoint yang mengubah data admin (`POST/PUT/DELETE` di `/tps`, `/jadwal`, dll) WAJIB pakai dependency autentikasi JWT admin.
- Endpoint publik (`GET /tps`, `POST /laporan`) TIDAK boleh mewajibkan login.
- Response API tidak boleh mengembalikan field `password_hash` dalam bentuk apa pun.

## 6. Status Progres (update manual tiap selesai satu bagian)

- [x] `schema.sql` — selesai & tervalidasi jalan di MySQL
- [x] `database.py`, `core/config.py` — koneksi SQLAlchemy
- [x] `models/tps.py` — contoh model pertama
- [ ] `models/` — 7 tabel lainnya (kelurahan, tps_kelurahan, warga, admin, petugas_pengangkut, jadwal_pengangkutan, laporan_warga, setoran_sampah)
- [ ] `schemas/` — belum dibuat
- [ ] `routers/tps.py` — GET /tps, GET /tps/{id}, GET /kelurahan
- [ ] `routers/auth.py` — login admin/warga/petugas (JWT)
- [ ] `routers/laporan.py` — POST /laporan
- [ ] `routers/setoran.py` — alur setor + validasi QR
- [ ] `routers/admin.py` — CRUD TPS, jadwal, petugas

## 7. Instruksi untuk AI

Kalau diminta membuat model/schema/router baru:
- Ikuti skema di Bagian 3 **persis** — jangan menambah/mengurangi kolom tanpa konfirmasi.
- Ikuti struktur folder & konvensi di Bagian 4–5.
- Terapkan aturan bisnis di Bagian 3 pada logic endpoint (bukan cuma di komentar).
- Kalau ragu satu keputusan desain (misal validasi tambahan), tanyakan dulu daripada menebak.
