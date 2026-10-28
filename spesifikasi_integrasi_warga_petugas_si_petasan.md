# SI-PETASAN SUROBOYO

## Spesifikasi Implementasi Terintegrasi: Setoran Warga, Validasi Petugas, dan Riwayat Pengambilan

Dokumen ini menjadi acuan implementasi untuk AI coding agent pada
repository SI-PETASAN SUROBOYO. Implementasikan fitur warga dan petugas
sebagai satu alur yang terhubung ke database, bukan sebagai dua fitur
terpisah.

------------------------------------------------------------------------

## 1. Konteks dan Teknologi

Stack yang digunakan: - Frontend: React JS + Vite. - Backend: FastAPI. -
Database: MySQL. - ORM: SQLAlchemy. - Autentikasi: gunakan sistem
autentikasi/token yang sudah ada.

### Halaman warga

1.  Setor & Reward.
2.  QR & Status Validasi.
3.  Riwayat Pengambilan Sampah.

### Halaman petugas

1.  Tugas Hari Ini.
2.  Scan QR Warga.
3.  Riwayat Pengambilan.

Screenshot referensi dari pengguna menunjukkan desain halaman yang sudah
ada. Pertahankan desain, sidebar, warna, tata letak, dan komponen UI
yang ada. Fokus pada integrasi fungsional, data database, validasi, dan
alur kerja. Jangan mendesain ulang halaman dari nol.

------------------------------------------------------------------------

## 2. Aturan Wajib Sebelum Mengubah Kode

Lakukan audit repository terlebih dahulu: 1. Periksa struktur direktori
frontend dan backend. 2. Temukan komponen React untuk keenam halaman
terkait. 3. Periksa model SQLAlchemy dan tabel MySQL untuk warga,
petugas, setoran, pengambilan, QR, foto, validasi, poin, jadwal,
kecamatan, dan kelurahan. 4. Periksa endpoint yang sudah tersedia untuk
pengajuan setoran, antrean petugas, scan QR, pemeriksaan, riwayat,
upload foto, dan autentikasi. 5. Periksa hubungan akun petugas dengan
kecamatan/kelurahan yang menjadi wilayah tugasnya. 6. Periksa aturan
poin dan status setoran yang sudah diterapkan. 7. Identifikasi fitur
yang sudah berjalan, yang belum selesai, dan yang dapat digunakan
kembali.

Setelah audit, tulis rencana singkat lalu lanjutkan implementasi. Jangan
berhenti hanya pada analisis.

### Jangan lakukan hal berikut

-   Jangan membuat model, tabel, endpoint, atau komponen duplikat
    sebelum memastikan implementasi lama tidak bisa digunakan.
-   Jangan mengganti sistem autentikasi yang sudah ada.
-   Jangan merombak UI yang tidak berkaitan.
-   Jangan menghapus atau mereset data lama.
-   Jangan mengganti data nyata dengan array dummy atau hardcode.
-   Jangan mengklaim tes berhasil jika belum dijalankan.
-   Jangan mengarang aturan pengurangan poin yang belum ditentukan.
-   Jangan mengubah file atau fitur di luar cakupan tanpa alasan teknis
    yang jelas.

------------------------------------------------------------------------

## 3. Satu Sumber Data untuk Warga dan Petugas

Gunakan satu entitas/data setoran sebagai sumber utama untuk seluruh
alur.

Setiap pengajuan harus mempunyai ID setoran unik. ID tersebut
menghubungkan: - Identitas warga pemilik laporan. - Jenis sampah yang
dilaporkan. - Berat perkiraan. - QR setoran. - Petugas yang menangani. -
Foto bukti pemeriksaan. - Berat aktual dan hasil pemeriksaan. - Status
validasi. - Perhitungan poin. - Riwayat warga dan riwayat petugas.

Jangan membuat salinan transaksi terpisah untuk halaman warga dan
halaman petugas. Riwayat kedua pihak harus merujuk pada setoran yang
sama.

------------------------------------------------------------------------

## 4. Alur Status Setoran

Terapkan alur bisnis berikut dengan status yang konsisten antara backend
dan frontend:

