# Task: Integrasi Peta TPS Frontend dengan FastAPI — SI-PETASAN SUROBOYO

## 1. Tujuan

Integrasikan data TPS dari backend FastAPI dan database MySQL ke peta yang sudah tersedia pada:

1. Landing page melalui `HeroMap.jsx`.
2. Halaman warga melalui `KelurahanMap.jsx` dan komponen pemanggilnya.

Backend sebelumnya sudah ditugaskan menyediakan endpoint publik:

`GET /api/tps/public`

Sebelum memulai, pastikan endpoint tersebut benar-benar tersedia dan berfungsi. Jika belum, laporkan kendalanya dan jangan membuat endpoint frontend yang mengasumsikan backend sudah siap.

## 2. Audit Sebelum Mengubah Kode

Periksa struktur dan implementasi aktual, khususnya:

- `src/api/client.js`
- `src/components/HeroMap.jsx`
- `src/components/KelurahanMap.jsx`
- `src/components/WargaPanel.jsx`
- `src/components/WargaPanelAPI.jsx`, jika digunakan
- `src/components/TpsMapModal.jsx`
- `src/data/mockData.js`
- `src/data/tpsSurabayaData.js`
- `package.json`

Periksa juga komponen induk yang merender peta serta semua pemanggilan fungsi dan props terkait TPS.

Identifikasi:
1. Sumber data yang saat ini digunakan masing-masing peta.
2. Struktur objek TPS yang diharapkan setiap komponen.
3. Field yang digunakan marker, popup, filter, modal, pencarian, dan statistik.
4. Cara Axios dikonfigurasi dan cara base URL ditentukan.
5. Apakah komponen menggunakan Leaflet langsung atau React Leaflet.
6. Apakah ada data atau logika yang masih diperlukan dari file statis.

Jangan mengasumsikan seluruh field dari data statis tersedia pada respons backend.

## 3. Buat Lapisan API TPS

Buat atau gunakan modul API TPS sesuai pola proyek, misalnya:

`src/api/tps.js`

Modul ini harus:
- Menggunakan instance Axios dari `src/api/client.js`.
- Memanggil `GET /api/tps/public`.
- Tidak membuat instance Axios duplikat jika instance bersama sudah tersedia.
- Menangani error secara konsisten.
- Tidak membutuhkan token autentikasi untuk endpoint publik.
- Tidak menggunakan URL backend yang di-hardcode jika proyek sudah memakai konfigurasi environment.

Periksa terlebih dahulu apakah base URL instance Axios sudah mencakup prefix `/api`. Pastikan path endpoint tidak menghasilkan URL ganda seperti `/api/api/tps/public`.

## 4. Normalisasi Data TPS

Buat fungsi normalisasi jika diperlukan agar komponen peta dapat menggunakan satu format data yang konsisten.

Pemetaan awal yang perlu diperiksa:

| Field backend | Field frontend |
|---|---|
| `id` | `id` |
| `nama` | `nama` |
| `nama_lama` | Sesuai kebutuhan komponen |
| `lokasi` | `lokasi` dan/atau `kelurahan` |
| `kecamatan` | `kecamatan` |
| `wilayah_kota` | `wilayah_kota` |
| `latitude` | `lat` |
| `longitude` | `lng` |
| `jenis_tps` | `jenis_tps` |
| `jumlah_container` | `jumlah_container` |
| `daya_tampung_m3` | `daya_tampung_m3` |
| `status` | `status` |
| `tanggal_update` | `tanggal_update` |

Gunakan hasil audit untuk menentukan field tambahan yang memang dibutuhkan komponen.

Ketentuan:
- Konversikan latitude dan longitude menjadi angka.
- Tolak koordinat yang `null`, kosong, tidak numerik, atau tidak valid.
- Jangan menganggap koordinat `0` sebagai satu-satunya kondisi yang tidak valid tanpa memeriksa validitasnya.
- Pastikan koordinat berada dalam rentang geografis yang masuk akal untuk wilayah Surabaya.
- Jangan mengarang nilai kapasitas terpakai, persentase kapasitas, jam operasional, atau status operasional yang tidak tersedia dari backend.
- Jika suatu field tidak tersedia, gunakan fallback yang sesuai atau tampilkan keterangan bahwa datanya belum tersedia.

## 5. Integrasi Peta Landing Page

Pada `HeroMap.jsx`:

