Implementasi Role Petugas TPS --- SI-PETASAN
Tujuan
Sempurnakan implementasi role Petugas TPS pada SI-PETASAN, mencakup Superadmin, MySQL, FastAPI, autentikasi, authorization, dan frontend.

PENTING: Frontend Petugas TPS sudah tersedia dengan nama PetugasTpsPanel.jsx. Jangan membuat dashboard atau panel Petugas TPS baru dari nol. Audit, gunakan, dan kembangkan file tersebut beserta komponen pendukungnya. Pertahankan fitur dan desain yang sudah ada selama tidak bertentangan dengan kebutuhan di bawah.

Gunakan screenshot dashboard Petugas Pengangkut sebagai referensi visual: sidebar kiri, header, kartu statistik, layout, warna, tipografi, radius, dan spacing. Namun, jangan menyalin menu atau fungsi Petugas Pengangkut. Petugas TPS bertugas memantau kondisi dan kapasitas TPS secara langsung.

Gunakan screenshot form Superadmin yang diberikan sebagai referensi untuk penambahan Kecamatan Tugas, Kelurahan Tugas, dan TPS Tanggung Jawab.
1. Audit Project Sebelum Coding
Periksa terlebih dahulu:
- Struktur backend dan frontend.
- File PetugasTpsPanel.jsx beserta seluruh komponen, hook, API client, dan stylesheet yang digunakannya.
- Halaman Kelola Pengguna Superadmin (Tambah dan Edit akun).
- Model dan tabel users, tps, kecamatan, kelurahan, serta relasi wilayah yang sudah ada.
- Sistem role, JWT, login, dan routing berdasarkan role.
- Relasi pengguna dengan wilayah dan TPS.
- Modul monitoring kapasitas, komponen peta, dan mekanisme upload foto.
Gunakan kembali struktur, komponen, service, schema, endpoint, dan relasi yang sudah tersedia. Jangan membuat implementasi duplikat. Sesuaikan lokasi file dengan struktur project aktual.

Sebelum mengubah kode, identifikasi bagian yang sudah berfungsi dan bagian yang belum tersedia. Jangan menghapus atau mengganti implementasi PetugasTpsPanel.jsx tanpa alasan teknis yang jelas.
2. Tambahkan dan Pastikan Role Petugas TPS
Tambahkan atau pastikan pilihan Petugas TPS tersedia pada dropdown Role di halaman Kelola Pengguna Superadmin.

Pastikan role:
- Tersimpan dengan format konsisten di database.
- Dikenali backend saat login dan authorization.
- Dikenali frontend untuk menentukan dashboard dan hak akses.
- Setelah login, diarahkan ke panel PetugasTpsPanel.jsx.
- Tetap dikenali setelah halaman di-refresh.
- Tidak mengubah atau merusak role pengguna lama.
Jangan hanya menambahkan pilihan dropdown. Integrasikan sampai database, backend, autentikasi, dan routing frontend.
3. Perbaikan Form Tambah dan Edit Akun: Kecamatan, Kelurahan, dan TPS
Perbaiki form Tambah Pengguna dan Edit Pengguna pada halaman Kelola Pengguna Superadmin berdasarkan screenshot yang diberikan.
3.1 Dropdown Kecamatan Tugas dan Kelurahan Tugas
Tambahkan atau sesuaikan field:
1. Role.
2. Kecamatan Tugas.
3. Kelurahan Tugas.
Dropdown Kecamatan Tugas dan Kelurahan Tugas berlaku untuk seluruh role Petugas dan Admin yang menggunakan form pengisian akun, bukan hanya role Petugas TPS.