1.  Warga membuat laporan setoran.
2.  Setoran menunggu petugas.
3.  Petugas yang berwenang memindai QR.
4.  Petugas mengambil/mengunggah foto bukti.
5.  Petugas memeriksa berat, jenis, dan kondisi/kebersihan sampah.
6.  Setoran dinyatakan sesuai atau tidak sesuai.
7.  Sistem menentukan poin akhir berdasarkan aturan bisnis.
8.  Setoran selesai dan muncul di riwayat.

Gunakan nama status yang sesuai dengan konvensi kode yang sudah ada.
Jika status lama berbeda, petakan secara konsisten dan hindari membuat
status yang saling bertentangan.

Jangan: - Menganggap scan QR saja sebagai penyelesaian pengambilan. -
Menganggap berat aktual nol ketika pemeriksaan belum dilakukan. -
Menimpa estimasi berat atau jenis yang dilaporkan warga dengan hasil
pemeriksaan. - Menganggap laporan selesai sebelum proses pemeriksaan
yang diwajibkan tuntas.

Simpan data laporan awal dan hasil pemeriksaan sebagai data yang dapat
dibedakan.

------------------------------------------------------------------------

## 5. Fitur Warga

### 5.1 Setor & Reward

Pertahankan desain halaman saat ini.

Ketika warga memilih jenis sampah, memasukkan estimasi berat, lalu
menekan tombol **Kirim Setoran Sampah**:

1.  Validasi jenis sampah dan berat di frontend serta backend.
2.  Ambil identitas warga dari sesi/token autentikasi di backend, bukan
    dari ID bebas yang dikirim frontend.
3.  Simpan pengajuan setoran ke database.
4.  Simpan jenis sampah yang dilaporkan dan estimasi beratnya.
5.  Buat ID setoran unik yang digunakan oleh QR dan proses petugas.
6.  Tetapkan status awal yang berarti menunggu petugas.
7.  Setelah penyimpanan berhasil, arahkan warga ke halaman QR & Status
    Validasi untuk setoran yang baru dibuat.
8.  Tampilkan loading, pesan berhasil, dan pesan kesalahan yang jelas.
9.  Cegah pengiriman ganda akibat klik berulang atau request yang
    diulang.

Jangan memberikan poin final saat warga baru mengajukan setoran.

### 5.2 QR & Status Validasi

Halaman ini harus memuat detail setoran yang dipilih, bukan hanya data
statis atau setoran terbaru yang tidak jelas.

Tampilkan: - QR yang terhubung ke ID setoran tertentu. - Status
terkini. - Estimasi berat yang dilaporkan warga. - Jenis sampah yang
dilaporkan warga. - Foto bukti dari petugas setelah tersedia. - Berat
aktual hasil pemeriksaan. - Kondisi/kebersihan sampah. - Jenis sampah
hasil pemeriksaan jika petugas memverifikasinya. - Waktu pemeriksaan dan
informasi petugas jika tersedia dan sesuai kebutuhan.

Jika pemeriksaan belum dilakukan, tampilkan keterangan seperti "Belum
diperiksa". Jangan menampilkan nilai hasil pemeriksaan palsu.

QR harus merujuk pada setoran yang valid. Backend wajib memverifikasi
status setoran dan kewenangan petugas saat QR dipindai. Jangan hanya
mengandalkan ID atau status yang dikirim frontend.

### 5.3 Alur validasi realtime

Ketika petugas memindai QR atau menyimpan hasil pemeriksaan, status dan
rincian di halaman warga harus diperbarui tanpa refresh manual.

1.  Periksa apakah proyek sudah memakai WebSocket, polling, atau
    mekanisme realtime lain.
2.  Gunakan mekanisme yang sudah ada bila sesuai.
3.  Jika belum ada, pilih implementasi paling sederhana yang cocok
    dengan arsitektur proyek.
4.  Bersihkan koneksi atau timer ketika komponen dilepas.
5.  Tangani koneksi gagal, request ulang, dan token kedaluwarsa.
6.  Jangan mengklaim realtime jika data hanya diambil sekali saat
    halaman dibuka.

### 5.4 Riwayat Pengambilan Warga

Pertahankan desain daftar riwayat yang sudah ada.

