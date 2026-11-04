# Implementasi Role Petugas TPS --- SI-PETASAN

## Tujuan

Tambahkan role **Petugas TPS** secara menyeluruh pada SI-PETASAN,
meliputi Superadmin, MySQL, FastAPI, autentikasi, authorization, dan
frontend.

Gunakan screenshot dashboard Petugas Pengangkut sebagai referensi
visual: sidebar kiri, header, kartu statistik, layout, warna, tipografi,
radius, dan spacing. Namun, **jangan menyalin menu atau fungsi Petugas
Pengangkut**. Petugas TPS bertugas memantau kapasitas TPS secara
langsung.

## 1. Audit Project Sebelum Coding

Periksa struktur backend/frontend, model dan tabel `users` serta `tps`,
sistem role, proses pembuatan pengguna Superadmin, JWT, routing
berdasarkan role, relasi pengguna dengan TPS/wilayah, modul monitoring
kapasitas, komponen peta, dan mekanisme upload foto.

Gunakan kembali struktur, komponen, service, schema, dan endpoint yang
sudah tersedia. Jangan membuat implementasi duplikat. Sesuaikan lokasi
file dengan struktur project aktual.

## 2. Tambahkan Role Petugas TPS

Tambahkan pilihan **Petugas TPS** pada dropdown Role di halaman Kelola
Pengguna Superadmin.

Pastikan role: - Tersimpan dengan format konsisten di database. -
Dikenali backend saat login dan authorization. - Dikenali frontend untuk
menentukan dashboard dan hak akses. - Tidak mengubah atau merusak role
pengguna lama.

Jangan hanya menambahkan pilihan dropdown. Integrasikan sampai database,
backend, autentikasi, dan routing frontend.

## 3. Penugasan Petugas ke TPS

Saat Superadmin memilih role Petugas TPS, tampilkan field untuk
menentukan TPS tanggung jawabnya.

Ketentuan: - Satu Petugas TPS dapat ditugaskan ke beberapa TPS. - Satu
TPS dapat memiliki lebih dari satu petugas jika diperlukan. - Daftar TPS
diambil dari database, bukan data statis. - Superadmin dapat menambah
atau memperbarui penugasan. - Simpan relasi penugasan di MySQL. -
Periksa apakah relasi setara sudah tersedia. Jika belum, buat tabel
penghubung dengan foreign key dan constraint yang sesuai. - Jangan
membuat relasi duplikat atau menghapus data pengguna/TPS yang sudah ada.

## 4. Integrasi Backend FastAPI dan Database

Implementasikan: - Pembuatan akun Petugas TPS melalui proses Kelola
Pengguna Superadmin yang sudah ada. - Penyimpanan role Petugas TPS. -
Penyimpanan, pembacaan, dan pembaruan penugasan TPS. - API daftar TPS
yang ditugaskan kepada pengguna login. - API statistik dashboard Petugas
TPS. - API riwayat monitoring milik petugas login. - API pengiriman dan
detail laporan monitoring. - API informasi TPS yang menjadi tanggung
jawab petugas.

Gunakan pola model SQLAlchemy, schema Pydantic, service, dan routes yang
konsisten dengan project.

### Keamanan backend

-   Ambil identitas pengguna dari JWT tervalidasi; jangan mempercayai
    `user_id` atau `petugas_id` dari frontend.
-   Validasi role pada setiap endpoint.
-   Validasi penugasan TPS pada setiap endpoint yang membutuhkan akses
    TPS.
-   Petugas TPS hanya boleh membaca dan mengirim laporan untuk TPS yang
    ditugaskan kepadanya.
-   Jangan mengandalkan penyembunyian menu atau proteksi route frontend
    sebagai pengamanan.
-   Jangan izinkan Petugas TPS mengakses fungsi Admin, Superadmin,
    Driver, atau Petugas Pengangkut.
-   Petugas TPS tidak boleh menyetujui/menolak laporan atau mengubah
    daya tampung maksimum TPS.
-   Gunakan HTTP status yang sesuai untuk akses tidak sah.

## 5. Dashboard dan Menu Petugas TPS

Buat dashboard dengan gaya visual konsisten dengan screenshot Petugas
Pengangkut, tetapi menu dan kontennya khusus Petugas TPS.

Menu sidebar:

### A. Dashboard

Ambil data dari backend: - Jumlah TPS yang ditugaskan. - Jumlah
monitoring yang telah dilakukan. - Jumlah laporan menunggu verifikasi. -
Jumlah laporan disetujui. - Jumlah laporan ditolak. - Waktu monitoring
terakhir.

Jika belum ada data, tampilkan nol atau empty state. Jangan gunakan
angka dummy.

### B. Monitoring Kapasitas TPS

Buat halaman pemantauan TPS yang ditugaskan, berisi: - Pilihan TPS dari
daftar penugasan. - Volume sampah aktual (m³). - Persentase kapasitas
terisi. - Foto kondisi TPS. - Catatan kondisi TPS. - Waktu pemantauan. -
Preview kapasitas tersedia berdasarkan daya tampung maksimum TPS.

