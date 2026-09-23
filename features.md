# Daftar Fitur SIPK-TPS Surabaya

Dokumen ini merinci seluruh fitur sistem berdasarkan peran pengguna.

---

## 1. Warga (Publik)

### 1.1 Peta Interaktif TPS
- Melihat seluruh titik TPS di Kota Surabaya pada peta interaktif
- Indikator warna status kapasitas: **Hijau** (≤60%), **Kuning** (61–79%), **Merah** (≥80%)
- Filter TPS berdasarkan kecamatan, kelurahan, jenis, dan status
- Klik marker untuk melihat detail TPS (nama, alamat, kapasitas, jam operasional)
- Deteksi lokasi otomatis (geolocation browser) untuk menemukan TPS terdekat
- Tidak memerlukan login

### 1.2 Detail TPS
- Melihat informasi lengkap satu TPS: nama, alamat, jenis, kapasitas maksimal, kapasitas terkini, status
- Melihat daftar kelurahan yang dilayani oleh TPS tersebut
- Melihat jam operasional TPS

### 1.3 Jadwal Truk Sampah
- Melihat jadwal pengangkutan truk sampah di wilayah (kelurahan/kecamatan) masing-masing
- Jadwal ditentukan oleh admin DLH dan ditampilkan ke publik tanpa perlu login
- Informasi yang ditampilkan: hari pengangkutan, estimasi jam, area/rute yang dilayani

### 1.4 Laporan Warga
- Mengirim laporan kondisi TPS (misal: TPS penuh, bau, rusak) tanpa perlu registrasi/login
- Form laporan: pilih TPS, deskripsi masalah, foto kondisi (opsional)
- Laporan diteruskan ke panel admin/petugas untuk ditindaklanjuti

---

## 2. Petugas Lapangan TPS

### 2.1 Autentikasi
- Login dengan akun yang dibuat oleh admin
- Hak akses terbatas hanya pada TPS yang ditugaskan

### 2.2 Update Kapasitas TPS
- Memperbarui volume sampah terkini di TPS yang ditugaskan
- Input dalam satuan persentase atau kubikasi (m³)
- Validasi geofencing: sistem memverifikasi lokasi GPS petugas dalam radius <100 m dari titik TPS sebelum input diterima
- Upload foto kondisi TPS sebagai bukti fisik lapangan
- Riwayat input tercatat otomatis (waktu, volume, foto, koordinat GPS saat input)

### 2.3 Scan QR Code Rumah Warga
- Scan QR code permanen yang terpasang di tiap rumah warga saat proses pengangkutan sampah
- QR code mengidentifikasi alamat dan data rumah secara otomatis
- Sistem mencatat waktu dan lokasi scan sebagai bukti pengangkutan

### 2.4 Foto Sampah
- Mengambil/upload foto sampah warga sebagai validasi visual pengangkutan
- Foto terhubung ke data rumah yang QR code-nya baru di-scan

### 2.5 Penimbangan Sampah Plastik (Anorganik)
- Input berat sampah plastik/anorganik hasil timbangan manual (dalam kg)
- Data berat terhubung ke rumah warga yang bersangkutan (dari scan QR code)
- Riwayat penimbangan tersimpan per rumah per tanggal pengangkutan

### 2.6 Riwayat Pengangkutan
- Melihat riwayat pengangkutan yang sudah dilakukan (daftar rumah yang sudah di-scan, berat sampah, foto)

---

## 3. Driver Armada Truk

### 3.1 Autentikasi
- Login dengan akun yang dibuat oleh admin

### 3.2 Daftar TPS Prioritas
- Melihat daftar TPS yang perlu segera diangkut berdasarkan tingkat urgensi (status merah/kuning lebih dulu)
- Informasi: nama TPS, alamat, status kapasitas, persentase keterisian

### 3.3 Peta Rute Pengangkutan
- Melihat titik-titik TPS prioritas di peta GPS mobile
- Navigasi menuju TPS kritis dan TPA Benowo

### 3.4 Jadwal Pengangkutan
- Melihat jadwal pengangkutan yang ditugaskan oleh admin
- Informasi: rute, area, hari & jam pengangkutan

---

## 4. Super Admin / Manajemen DLH

### 4.1 Autentikasi & Manajemen Akun
- Login dengan akses penuh ke seluruh fitur
- Membuat, mengedit, dan menonaktifkan akun petugas & driver
- Menugaskan petugas ke TPS tertentu

### 4.2 Kelola Master Data TPS
- Tambah, edit, hapus data TPS (nama, alamat, koordinat, jenis, kapasitas maksimal, status aktif/tidak aktif)
- Kelola relasi TPS ↔ Kelurahan (many-to-many)
- Mencatat sumber data dan tanggal pembaruan setiap entri TPS

### 4.3 Kelola Jadwal Truk Sampah
- Membuat dan mengelola jadwal pengangkutan truk sampah per wilayah (kecamatan/kelurahan)
- Informasi jadwal: hari, jam, area/rute yang dilayani, driver yang bertugas
- Jadwal ditampilkan ke warga di halaman publik

### 4.4 Kelola QR Code Rumah Warga
- Generate dan kelola QR code untuk tiap rumah warga
- Data QR code: ID rumah, nama kepala keluarga, alamat, kelurahan

### 4.5 Dashboard Eksekutif & Analitik
- Peta makro seluruh TPS Kota Surabaya dengan status kapasitas real-time
- Grafik tren akumulasi sampah harian/mingguan per kecamatan
- Heatmap spasial kepadatan akumulasi sampah kota
- Ringkasan statistik kapasitas TPS aktif per kecamatan/kelurahan
- Daftar TPS kritis (status merah) yang membutuhkan penanganan darurat

### 4.6 Sistem Alert & Early Warning
- Notifikasi otomatis saat kapasitas TPS mencapai ≥80% (status merah)
- Panel daftar TPS kritis beserta rekomendasi tindakan
- Notifikasi dikirim ke admin dan driver terkait

### 4.7 Laporan & Data Pengangkutan Sampah
- Melihat dan menindaklanjuti laporan warga (ubah status: baru → diproses → selesai)
- Rekap data pengangkutan sampah per petugas: jumlah rumah yang dikunjungi, total berat sampah plastik yang dikumpulkan, per periode

### 4.8 Export Laporan
- Export ringkasan data kapasitas TPS ke format PDF dan XLSX
- Export rekap pengangkutan sampah (termasuk data timbangan plastik) untuk arsip DLH

---

## Ringkasan Fitur per Aktor

| Fitur | Warga | Petugas | Driver | Admin |
|---|:---:|:---:|:---:|:---:|
| Peta interaktif TPS | ✓ | — | ✓ | ✓ |
| Jadwal truk sampah | ✓ | — | ✓ | ✓ (kelola) |
| Laporan warga | ✓ | — | — | ✓ (kelola) |
| Update kapasitas TPS | — | ✓ | — | ✓ |
| Scan QR code rumah | — | ✓ | — | — |
| Foto sampah | — | ✓ | — | — |
| Timbang sampah plastik | — | ✓ | — | — |
| Daftar TPS prioritas | — | — | ✓ | ✓ |
| Peta rute pengangkutan | — | — | ✓ | ✓ |
| Dashboard & analitik | — | — | — | ✓ |
| Early warning alert | — | — | ✓ | ✓ |
| CRUD TPS & kelurahan | — | — | — | ✓ |
| Kelola akun pengguna | — | — | — | ✓ |
| Kelola QR code | — | — | — | ✓ |
| Export laporan | — | — | — | ✓ |