Ambil data dari database dengan filter berdasarkan warga yang sedang
login. Riwayat menampilkan transaksi yang benar-benar dibuat dan memuat,
sejauh tersedia: - Tanggal/waktu. - ID setoran. - Jenis sampah yang
dilaporkan dan/atau jenis terverifikasi. - Berat perkiraan dan berat
aktual. - Status akhir. - Poin yang diperoleh atau perubahan poin sesuai
aturan. - Foto atau detail pemeriksaan jika relevan.

Gunakan urutan terbaru terlebih dahulu. Tentukan dengan konsisten apakah
pengajuan yang belum selesai ditampilkan sebagai riwayat sementara atau
hanya setelah selesai. Jangan menggandakan transaksi.

------------------------------------------------------------------------

## 6. Fitur Petugas

### 6.1 Tugas Hari Ini --- ringkasan harian

Pertahankan desain halaman Tugas Hari Ini.

#### Target Pengambilan

-   Tampilkan jumlah target pengambilan untuk tanggal yang aktif.
-   Gunakan jadwal atau target yang benar-benar tersedia di sistem.
-   Jika target belum dikonfigurasi, tampilkan keterangan yang jelas.
    Jangan mengarang angka target.

#### Sudah Diambil

-   Hitung jumlah pengambilan yang telah diselesaikan petugas pada
    tanggal yang sama.
-   Setoran yang hanya dipindai atau masih diperiksa tidak dihitung
    selesai.
-   Hitung persentase terhadap target yang valid dan tangani target nol.

#### Total Muatan

-   Jumlahkan berat aktual dari setoran yang berhasil diselesaikan
    petugas pada tanggal tersebut.
-   Jangan menjumlahkan estimasi berat warga sebagai berat aktual.
-   Gunakan satuan kg secara konsisten.
-   Jika belum ada pengambilan selesai, tampilkan 0 kg.

Gunakan periode tanggal dan zona waktu yang konsisten di seluruh
ringkasan.

### 6.2 Pengambilan Berikutnya

Tampilkan antrean pengajuan setoran warga yang belum selesai dan berada
dalam wilayah tugas petugas.

Setiap item menampilkan informasi yang tersedia: - Nama warga. - Alamat
rumah/lokasi pengambilan. - Kecamatan dan kelurahan. - Jenis sampah yang
dilaporkan. - Estimasi berat. - Jadwal atau waktu pengajuan. - Status
setoran.

Data harus berasal dari laporan warga yang tersimpan di database, bukan
data dummy.

Urutkan berdasarkan jadwal atau prioritas yang benar-benar tersedia.
Jika belum ada prioritas, gunakan urutan jadwal terdekat atau waktu
pengajuan terlama secara konsisten.

Setoran yang sudah selesai tidak boleh tetap muncul sebagai tugas
berikutnya. Cegah dua petugas mengambil atau memproses setoran yang sama
secara bersamaan menggunakan mekanisme database yang sesuai bila
diperlukan.

### 6.3 Filter wilayah petugas

Antrean hanya boleh berisi setoran yang masuk cakupan kewenangan petugas
berdasarkan data penugasan di database.

-   Ambil identitas dan wilayah petugas dari autentikasi dan database.
-   Terapkan filter kecamatan/kelurahan di backend, bukan hanya
    frontend.
-   Jangan mempercayai wilayah yang dikirim bebas oleh frontend.
-   Jika petugas memiliki beberapa kelurahan, gunakan relasi penugasan
    yang memang tersedia.
-   Jangan menganggap satu petugas hanya memiliki satu wilayah jika
    model mendukung beberapa wilayah.
-   Jika wilayah belum diatur, tampilkan pesan yang jelas dan jangan
    membuka akses ke semua wilayah secara otomatis.

### 6.4 Scan QR dan pemeriksaan petugas

Hubungkan menu Scan QR Warga dengan data setoran warga.

Setelah QR dipindai: 1. Backend memverifikasi setoran dan statusnya. 2.
Backend memeriksa kewenangan petugas atas wilayah setoran. 3. Tampilkan
detail laporan warga. 4. Petugas mengunggah foto bukti sampah. 5.
Petugas memasukkan berat aktual. 6. Petugas mengisi kondisi/kebersihan
dan memverifikasi jenis sampah jika fungsi ini memang disediakan. 7.
Simpan hasil pemeriksaan pada setoran yang sama. 8. Perbarui status agar
dapat dilihat warga. 9. Hitung poin akhir sesuai aturan bisnis. 10.
Tandai selesai hanya setelah semua langkah yang diwajibkan berhasil.