Validasi final harus dilakukan backend. Ikuti schema modul monitoring
yang sudah ada; jangan membuat sistem monitoring kedua. Setelah dikirim,
status awal laporan adalah **Menunggu Verifikasi**.

### C. Riwayat Monitoring

Tampilkan laporan milik petugas login: - Nama TPS. - Volume aktual. -
Persentase terisi. - Waktu pemantauan. - Foto. - Status verifikasi. -
Alasan penolakan jika ada.

### D. Lokasi TPS

Tampilkan peta dan informasi TPS yang ditugaskan. Gunakan koordinat asli
dari database dan komponen peta project. TPS tanpa koordinat boleh
muncul dalam daftar, tetapi jangan diberi marker buatan.

### E. Profil Saya

Tampilkan informasi akun Petugas TPS dari backend.

## 6. Integrasi Modul Monitoring Kapasitas

Integrasikan dengan modul Monitoring Kapasitas TPS yang sudah ada atau
sedang dikembangkan.

Alur: 1. Petugas memilih TPS yang ditugaskan. 2. Petugas mengisi volume
aktual dan persentase terisi. 3. Petugas mengunggah foto dan catatan. 4.
Backend memvalidasi data dan hak akses. 5. Laporan disimpan dengan
status Menunggu Verifikasi. 6. Laporan tampil pada halaman verifikasi
Admin/Superadmin. 7. Petugas dapat melihat status dan riwayat laporan.

Hanya laporan yang disetujui Admin/Superadmin yang boleh menjadi sumber
kapasitas resmi untuk warga. Laporan menunggu atau ditolak tidak boleh
mengubah kapasitas publik.

Jika modul monitoring belum tersedia, identifikasi bagian yang belum ada
lalu implementasikan mengikuti struktur project. Jangan mengasumsikan
tabel atau endpoint sudah ada tanpa memeriksanya.

## 7. Routing dan Login

-   Setelah login, role Petugas TPS diarahkan ke dashboard Petugas TPS.
-   Refresh halaman tidak boleh menyebabkan role salah dikenali.
-   Lindungi route frontend dan endpoint backend sesuai role.
-   Jangan mengubah alur login role lain.
-   Pertahankan mekanisme token/interceptor yang sudah berjalan kecuali
    ditemukan masalah yang memang perlu diperbaiki.

## 8. UI dan Error Handling

-   Pertahankan identitas visual SI-PETASAN.
-   Buat tampilan responsif desktop dan mobile.
-   Gunakan komponen dan pola styling yang sudah ada.
-   Tampilkan loading, empty state, dan error state.
-   Jangan menghapus data terakhir yang berhasil dimuat hanya karena
    satu request gagal sementara.
-   Jangan gunakan mock data atau fallback statis untuk menyamarkan
    kegagalan API.
-   Tampilkan pesan error yang jelas.

## 9. Batasan Perubahan

-   Jangan menyalin mentah menu Petugas Pengangkut.
-   Jangan mengubah fitur role lain yang tidak terkait.
-   Jangan menghapus fitur lama.
-   Jangan membuat TPS, koordinat, statistik, atau laporan palsu.
-   Jangan membuat endpoint, tabel, atau komponen duplikat.
-   Jangan mengubah daya tampung maksimum TPS tanpa instruksi.
-   Jangan menaruh aturan keamanan hanya di frontend.
-   Hindari refactor besar di luar kebutuhan fitur.
-   Jaga kompatibilitas data pengguna dan TPS yang sudah ada.

## 10. Pengujian Integrasi Wajib

Uji alur end-to-end: 1. Superadmin membuat akun Petugas TPS. 2.
Superadmin menetapkan satu atau beberapa TPS. 3. Role dan relasi
penugasan tersimpan di MySQL. 4. Petugas berhasil login dan diarahkan ke
dashboard yang benar. 5. Dashboard menampilkan statistik backend sesuai
akun login. 6. Daftar TPS hanya menampilkan TPS yang ditugaskan. 7.
Petugas mengirim laporan untuk TPS yang ditugaskan. 8. Laporan tersimpan
dan muncul pada verifikasi Admin/Superadmin. 9. Petugas melihat status
dan riwayat laporannya. 10. Petugas tidak dapat mengirim laporan untuk
TPS yang tidak ditugaskan, termasuk melalui manipulasi request API. 11.
Petugas tidak dapat mengakses endpoint khusus role lain. 12. Akun dan
fitur role lama tetap berfungsi.

## 11. Laporan Hasil Pengerjaan

Setelah implementasi, laporkan: - File yang dibuat dan diubah. -
Perubahan tabel dan relasi database. - SQL migration atau langkah
perubahan database. - Endpoint yang dibuat atau digunakan. - Perubahan
autentikasi dan authorization. - Halaman dan menu frontend yang
dibuat. - Hasil pengujian integrasi. - Masalah atau pekerjaan yang belum
selesai.

**Urutan pengerjaan:** audit project, implementasikan database dan
backend, uji API, implementasikan frontend, lalu uji alur end-to-end.
Jangan menyatakan fitur selesai jika baru berupa UI atau belum terhubung
ke database.
