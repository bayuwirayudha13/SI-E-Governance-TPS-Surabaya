# Implementasi Backend Fitur Jadwal Pengambilan Sampah

## SI-PETASAN SUROBOYO

> **Ruang lingkup:** backend saja. Frontend jadwal sudah tersedia.
> Kembangkan modul jadwal yang sudah ada; jangan membuat modul atau
> tabel jadwal baru.

## 1. Konteks proyek

Stack proyek: - FastAPI - SQLAlchemy - Pydantic - MySQL - JWT
Authentication

Struktur modul yang sudah tersedia: - `models/jadwal.py` -
`schemas/jadwal_schema.py` - `routes/jadwal_routes.py` -
`services/jadwal_service.py`

File pendukung yang perlu diperiksa: - `models/users.py` -
`models/warga.py` - `models/petugas_tps_assignment.py` -
`services/petugas_tps_assignment_service.py` - `auth/dependencies.py` -
`core/database.py` - `main.py`

Role backend untuk pengguna yang di frontend disebut **Petugas TPS**
adalah `petugas`. Jangan membuat role baru atau mengubah penamaan role
yang sudah ada.

## 2. Tabel yang sudah ada

Tabel MySQL: `jadwal_pengambilan`

Kolom yang sudah diketahui: - `id` - `hari` - `waktu_mulai` -
`waktu_selesai` - `area` - `petugas` - `tipe` - `tps_id`

Contoh tipe jadwal yang sudah digunakan: - `RUTIN` - `BESAR` - `LIBUR`

Terdapat tujuh data jadwal lama. **Pertahankan seluruh data tersebut.**
Jangan truncate, drop, reset, atau membuat tabel jadwal pengganti.

## 3. Langkah wajib sebelum coding

1.  Baca seluruh isi file model, schema, route, dan service jadwal.
2.  Periksa model `users`, `warga`, dan assignment petugas.
3.  Periksa dependency autentikasi dan cara proyek menentukan role
    pengguna.
4.  Periksa `main.py` untuk memastikan router sudah diregistrasikan.
5.  Periksa konfigurasi database aktif dan pastikan apakah aplikasi
    benar-benar menggunakan MySQL `sipk_tps_baru` atau database lain.
    Jangan berasumsi berdasarkan keberadaan file `.db`.
6.  Periksa tipe kolom dan primary key aktual pada database, termasuk
    tipe `users.id`.
7.  Periksa pemanggilan endpoint dan bentuk data yang diharapkan
    frontend jika file frontend tersedia.

Sebelum mengubah file, sampaikan ringkasan kondisi sekarang, rencana
perubahan, risiko migrasi, dan file yang akan disentuh. Jangan berhenti
hanya pada analisis; lanjutkan implementasi setelah pemeriksaan selesai
dan aman.

## 4. Perubahan data jadwal

Kembangkan tabel `jadwal_pengambilan` yang sudah ada dengan informasi
wilayah: - `kecamatan` - `kelurahan`

Tambahkan `petugas_id` sebagai relasi ke `users.id` **hanya setelah**
memastikan tipe kolom, relasi, dan aturan penghapusan yang tepat.

Ketentuan: - Pertahankan semua kolom lama, termasuk `petugas` dan
`tps_id`. - Pertahankan kompatibilitas data lama dan frontend. - Untuk
jadwal baru yang memiliki petugas, simpan `petugas_id` dan sinkronkan
kolom `petugas` dengan `users.nama_lengkap` bila field tersebut memang
nama resmi pada model aktual. - Jangan mengubah jadwal lama menjadi data
palsu atau menebak kecamatan/kelurahannya. - Jadwal lama yang wilayahnya
belum diketahui harus ditangani secara aman dan tidak boleh bocor ke
daftar warga. - Jadwal `LIBUR` boleh tidak memiliki petugas. -
Pertahankan tipe `RUTIN`, `BESAR`, dan `LIBUR` sesuai implementasi yang
sudah ada.

Buat migrasi yang aman, dapat dijalankan dengan jelas, dan tidak
menghapus data. Periksa apakah proyek menggunakan Alembic atau pola
migrasi manual sebelum memilih pendekatan. Jangan menjalankan migrasi
destruktif.

## 5. Sumber dan validasi petugas