Jangan menandai pengambilan selesai hanya karena QR dipindai. Pastikan
request ulang tidak mengakibatkan transaksi atau poin ganda.

Foto harus divalidasi tipe dan ukurannya, disimpan menggunakan mekanisme
penyimpanan yang sesuai, dan memiliki referensi di database. Jangan
menyimpan gambar besar sebagai Base64 dalam kolom biasa tanpa alasan
teknis.

### 6.5 Riwayat Pengambilan Petugas

Pertahankan desain tabel riwayat yang ada.

Riwayat personal petugas harus menunjukkan setoran yang benar-benar
ditangani atau diselesaikan oleh petugas yang sedang login, dengan
mempertimbangkan model penugasan yang sudah tersedia. Filter wilayah
saja tidak cukup untuk menentukan bahwa transaksi adalah pekerjaan
petugas tersebut.

Tampilkan: - Waktu pengambilan/penyelesaian. - Nama warga. - Alamat
pengambilan. - Jenis sampah. - Berat aktual. - Foto bukti. - Status
akhir. - Tombol Lihat Detail.

Saat **Lihat Detail** ditekan, tampilkan informasi setoran, laporan awal
warga, hasil pemeriksaan, foto, waktu, status, serta poin akhir jika
tersedia.

Pastikan: - Foto berasal dari transaksi yang benar dan dapat diakses
oleh pihak berwenang. - Foto yang sudah ada tidak ditampilkan sebagai
"Tidak ada" karena URL atau path keliru. - Jika foto memang belum
diunggah, tampilkan keterangan yang sesuai. - Jika berat aktual belum
diperiksa, jangan menampilkannya sebagai 0 kg.

------------------------------------------------------------------------

## 7. Aturan Jenis Sampah, Berat, dan Poin

Periksa aturan poin yang benar-benar sudah digunakan aplikasi.

1.  Simpan estimasi berat dan jenis laporan warga secara terpisah dari
    hasil pemeriksaan petugas.
2.  Gunakan berat aktual sebagai dasar perhitungan akhir apabila sesuai
    dengan aturan bisnis yang ada.
3.  Jika jenis sampah berubah setelah pemeriksaan, gunakan aturan poin
    jenis yang terverifikasi sesuai kebijakan aplikasi.
4.  Jika sampah tidak sesuai, tetapkan status dan poin berdasarkan
    aturan bisnis yang telah ditentukan.
5.  Jika nominal atau rumus pengurangan poin belum ada, jangan
    mengarangnya. Tandai sebagai keputusan bisnis yang perlu
    dikonfirmasi dan pisahkan logikanya agar mudah disesuaikan.
6.  Pastikan poin hanya diberikan atau disesuaikan satu kali.
7.  Simpan hasil validasi dan perubahan saldo poin secara transaksional
    agar tidak terjadi pembaruan sebagian.
8.  Sediakan mekanisme koreksi yang jelas jika hasil final memang boleh
    diubah.
9.  Pastikan saldo poin di halaman warga konsisten dengan transaksi dan
    riwayat.

------------------------------------------------------------------------

## 8. API, Database, dan Keamanan

-   Gunakan pola FastAPI, SQLAlchemy, schema, dan dependency database
    yang sudah ada.
-   Gunakan tabel/model yang tersedia sebelum menambahkan yang baru.
-   Tambahkan perubahan skema secara aman hanya jika benar-benar
    diperlukan.
-   Jangan menghapus atau mereset database.
-   Validasi input di backend.
-   Terapkan autentikasi dan otorisasi pada semua endpoint terkait.
-   Warga hanya boleh melihat setoran miliknya.
-   Petugas hanya boleh melihat atau memvalidasi setoran sesuai
    kewenangannya.
-   Riwayat petugas harus dapat mengidentifikasi siapa yang benar-benar
    memproses setoran.