Ketentuan:
- Semua pilihan diambil dari database melalui backend, bukan hardcode atau mock data.
- Kecamatan menggunakan searchable dropdown.
- Kelurahan menggunakan searchable dropdown dan hanya menampilkan kelurahan yang berada di kecamatan terpilih.
- Jika kecamatan belum dipilih, dropdown kelurahan dinonaktifkan.
- Jika kecamatan diganti, pilihan kelurahan dan penugasan TPS yang tidak lagi sesuai harus di-reset.
- Jika kelurahan diganti, pilihan TPS yang tidak lagi sesuai harus di-reset.
- Saat Edit Pengguna dibuka, tampilkan nilai kecamatan dan kelurahan yang sebelumnya tersimpan.
- Terapkan field sesuai kebutuhan role dan aturan penugasan yang sudah berlaku. Jangan memaksa role yang tidak membutuhkan penugasan wilayah untuk mengisi data yang tidak relevan.
3.2 Search pada Semua Dropdown
Semua dropdown pilihan data pada form Tambah dan Edit akun Petugas/Admin harus memiliki fitur pencarian, minimal:
- Role.
- Kecamatan Tugas.
- Kelurahan Tugas.
- TPS Tanggung Jawab.
- Dropdown wilayah atau penugasan lain yang memang tersedia pada form tersebut.
Ketentuan pencarian:
- Pengguna dapat mengetik kata kunci untuk menyaring pilihan.
- Pencarian tidak membedakan huruf besar dan kecil.
- Tampilkan pesan jika hasil tidak ditemukan.
- Tetap nyaman digunakan ketika jumlah pilihan banyak.
- Gunakan searchable select/combobox yang sudah tersedia di project jika memungkinkan.
- Hindari menambahkan library baru jika komponen yang ada sudah mendukung kebutuhan ini.
- Pertahankan desain form saat ini.
3.3 Dropdown TPS Tanggung Jawab untuk Petugas TPS
Khusus ketika role Petugas TPS dipilih, tampilkan field TPS Tanggung Jawab setelah Kecamatan Tugas dan Kelurahan Tugas.

Ubah daftar TPS panjang berbentuk checkbox menjadi searchable dropdown/combobox dengan dukungan multi-select jika sistem penugasan mengizinkan lebih dari satu TPS.

Ketentuan:
- Satu Petugas TPS dapat ditugaskan ke beberapa TPS.
- Satu TPS dapat memiliki lebih dari satu petugas jika diperlukan.
- Daftar TPS harus diambil dari database.
- Jika Kecamatan Tugas dipilih, tampilkan hanya TPS di kecamatan tersebut.
- Jika Kelurahan Tugas juga dipilih, tampilkan hanya TPS yang sesuai dengan kecamatan dan kelurahan tersebut.
- Jika kelurahan belum dipilih dan aturan form mengizinkan, tampilkan TPS dari seluruh kelurahan di kecamatan terpilih.
- Jika kecamatan belum dipilih, dropdown TPS dinonaktifkan dan belum menampilkan pilihan.
- Setiap opsi menampilkan nama TPS serta informasi kecamatan/kelurahan sebagai keterangan.
- Sediakan pencarian berdasarkan nama TPS.
- Jangan menampilkan atau menyimpan TPS dari wilayah yang tidak sesuai.
- Saat Edit Pengguna dibuka, tampilkan semua TPS yang sebelumnya ditugaskan dan masih valid.
Contoh: jika Superadmin memilih Kecamatan Bubutan dan Kelurahan Tembok Dukuh, dropdown TPS Tanggung Jawab hanya menampilkan TPS yang tercatat di Kelurahan Tembok Dukuh, Kecamatan Bubutan.

Pastikan filter mengikuti relasi wilayah di database, bukan sekadar pencocokan teks di frontend.
4. Penugasan Petugas ke TPS dan Database
Periksa apakah relasi penugasan pengguna dengan TPS sudah tersedia.

Jika belum tersedia, buat tabel penghubung dengan foreign key dan constraint yang sesuai. Jangan membuat relasi duplikat atau menghapus data pengguna/TPS yang sudah ada.