Petugas pengangkut yang dipilih untuk jadwal menggunakan: - Tabel:
`users` - Role backend: `petugas` - Nama: periksa field nama aktual;
gunakan `nama_lengkap` jika memang tersedia - Status aktif: gunakan
field status aktif yang benar-benar ada pada model - Wilayah tugas:
gunakan `wilayah_kecamatan` dan `wilayah_kelurahan` jika keduanya
merupakan field aktual dan menjadi sumber penugasan yang berlaku.

Saat superadmin memilih kecamatan dan kelurahan: - API hanya
mengembalikan akun dengan role `petugas`. - Hanya akun aktif yang
ditampilkan. - Kecamatan dan kelurahan petugas harus cocok dengan
wilayah jadwal. - Jangan membuat daftar nama petugas statis. - Jangan
menganggap seluruh akun `petugas` otomatis memenuhi syarat. - Jangan
menganggap `petugas_tps_assignment` adalah sumber wilayah pengangkut
tanpa memeriksa makna dan relasi aktualnya. - Validasi petugas yang sama
di backend saat POST dan PUT. Jangan hanya mengandalkan filter dropdown
frontend.

Jika data penugasan aktual tidak cukup untuk menentukan petugas
pengangkut, jangan mengarang aturan. Laporkan kekurangan struktur dan
gunakan sumber wilayah yang sudah benar-benar tersedia.

## 6. Akses dan perilaku endpoint

Pertahankan prefix lama `/api/jadwal/` dan kompatibilitas endpoint yang
sudah digunakan frontend.

Endpoint yang diharapkan:

  ---------------------------------------------------------------------------------
  Method            Endpoint                    Akses             Perilaku
  ----------------- --------------------------- ----------------- -----------------
  GET               `/api/jadwal/`              Warga             Jadwal
                                                                  berdasarkan
                                                                  wilayah akun
                                                                  warga

  GET               `/api/jadwal/admin`         Superadmin        Seluruh jadwal
                                                                  untuk pengelolaan

  POST              `/api/jadwal/`              Superadmin        Membuat jadwal

  PUT               `/api/jadwal/{jadwal_id}`   Superadmin        Memperbarui
                                                                  jadwal

  DELETE            `/api/jadwal/{jadwal_id}`   Superadmin        Menghapus jadwal

  GET               `/api/jadwal/petugas`       Superadmin        Daftar petugas
                                                                  sesuai kecamatan
                                                                  dan kelurahan
  ---------------------------------------------------------------------------------

Sesuaikan urutan deklarasi route agar path statis seperti `/admin` dan
`/petugas` tidak tertangkap oleh route parameter `/{jadwal_id}`.

### GET warga

-   Identifikasi warga dari JWT menggunakan dependency autentikasi
    proyek yang benar.
-   Ambil kecamatan dan kelurahan dari profil warga di database, bukan
    dari query/body yang dikirim frontend.
-   Filter berdasarkan **kecamatan dan kelurahan sekaligus**.
-   Jangan mengirim jadwal wilayah lain.
-   Jangan mengirim jadwal lama yang wilayahnya NULL kepada warga.
-   Jika profil warga belum memiliki wilayah lengkap, kembalikan respons
    aman dan jelas; jangan fallback ke seluruh jadwal.
-   Pertahankan field lama yang diperlukan frontend dan tambahkan field
    wilayah.

### GET admin

-   Hanya superadmin.
-   Mengembalikan seluruh jadwal, termasuk data lama yang wilayahnya
    belum terisi, agar superadmin dapat meninjaunya.

### POST dan PUT

-   Hanya superadmin.
-   Validasi hari dan tipe sesuai konvensi proyek.
-   Validasi kecamatan dan kelurahan.
-   Validasi `waktu_selesai` lebih besar daripada `waktu_mulai` untuk
    jadwal yang memiliki rentang waktu.
-   Pengecualian jadwal `LIBUR` pukul `00:00:00` sampai `00:00:00` boleh
    dipertahankan sesuai data dan aturan yang sudah digunakan.
-   Jika `petugas_id` diisi, pastikan akun ditemukan, role `petugas`,
    aktif, dan wilayahnya cocok.
-   Jika tipe `LIBUR`, petugas boleh NULL.
-   Jangan mempercayai nama petugas yang dikirim frontend; ambil dari
    database.

### DELETE

-   Hanya superadmin.
-   Tangani ID yang tidak ditemukan dengan HTTP 404.
-   Jangan menghapus data terkait secara tidak sengaja.