-   Gunakan transaksi database untuk perubahan yang saling bergantung.
-   Cegah pemrosesan bersamaan atau validasi ganda.
-   Jangan mengekspos informasi pribadi warga atau token QR sensitif
    kepada pihak yang tidak berwenang.
-   Pastikan error API ditangani dengan baik di frontend.

------------------------------------------------------------------------

## 9. Batasan UI

Gunakan screenshot yang diberikan sebagai referensi tampilan halaman
warga dan petugas.

Pertahankan: - Sidebar dan navigasi. - Warna dan tata letak. - Komponen
kartu, tabel, dan daftar. - Desain QR dan status validasi. - Desain
antrean pengambilan serta riwayat.

Perubahan UI hanya dilakukan jika diperlukan untuk menampilkan data,
status, foto, loading, error, atau detail yang belum tersedia. Jangan
merombak halaman atau menghapus fitur lain.

------------------------------------------------------------------------

## 10. Pengujian Wajib

Jalankan pengujian yang tersedia dan uji alur end-to-end:

1.  Warga mengajukan setoran dengan data valid.
2.  Input kosong atau berat tidak valid ditolak.
3.  Setoran tersimpan dan muncul di halaman QR & Status Validasi.
4.  Setoran muncul pada antrean petugas yang berwenang.
5.  Petugas di luar wilayah tidak dapat mengakses atau memvalidasi
    setoran tersebut.
6.  QR mengidentifikasi setoran yang benar.
7.  Foto bukti berhasil diunggah dan disimpan.
8.  Berat aktual, kondisi, dan jenis terverifikasi tampil di halaman
    warga.
9.  Status diperbarui tanpa refresh manual sesuai mekanisme realtime
    yang diterapkan.
10. Ringkasan target, jumlah selesai, dan total muatan harian dihitung
    dengan benar.
11. Poin sesuai dengan aturan yang sudah ada.
12. Pengiriman ulang validasi tidak memberikan poin ganda.
13. Riwayat warga menampilkan transaksi milik warga tersebut.
14. Riwayat petugas menampilkan transaksi yang benar-benar ditangani
    petugas tersebut.
15. Detail riwayat menampilkan foto dan rincian transaksi yang benar.
16. Setoran selesai tidak dapat diproses kembali secara tidak sah.
17. Fitur autentikasi, chat, dashboard, dan pengelolaan TPS tetap
    berfungsi.

Jika ada tes yang tidak dapat dijalankan, laporkan penyebabnya. Jangan
menyatakan tes berhasil tanpa menjalankannya.

------------------------------------------------------------------------

## 11. Urutan Implementasi

Kerjakan dalam urutan berikut:

1.  Audit model, endpoint, komponen, autentikasi, dan aturan poin.
2.  Identifikasi sumber data setoran yang akan dipakai bersama.
3.  Implementasikan penyimpanan pengajuan warga.
4.  Hubungkan QR dan status validasi warga.
5.  Hubungkan antrean serta proses pemeriksaan petugas.
6.  Implementasikan upload dan tampilan foto bukti.
7.  Implementasikan perhitungan poin yang sesuai aturan.
8.  Hubungkan riwayat warga dan petugas.
9.  Implementasikan ringkasan harian petugas.
10. Jalankan pengujian dan perbaiki regresi.

Jangan berhenti setelah audit atau membuat mockup. Implementasikan kode
nyata secara bertahap. Hindari perubahan besar yang tidak diperlukan.

------------------------------------------------------------------------

## 12. Laporan Akhir

Setelah implementasi, laporkan: - File frontend dan backend yang
diperiksa/diubah. - Model dan endpoint yang digunakan atau
ditambahkan. - Perubahan skema database, jika ada. - Alur setoran dari
warga hingga selesai ditangani petugas. - Mekanisme realtime yang
benar-benar diterapkan. - Cara foto disimpan dan ditampilkan. - Cara
target dan total muatan harian dihitung. - Cara filter wilayah dan
riwayat personal petugas diterapkan. - Aturan poin yang benar-benar
digunakan. - Tes yang benar-benar dijalankan beserta hasilnya. - Kendala
atau keputusan bisnis yang masih memerlukan konfirmasi.

Utamakan implementasi minimal, aman, konsisten dengan struktur proyek,
dan tidak merusak fitur yang sudah berjalan.