Ketentuan:
- Simpan Kecamatan Tugas dan Kelurahan Tugas sesuai struktur wilayah yang berlaku di project.
- Simpan relasi satu petugas ke beberapa TPS jika multi-select didukung.
- Simpan dan tampilkan kembali penugasan saat form Edit Pengguna dibuka.
- Pastikan perubahan kecamatan/kelurahan tidak meninggalkan relasi TPS yang tidak sesuai.
- Backend wajib memvalidasi kecocokan kecamatan, kelurahan, dan TPS sebelum menyimpan.
- Jangan mengubah data master TPS atau daya tampung TPS hanya karena penugasan akun diubah.
5. Integrasi Backend FastAPI dan Database
Implementasikan atau sesuaikan proses berikut:
- Pembuatan akun Petugas TPS melalui Kelola Pengguna Superadmin yang sudah ada.
- Penyimpanan role Petugas TPS.
- Penyimpanan, pembacaan, dan pembaruan Kecamatan Tugas serta Kelurahan Tugas.
- Penyimpanan, pembacaan, dan pembaruan penugasan TPS.
- API daftar kecamatan.
- API daftar kelurahan berdasarkan kecamatan.
- API daftar TPS berdasarkan kecamatan dan kelurahan.
- API daftar TPS yang ditugaskan kepada pengguna login.
- API statistik dashboard Petugas TPS.
- API riwayat monitoring milik petugas login.
- API pengiriman dan detail laporan monitoring.
- API informasi TPS yang menjadi tanggung jawab petugas.
Gunakan pola model SQLAlchemy, schema Pydantic, service, dan routes yang konsisten dengan project. Gunakan endpoint yang sudah tersedia jika sesuai; jangan membuat endpoint duplikat.
Keamanan backend
- Ambil identitas pengguna dari JWT tervalidasi; jangan mempercayai user_id atau petugas_id dari frontend.
- Validasi role pada setiap endpoint.
- Validasi hubungan kecamatan, kelurahan, dan TPS pada backend.
- Validasi penugasan TPS pada setiap endpoint yang membutuhkan akses TPS.
- Petugas TPS hanya boleh membaca dan mengirim laporan untuk TPS yang ditugaskan kepadanya.
- Jangan mengandalkan penyembunyian menu atau proteksi route frontend sebagai pengamanan.
- Jangan izinkan Petugas TPS mengakses fungsi Admin, Superadmin, Driver, atau Petugas Pengangkut.
- Petugas TPS tidak boleh menyetujui/menolak laporan atau mengubah daya tampung maksimum TPS.
- Gunakan HTTP status yang sesuai untuk akses tidak sah.
6. Pengembangan Panel Petugas TPS yang Sudah Ada
Gunakan dan kembangkan PetugasTpsPanel.jsx yang sudah tersedia. Jangan membuat file panel/dashboard baru dengan fungsi yang sama.

Audit isi file tersebut terlebih dahulu, kemudian:
- Pertahankan komponen, layout, dan fitur yang masih sesuai.
- Hubungkan data yang masih statis/mock ke endpoint backend yang sebenarnya.
- Tambahkan atau sesuaikan menu khusus Petugas TPS.
- Perbaiki bagian yang belum berfungsi tanpa melakukan refactor besar yang tidak diperlukan.
- Jika perlu membuat komponen pendukung, gunakan nama dan struktur yang konsisten serta pastikan tidak menduplikasi komponen yang sudah ada.
Menu yang diharapkan:
A. Dashboard
Ambil data dari backend:
- Jumlah TPS yang ditugaskan.
- Jumlah monitoring yang telah dilakukan.
- Jumlah laporan menunggu verifikasi.
- Jumlah laporan disetujui.
- Jumlah laporan ditolak.
- Waktu monitoring terakhir.
Jika belum ada data, tampilkan nol atau empty state. Jangan gunakan angka dummy.
B. Monitoring Kapasitas TPS
Tampilkan TPS yang ditugaskan dan sediakan form:
- Pilihan TPS dari daftar penugasan.
- Volume sampah aktual (m³).
- Persentase kapasitas terisi.
- Foto kondisi TPS.
- Catatan kondisi TPS.
- Waktu pemantauan.
- Preview kapasitas tersedia berdasarkan daya tampung maksimum TPS.
Validasi final harus dilakukan backend. Ikuti schema modul monitoring yang sudah ada; jangan membuat sistem monitoring kedua. Setelah dikirim, status awal laporan adalah Menunggu Verifikasi.
C. Riwayat Monitoring
Tampilkan laporan milik petugas login:
- Nama TPS.
- Volume aktual.
- Persentase terisi.
- Waktu pemantauan.
- Foto.
- Status verifikasi.
- Alasan penolakan jika ada.
D. Lokasi TPS
Tampilkan peta dan informasi TPS yang ditugaskan. Gunakan koordinat asli dari database dan komponen peta project. TPS tanpa koordinat boleh muncul dalam daftar, tetapi jangan diberi marker buatan.
E. Profil Saya
Tampilkan informasi akun Petugas TPS dari backend.
7. Integrasi Modul Monitoring Kapasitas
Integrasikan dengan modul Monitoring Kapasitas TPS yang sudah ada atau sedang dikembangkan.

Alur:
1. Petugas memilih TPS yang ditugaskan.
2. Petugas mengisi volume aktual dan persentase terisi.
3. Petugas mengunggah foto dan catatan.
4. Backend memvalidasi data dan hak akses.
5. Laporan disimpan dengan status Menunggu Verifikasi.
6. Laporan tampil pada halaman verifikasi Admin/Superadmin.
7. Petugas dapat melihat status dan riwayat laporan.
Hanya laporan yang disetujui Admin/Superadmin yang boleh menjadi sumber kapasitas resmi untuk warga. Laporan menunggu atau ditolak tidak boleh mengubah kapasitas publik.