### GET petugas

-   Hanya superadmin.
-   Memerlukan kecamatan dan kelurahan sebagai filter.
-   Mengembalikan ID dan nama petugas yang memenuhi syarat.
-   Gunakan nama field request/response yang konsisten dan
    dokumentasikan.

## 7. Keamanan

-   Gunakan dependency autentikasi dan pemeriksaan role yang sudah
    tersedia.
-   Jangan membuat sistem JWT atau dependency role baru jika yang lama
    dapat digunakan.
-   Pastikan warga tidak dapat POST, PUT, atau DELETE.
-   Pastikan role `admin`, `petugas`, dan role lain tidak otomatis
    memiliki akses superadmin.
-   Jangan menerima wilayah warga dari parameter request sebagai dasar
    otorisasi.
-   Gunakan query parameter hanya untuk kebutuhan pencarian petugas oleh
    superadmin.
-   Tangani data NULL dan akun yang tidak aktif secara aman.

## 8. Kompatibilitas frontend

Frontend sudah tersedia. Jangan mengubah desain atau komponen frontend.

Sebelum mengubah response: - Cari pemakaian `/api/jadwal/` pada frontend
jika source frontend tersedia. - Pertahankan nama field lama: `id`,
`hari`, `waktu_mulai`, `waktu_selesai`, `area`, `petugas`, `tipe`, dan
`tps_id`. - Tambahkan `kecamatan`, `kelurahan`, dan `petugas_id` bila
dibutuhkan. - Pertahankan format waktu yang diharapkan frontend, umumnya
`HH:MM` atau format yang sudah dipakai saat ini. - Jangan mengganti
bentuk response tanpa alasan dan tanpa memeriksa konsumennya.

## 9. Pengujian wajib

Uji dengan database pengembangan dan akun yang sesuai:

1.  Superadmin dapat melihat seluruh jadwal.
2.  Superadmin dapat membuat jadwal dengan wilayah dan petugas valid.
3.  Superadmin dapat memperbarui jadwal.
4.  Superadmin dapat menghapus jadwal.
5.  Daftar petugas hanya berisi role `petugas` yang aktif dan wilayahnya
    cocok.
6.  Petugas dari kecamatan atau kelurahan lain ditolak saat POST dan
    PUT.
7.  Warga hanya melihat jadwal kecamatan dan kelurahannya sendiri.
8.  Warga tidak dapat memanipulasi query wilayah untuk melihat wilayah
    lain.
9.  Warga tidak dapat mengakses operasi pengelolaan.
10. Admin biasa dan petugas tidak dapat mengelola jadwal.
11. Jadwal `LIBUR` dapat disimpan dan ditampilkan dengan benar.
12. Jadwal lama tetap ada setelah migrasi.
13. Jadwal lama yang wilayahnya NULL tidak tampil kepada warga.
14. Router dan dokumentasi Swagger berjalan.
15. Response endpoint tetap kompatibel dengan frontend.

Jika pengujian membutuhkan data, gunakan data uji terpisah dan jangan
mengubah data produksi.

## 10. File yang mungkin diubah

Batasi perubahan pada file yang memang diperlukan, kemungkinan: -
`models/jadwal.py` - `schemas/jadwal_schema.py` -
`routes/jadwal_routes.py` - `services/jadwal_service.py` - `main.py`
hanya jika router belum terdaftar - satu file migrasi baru sesuai pola
proyek

Jangan mengubah file autentikasi, model pengguna, atau frontend kecuali
ditemukan kebutuhan nyata. Jika perlu, jelaskan alasannya terlebih
dahulu.

## 11. Laporan akhir

Setelah implementasi, berikan: 1. Ringkasan kondisi awal dan perubahan.
2. Daftar file yang dibuat/diubah. 3. SQL/migrasi dan cara
menjalankannya. 4. Struktur kolom dan relasi akhir. 5. Daftar endpoint,
akses, parameter, dan contoh response. 6. Hasil pengujian yang
benar-benar dijalankan. 7. Catatan data lama yang wilayahnya belum
terisi. 8. Langkah verifikasi melalui Swagger dan frontend.

Jangan mengklaim pengujian berhasil jika belum dijalankan. Jangan
menjalankan migrasi pada database yang tidak dapat dipastikan sebagai
database pengembangan.
