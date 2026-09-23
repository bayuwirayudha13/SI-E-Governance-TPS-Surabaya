# Laporan Progress SIPK-TPS (Keseluruhan)

Berikut adalah laporan progress lengkap (dari awal pengerjaan hingga saat ini) yang siap kamu *copy-paste* ke dalam slide presentasi PPT.

---

## Slide 1: Judul & Status Project
**Laporan Progress: Pengembangan Backend SIPK-TPS Surabaya**
*(Sistem Informasi Pengelolaan Kebersihan & TPS)*
- **Fase Saat Ini**: Backend API Selesai & Kontrak Data Final.
- **Teknologi Utama**: FastAPI (Python), SQLAlchemy (ORM), dan MySQL.
- **Tujuan Tercapai**: Membangun fondasi sistem backend yang cepat, aman, dan siap disambungkan ke halaman antarmuka (Frontend).

---

## Slide 2: Pencapaian 1 - Setup & Arsitektur Sistem
- **Instalasi Framework Cepat**: Menggunakan FastAPI yang dikenal sangat cepat dalam memproses *request* web.
- **Koneksi Database Otomatis**: Menghubungkan Python dengan MySQL menggunakan SQLAlchemy, sehingga pengelolaan tabel bisa dilakukan langsung lewat kode (tanpa query manual).
- **Sistem Keamanan**: Menerapkan hashing pada *password* dan perlindungan akses menggunakan token JWT (JSON Web Token).

---

## Slide 3: Pencapaian 2 - Integrasi Database Legacy
- **Tantangan**: Project ini mewarisi database sistem lama (`sipetasan_db`) yang sudah memiliki struktur tabel sendiri.
- **Solusi yang Dikerjakan**: 
  Kami telah merombak ulang seluruh struktur model Python agar 100% cocok dengan nama tabel dan kolom di database lama (seperti `daya_tampung_m3`, `admin`, `warga`, `petugas_pengangkut`).
- **Hasil**: Sistem baru bisa berjalan dengan baik tanpa merusak atau menghilangkan data yang sudah ada sebelumnya.

---

## Slide 4: Pencapaian 3 - Pembuatan 5 Modul API Utama
Sistem backend kini telah berhasil menyediakan 5 kategori layanan (Endpoint) utama:
1. **Modul Autentikasi**: Sistem Login terpusat untuk Admin dan Petugas.
2. **Modul TPS**: Manajemen data TPS (Lihat daftar TPS dan Tambah TPS baru).
3. **Modul Wilayah**: Filter pencarian wilayah (Kecamatan & Kelurahan).
4. **Modul Laporan**: Fasilitas untuk menampung keluhan warga terkait TPS.
5. **Modul Setoran**: Pencatatan aktivitas setor sampah (untuk perhitungan poin).

---

## Slide 5: Pencapaian 4 - Finalisasi "Kontrak API"
- **Apa itu Kontrak API?** Kami telah menyepakati dan mengunci aturan komunikasi antara sistem Backend dan sistem Frontend.
- **Keamanan Data (Validasi)**: Semua format pengiriman data (JSON) dilindungi ketat menggunakan *Pydantic*. Data yang dikirim dari Frontend tidak akan bisa masuk jika tidak sesuai aturan.
- **Dokumentasi Otomatis**: Seluruh rincian kontrak API ini otomatis terdokumentasi dan dapat diuji langsung oleh tim Frontend melalui halaman interaktif **Swagger UI (`/docs`)**.

---

## Slide 6: Langkah Selanjutnya (Next Steps)
1. **Frontend Integration**: Membangun tampilan website menggunakan React/Vite dan menyambungkannya dengan API yang sudah jadi.
2. **Dashboard Interaktif**: Menampilkan data TPS dan Laporan Warga dalam bentuk grafik atau peta interaktif di halaman Admin.
3. **Uji Coba Menyeluruh (End-to-End)**: Menguji kelancaran sistem mulai dari proses Login hingga input transaksi setor sampah secara real-time.