1. Ganti sumber data TPS statis dengan data dari modul API.
2. Pertahankan layout, ukuran peta, tile layer, zoom, center, marker, popup, filter, modal, dan interaksi yang sudah ada.
3. Pastikan marker dirender setelah data API berhasil dimuat.
4. Pastikan perubahan data dan filter memperbarui marker dengan benar.
5. Hindari pembuatan marker duplikat saat komponen dirender ulang.
6. Tangani loading, data kosong, dan error tanpa merusak layout.
7. Pastikan popup dan modal menerima struktur data yang benar.
8. Pertahankan fitur lain yang tidak terkait dengan pengambilan data.

Jika komponen menggunakan `useEffect`, periksa dependency dan cleanup agar marker lama tidak tertinggal.

## 6. Integrasi Peta Halaman Warga

Pada `KelurahanMap.jsx` dan komponen pemanggilnya:

1. Ambil data TPS melalui modul API yang sama.
2. Gunakan satu sumber data backend untuk marker peta.
3. Sesuaikan struktur data melalui normalisasi, bukan dengan mengubah seluruh komponen secara sembarangan.
4. Pertahankan pemilihan TPS, popup, filter, pencarian, dan interaksi yang sudah tersedia.
5. Pertahankan pembatasan atau penyaringan berdasarkan kelurahan dan kecamatan jika fitur tersebut memang sudah diterapkan.
6. Pastikan nama field untuk koordinat konsisten.
7. Jangan menghapus seluruh data statis sebelum memastikan fungsi lain tidak lagi membutuhkannya.

Jika halaman warga memiliki data profil atau relasi kelurahan dari sumber lain, pertahankan sumber tersebut. Jangan menganggap field `lokasi` pasti sama dengan nama kelurahan sebelum memeriksa isi data.

## 7. Sinkronisasi Data

Gunakan modul API yang sama pada kedua peta agar format data konsisten.

Untuk tahap awal:
- Ambil data saat komponen atau halaman membutuhkan data TPS.
- Sediakan cara mengambil ulang data setelah perubahan jika diperlukan.
- Hindari request berulang tanpa alasan akibat dependency `useEffect` yang salah.
- Jangan menjanjikan pembaruan realtime jika mekanisme realtime belum tersedia.

Tidak perlu menambahkan WebSocket atau polling berkala kecuali memang diperlukan dan disetujui.

## 8. Penanganan Error dan Loading

Pastikan UI tetap stabil ketika:
- Backend tidak dapat diakses.
- Request gagal atau timeout.
- Respons API kosong.
- Koordinat TPS tidak valid.
- Data TPS belum selesai dimuat.

Tampilkan indikator loading atau pesan yang sesuai dengan desain yang sudah ada. Jangan mengganti error dengan data dummy secara diam-diam karena dapat membuat peta tampak benar padahal API gagal.

## 9. Batasan

- Jangan membangun ulang tampilan peta.
- Jangan mengubah backend pada tahap ini kecuali ditemukan ketidaksesuaian kontrak API yang harus dilaporkan terlebih dahulu.
- Jangan mengubah CRUD Superadmin.
- Jangan menghapus fitur yang sudah berjalan.
- Jangan mengubah struktur database.
- Jangan menambahkan dependensi baru jika tidak diperlukan.
- Jangan menimpa pekerjaan lokal yang belum di-commit.
- Jangan mengubah konfigurasi Cloudflare Tunnel atau deployment.
- Hindari refactor di luar kebutuhan integrasi.

Jika menemukan ketidaksesuaian antara respons backend dan kebutuhan frontend, jelaskan sebelum membuat perubahan di luar cakupan.

## 10. Pengujian

Jalankan pemeriksaan yang tersedia di proyek, termasuk lint atau build jika dikonfigurasi.

Verifikasi:
1. Frontend berhasil dibangun.
2. Landing page memuat data TPS dari API.
3. Halaman warga memuat data dari API yang sama.
4. Marker berada pada posisi koordinat yang benar.
5. Popup dan modal tidak error.
6. Filter dan pencarian tetap bekerja.
7. Kondisi loading, kosong, dan error ditangani.
8. Tidak ada marker duplikat.
9. Tidak ada error JavaScript yang terkait integrasi.
10. Fitur lain yang relevan tidak rusak.

Jangan mengklaim pengujian browser berhasil jika hanya menjalankan build.

## 11. Laporan Akhir

Laporkan:
- File yang diperiksa.
- File yang diubah atau dibuat.
- Perubahan sumber data pada setiap peta.
- Field normalisasi yang diterapkan.
- Pengujian dan hasil aktual.
- Kendala yang belum terselesaikan.
- Cara menguji secara manual di browser.

**Kerjakan integrasi minimal yang diperlukan, pertahankan UI yang sudah ada, lalu berhenti setelah laporan selesai.**