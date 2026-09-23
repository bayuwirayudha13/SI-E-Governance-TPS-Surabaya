# Daftar Endpoint API — SIPK-TPS Surabaya
Base URL: `/api/v1`
Autentikasi: JWT Bearer Token
Akses publik tidak memerlukan token

---

## 1. Auth
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| POST | `/auth/login` | Login, mengembalikan access + refresh token | Publik |
| POST | `/auth/refresh` | Refresh access token | Terautentikasi |
| GET | `/auth/me` | Data profil pengguna yang sedang login | Terautentikasi |
| POST | `/auth/logout` | Logout, invalidasi token | Terautentikasi |

---

## 2. TPS
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/tps` | Daftar semua TPS (filter: kecamatan, kelurahan, jenis, status) | Publik |
| GET | `/tps/map` | Data TPS format GeoJSON untuk peta | Publik |
| GET | `/tps/{id}` | Detail satu TPS beserta kelurahan yang dilayani | Publik |
| POST | `/tps` | Tambah TPS baru beserta relasi kelurahan | Admin |
| PUT | `/tps/{id}` | Update data TPS & relasi kelurahan | Admin |
| DELETE | `/tps/{id}` | Nonaktifkan / hapus TPS | Admin |
| PATCH | `/tps/{id}/kapasitas` | Update kapasitas terkini TPS (dengan validasi geofencing) | Petugas, Admin |
| GET | `/tps/{id}/riwayat` | Riwayat update kapasitas satu TPS | Publik |

---

## 3. Wilayah (Kecamatan & Kelurahan)
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/kecamatan` | Daftar semua kecamatan | Publik |
| GET | `/kecamatan/{id}` | Detail satu kecamatan | Publik |
| POST | `/kecamatan` | Tambah kecamatan | Admin |
| PUT | `/kecamatan/{id}` | Update kecamatan | Admin |
| DELETE | `/kecamatan/{id}` | Hapus kecamatan | Admin |
| GET | `/kelurahan` | Daftar semua kelurahan (filter: kecamatan_id) | Publik |
| GET | `/kelurahan/{id}` | Detail satu kelurahan | Publik |
| GET | `/kelurahan/{id}/tps` | Daftar TPS yang melayani kelurahan ini + jumlah TPS otomatis | Publik |
| POST | `/kelurahan` | Tambah kelurahan | Admin |
| PUT | `/kelurahan/{id}` | Update kelurahan | Admin |
| DELETE | `/kelurahan/{id}` | Hapus kelurahan | Admin |

---

## 4. Jadwal Truk Sampah
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/jadwal` | Daftar jadwal truk (filter: kelurahan_id, kecamatan_id) | Publik |
| GET | `/jadwal/{id}` | Detail satu jadwal | Publik |
| GET | `/jadwal/wilayah/{kelurahan_id}` | Jadwal truk untuk kelurahan tertentu | Publik |
| POST | `/jadwal` | Buat jadwal pengangkutan baru | Admin |
| PUT | `/jadwal/{id}` | Update jadwal | Admin |
| DELETE | `/jadwal/{id}` | Hapus jadwal | Admin |

---

## 5. Pengangkutan Sampah (Petugas)
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| POST | `/pengangkutan/scan` | Scan QR code rumah warga, catat waktu & lokasi petugas | Petugas |
| POST | `/pengangkutan/{scan_id}/foto` | Upload foto sampah rumah yang sudah di-scan | Petugas |
| POST | `/pengangkutan/{scan_id}/timbang` | Input berat sampah plastik hasil timbangan (kg) | Petugas |
| GET | `/pengangkutan/riwayat` | Riwayat pengangkutan yang dilakukan petugas login | Petugas |
| GET | `/pengangkutan/riwayat/{tanggal}` | Riwayat pengangkutan petugas pada tanggal tertentu | Petugas |
| GET | `/pengangkutan/rekap` | Rekap total pengangkutan & berat sampah per periode | Admin |

---

## 6. QR Code Rumah Warga
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/rumah` | Daftar rumah warga (filter: kelurahan_id) | Admin |
| GET | `/rumah/{id}` | Detail satu rumah + riwayat pengangkutan | Admin, Petugas |
| POST | `/rumah` | Tambah data rumah warga baru | Admin |
| PUT | `/rumah/{id}` | Update data rumah warga | Admin |
| DELETE | `/rumah/{id}` | Hapus data rumah | Admin |
| GET | `/rumah/{id}/qrcode` | Generate / ambil QR code rumah dalam format PNG | Admin |

---

## 7. Laporan Warga
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| POST | `/laporan` | Kirim laporan kondisi TPS (tanpa login) | Publik |
| GET | `/laporan` | Daftar laporan masuk (filter: status, tps_id) | Admin, Petugas |
| GET | `/laporan/{id}` | Detail satu laporan | Admin, Petugas |
| PUT | `/laporan/{id}/status` | Update status laporan (baru → diproses → selesai) | Admin |

---

## 8. Notifikasi
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/notifikasi` | Daftar notifikasi milik pengguna yang login | Terautentikasi |
| PATCH | `/notifikasi/{id}/baca` | Tandai notifikasi sudah dibaca | Terautentikasi |
| DELETE | `/notifikasi/{id}` | Hapus notifikasi | Terautentikasi |

---

## 9. Alert / Early Warning
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/alerts` | Daftar TPS berstatus merah (≥80%) yang butuh penanganan darurat | Admin, Driver |
| GET | `/alerts/rute` | Daftar TPS prioritas terurut berdasarkan urgensi untuk driver | Driver |

---

## 10. Statistik & Dashboard
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/statistik/wilayah` | Total daya tampung TPS aktif per kecamatan/kelurahan | Publik, Admin |
| GET | `/statistik/heatmap` | Data heatmap kepadatan akumulasi sampah kota | Admin |
| GET | `/statistik/kapasitas` | Ringkasan kapasitas seluruh TPS (grafik tren harian/mingguan) | Admin |
| GET | `/statistik/pengangkutan` | Rekap data pengangkutan & berat sampah plastik per periode | Admin |
| GET | `/statistik/export` | Export laporan ke PDF / XLSX | Admin |

---

## 11. Manajemen Pengguna
| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| GET | `/users` | Daftar semua pengguna (filter: role) | Admin |
| GET | `/users/{id}` | Detail satu pengguna | Admin |
| POST | `/users` | Buat akun petugas / driver baru | Admin |
| PUT | `/users/{id}` | Update data pengguna | Admin |
| DELETE | `/users/{id}` | Nonaktifkan akun | Admin |

---

## Ringkasan Akses per Role

| Modul | Publik | Petugas | Driver | Admin |
|---|:---:|:---:|:---:|:---:|
| Auth | ✓ (login) | ✓ | ✓ | ✓ |
| TPS | ✓ (read) | ✓ (update kapasitas) | ✓ (read) | ✓ (CRUD) |
| Wilayah | ✓ (read) | — | — | ✓ (CRUD) |
| Jadwal truk | ✓ (read) | — | ✓ (read) | ✓ (CRUD) |
| Pengangkutan | — | ✓ | — | ✓ (rekap) |
| QR Code Rumah | — | ✓ (read) | — | ✓ (CRUD) |
| Laporan warga | ✓ (kirim) | ✓ (read) | — | ✓ (kelola) |
| Notifikasi | — | ✓ | ✓ | ✓ |
| Alert | — | — | ✓ | ✓ |
| Statistik | ✓ (wilayah) | — | — | ✓ (semua) |
| Manajemen user | — | — | — | ✓ |