Jika modul monitoring belum tersedia, identifikasi bagian yang belum ada lalu implementasikan mengikuti struktur project. Jangan mengasumsikan tabel atau endpoint sudah ada tanpa memeriksanya.
8. Routing dan Login
- Setelah login, role Petugas TPS diarahkan ke PetugasTpsPanel.jsx melalui mekanisme routing yang sudah ada.
- Refresh halaman tidak boleh menyebabkan role salah dikenali.
- Lindungi route frontend dan endpoint backend sesuai role.
- Jangan mengubah alur login role lain.
- Pertahankan mekanisme token/interceptor yang sudah berjalan kecuali ditemukan masalah yang memang perlu diperbaiki.
9. UI dan Error Handling
- Pertahankan identitas visual SI-PETASAN.
- Buat tampilan responsif desktop dan mobile.
- Gunakan komponen dan pola styling yang sudah ada.
- Tampilkan loading, empty state, dan error state.
- Jangan menghapus data terakhir yang berhasil dimuat hanya karena satu request gagal sementara.
- Jangan gunakan mock data atau fallback statis untuk menyamarkan kegagalan API.
- Tampilkan pesan error yang jelas.
10. Batasan Perubahan
- Jangan membuat dashboard Petugas TPS baru jika PetugasTpsPanel.jsx sudah dapat dikembangkan.
- Jangan menyalin mentah menu Petugas Pengangkut.
- Jangan mengubah fitur role lain yang tidak terkait.
- Jangan menghapus fitur lama.
- Jangan membuat TPS, koordinat, statistik, atau laporan palsu.
- Jangan membuat endpoint, tabel, atau komponen duplikat.
- Jangan mengubah daya tampung maksimum TPS tanpa instruksi.
- Jangan menaruh aturan keamanan hanya di frontend.
- Hindari refactor besar di luar kebutuhan fitur.
- Jaga kompatibilitas data pengguna dan TPS yang sudah ada.
11. Pengujian Integrasi Wajib
Uji alur end-to-end:
1. Superadmin membuat akun Petugas TPS.
2. Superadmin memilih Kecamatan Tugas dan Kelurahan Tugas.
3. Dropdown TPS hanya menampilkan TPS yang sesuai dengan wilayah terpilih.
4. Fitur search pada dropdown Role, Kecamatan, Kelurahan, dan TPS berfungsi.
5. Perubahan kecamatan me-reset kelurahan dan TPS yang tidak sesuai.
6. Perubahan kelurahan me-reset TPS yang tidak sesuai.
7. Superadmin menetapkan satu atau beberapa TPS.
8. Role, wilayah, dan relasi penugasan tersimpan di MySQL.
9. Form Edit Pengguna menampilkan kembali pilihan yang tersimpan.
10. Role Petugas dan Admin lain tetap dapat menggunakan dropdown Kecamatan/Kelurahan sesuai kebutuhannya.
11. Petugas TPS berhasil login dan diarahkan ke PetugasTpsPanel.jsx.
12. Dashboard menampilkan statistik backend sesuai akun login.
13. Daftar TPS hanya menampilkan TPS yang ditugaskan.
14. Petugas mengirim laporan untuk TPS yang ditugaskan.
15. Laporan tersimpan dan muncul pada verifikasi Admin/Superadmin.
16. Petugas melihat status dan riwayat laporannya.
17. Petugas tidak dapat mengirim laporan untuk TPS yang tidak ditugaskan, termasuk melalui manipulasi request API.
18. Petugas tidak dapat mengakses endpoint khusus role lain.
19. Akun dan fitur role lama tetap berfungsi.
12. Laporan Hasil Pengerjaan
Setelah implementasi, laporkan:
- File yang dibuat dan diubah.
- Konfirmasi bahwa PetugasTpsPanel.jsx digunakan dan bagian yang dikembangkan.
- Perubahan tabel dan relasi database.
- SQL migration atau langkah perubahan database.
- Endpoint yang dibuat atau digunakan.
- Perubahan autentikasi dan authorization.
- Perubahan form Tambah/Edit akun.
- Implementasi searchable dropdown dan filter wilayah.
- Hasil pengujian integrasi.
- Masalah atau pekerjaan yang belum selesai.
Urutan pengerjaan: audit project, implementasikan database dan backend, uji API, perbaiki form Superadmin, kembangkan PetugasTpsPanel.jsx, lalu uji alur end-to-end.

Jangan menyatakan fitur selesai jika baru berupa UI atau belum terhubung ke database.