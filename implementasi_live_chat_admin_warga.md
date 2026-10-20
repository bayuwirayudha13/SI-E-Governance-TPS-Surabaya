# Instruksi AI Agent --- Implementasi Fitur Live Chat Admin--Warga

## 1. Tujuan

Implementasikan fitur **live chat Customer Service** pada aplikasi
SampahPintar / SI-PETASAN SUROBOYO. Fitur hanya digunakan oleh dua role:

-   **Warga**: memulai percakapan dengan admin, mengirim pesan, dan
    melihat balasan serta riwayat percakapan sendiri.
-   **Admin**: melihat daftar percakapan warga, membuka percakapan, dan
    membalas pesan.

Gunakan stack dan pola proyek yang sudah ada. Jangan membangun ulang
autentikasi, mengganti teknologi utama, atau merusak endpoint lain.

## 2. Konteks proyek yang sudah diketahui

Backend menggunakan FastAPI, SQLAlchemy, dan MySQL. Frontend menggunakan
React + Vite.

Struktur backend yang relevan:

``` text
backend/
├── auth/
│   ├── otp.py
│   └── routes.py
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   └── timezone.py
├── models/
│   ├── chat.py
│   ├── users.py
│   └── warga.py
├── routes/
│   ├── admin_routes.py
│   └── ...
├── schemas/
├── services/
└── main.py
```

### Identitas dan autentikasi yang sudah ada

-   Model `Warga` berada di `models/warga.py`, tabel `warga`, dengan
    kolom `id`, `nama`, `email`, dan informasi warga lainnya.
-   Model `User` berada di `models/users.py`, tabel `users`. Role yang
    ada antara lain `admin`, `superadmin`, `petugas`, dan `driver`.
-   Login admin menggunakan tabel `users`.
-   Login warga menggunakan tabel `warga`.
-   JWT yang dibuat untuk kedua jenis akun menyimpan `sub` sebagai email
    dan `role` sebagai role akun. Warga menggunakan `role="warga"`.
-   `main.py` mempunyai fungsi `get_current_user(token, db)` yang
    menerima token sebagai parameter biasa. Jangan menganggap fungsi
    tersebut otomatis mengambil token dari header `Authorization`.
-   `auth/routes.py` saat ini mengimpor `Warga`, `create_access_token`,
    dan `ACCESS_TOKEN_EXPIRE_MINUTES` dari `main.py`. Hindari menambah
    circular import. Jangan melakukan refactor autentikasi secara luas
    jika tidak diperlukan.

### Model chat saat ini

File `models/chat.py` sebelumnya memiliki model `ChatMessage` dengan
kolom:

-   `id`
-   `sender_id`
-   `sender_name`
-   `receiver_id`
-   `message`
-   `timestamp`

`sender_id` dan `receiver_id` saat ini ambigu karena ID dapat berasal
dari tabel `users` atau `warga`. Desain baru harus menghindari
ambiguitas ini.

### Penting: periksa proyek nyata terlebih dahulu

Sebelum mengedit:

1.  Baca `main.py`, `core/database.py`, `core/security.py`,
    `models/chat.py`, `models/users.py`, `models/warga.py`, dan file
    frontend terkait autentikasi serta navigasi.
2.  Periksa `requirements.txt` dan `package.json`.
3.  Pastikan import path yang benar berdasarkan struktur nyata. Ada kode
    yang menggunakan `core.database`, sedangkan konteks sebelumnya
    pernah menunjukkan `app.core.database`. Ikuti pola yang benar-benar
    digunakan saat aplikasi berjalan.
4.  Periksa skema tabel `chat_messages` yang sudah ada dan apakah tabel
    tersebut memiliki data. Jangan menghapus atau merusak riwayat pesan
    yang ada.
5.  Berikan ringkasan singkat temuan dan rencana implementasi sebelum
    membuat perubahan besar. Lanjutkan implementasi setelah itu tanpa
    meminta konfirmasi untuk setiap file.

## 3. Kebutuhan fungsional

### Fitur warga

-   Hanya warga yang sudah terautentikasi yang boleh mengakses chat.
-   Warga dapat membuat atau membuka percakapan miliknya.
-   Warga dapat mengirim dan menerima pesan secara realtime.
-   Warga dapat melihat riwayat pesan setelah halaman dimuat ulang.
-   Warga tidak boleh melihat, membuka, atau mengirim pesan ke
    percakapan milik warga lain.
-   Tampilkan status koneksi, indikator memuat, dan pesan error yang
    mudah dipahami.
-   Cegah pengiriman pesan kosong atau hanya berisi spasi.

### Fitur admin

-   Hanya role `admin` dan `superadmin` yang boleh mengakses
    halaman/endpoint admin chat.
-   Admin dapat melihat daftar percakapan warga.
-   Admin dapat membuka percakapan dan melihat riwayat pesan.
-   Admin dapat membalas pesan secara realtime.
-   Admin dapat melihat nama/email warga dan waktu pesan.
-   Admin tidak boleh mengakses endpoint admin chat hanya dengan
    menyembunyikan halaman frontend; backend harus tetap memeriksa role.
-   Jika ada beberapa admin yang online, pesan baru harus dikirim ke
    klien admin yang relevan tanpa menduplikasi pesan di database.

### Perilaku percakapan

-   Secara default, satu warga memiliki satu percakapan Customer Service
    aktif yang dapat digunakan kembali. Jika proyek sudah memiliki
    aturan percakapan yang berbeda, pertahankan aturan proyek dan
    dokumentasikan.
-   Sediakan status percakapan minimal `open` dan `closed` jika cocok
    dengan implementasi proyek.
-   Jika percakapan berstatus `closed`, tentukan perilaku yang
    konsisten: warga dapat membuka percakapan baru atau membuka kembali
    percakapan sesuai keputusan implementasi. Dokumentasikan pilihan
    tersebut.
-   Simpan setiap pesan ke database sebelum mengirim konfirmasi bahwa
    pesan berhasil dikirim.
-   Urutkan riwayat pesan secara kronologis.
-   Waktu menggunakan helper `get_wib_now` yang sudah ada jika
    kompatibel dengan pola timestamp database proyek.

## 4. Desain data

Evaluasi desain berikut terhadap skema database nyata sebelum
menerapkannya.

### Tabel `chat_conversations`

Kolom yang disarankan:

-   `id`: primary key.
-   `warga_id`: foreign key ke `warga.id`, wajib.
-   `status`: `open` atau `closed`, default `open`.
-   `created_at`: waktu dibuat.
-   `updated_at`: waktu aktivitas terakhir.

Tambahkan indeks pada `warga_id` dan kolom lain yang benar-benar
diperlukan untuk query.

### Tabel `chat_messages`

Kolom yang disarankan:

-   `id`: primary key.
-   `conversation_id`: foreign key ke `chat_conversations.id`, wajib.
-   `sender_id`: ID pengirim dalam tabel sesuai role pengirim.
-   `sender_role`: `warga`, `admin`, atau `superadmin`.
-   `sender_name`: nama yang ditampilkan saat pesan dikirim.
-   `message`: isi pesan.
-   `timestamp`: waktu pengiriman.

`sender_id` tidak boleh dipakai sendirian untuk menentukan tabel
identitas pengirim. Gunakan `sender_role` dan identitas percakapan untuk
menginterpretasikannya. Jangan menerima `sender_id`, `sender_role`, atau
`sender_name` dari payload klien sebagai sumber kebenaran; ambil
identitas pengirim dari JWT dan database.

### Migrasi dan kompatibilitas

-   Jangan menganggap `Base.metadata.create_all()` otomatis mengubah
    tabel lama. SQLAlchemy `create_all()` tidak menambahkan kolom baru
    ke tabel yang sudah ada.
-   Periksa apakah proyek menggunakan Alembic atau sistem migrasi lain.
    Jika ada, gunakan sistem tersebut.
-   Jika belum ada sistem migrasi, buat skrip migrasi SQL/Python yang
    aman dan jelaskan cara menjalankannya.
-   Jangan menghapus tabel `chat_messages` atau data lama.
-   Jika tabel lama berisi data, buat strategi migrasi yang
    mempertahankan pesan lama. Jika pemetaan `receiver_id` lama ambigu,
    jangan menebak pemilik percakapan; laporkan ambiguitas dan pilih
    migrasi yang aman.
-   Jangan menjalankan migrasi destruktif secara otomatis.
-   Jangan mengganti database atau `DATABASE_URL` yang digunakan proyek.

## 5. Autentikasi dan otorisasi

Implementasikan helper/dependency khusus chat yang dapat memvalidasi JWT
untuk WebSocket dan endpoint HTTP.

Persyaratan:

1.  Validasi signature, algoritma, dan masa berlaku JWT menggunakan
    konfigurasi token yang sudah digunakan proyek.
2.  Baca `sub` dan `role` dari token.
3.  Untuk `role="warga"`, cari akun berdasarkan email di tabel `warga`.
4.  Untuk `role="admin"` atau `role="superadmin"`, cari akun berdasarkan
    email di tabel `users` dan pastikan akun valid/aktif sesuai model
    dan aturan proyek.
5.  Jangan mempercayai `id`, `role`, atau nama yang dikirim frontend.
6.  Batasi warga hanya ke percakapan dengan `warga_id` miliknya.
7.  Batasi endpoint daftar seluruh percakapan hanya untuk
    admin/superadmin.
8.  Tolak token yang tidak valid, kedaluwarsa, atau role yang tidak
    diizinkan.
9.  Jangan menggunakan `demo-token-*` sebagai mekanisme autentikasi
    produksi. Jika demo token memang diperlukan oleh lingkungan
    pengembangan, pastikan tidak dapat dipakai di lingkungan produksi
    dan jangan menjadikannya jalan pintas untuk akses chat.
10. Jangan mengirim token lewat query string untuk endpoint HTTP biasa.
    Untuk WebSocket, pilih mekanisme yang kompatibel dengan browser dan
    frontend yang ada. Jika token terpaksa dikirim melalui query
    parameter karena keterbatasan browser WebSocket, jelaskan risikonya,
    jangan mencatat token ke log, dan tetap validasi token secara ketat.
    Utamakan mekanisme yang lebih aman jika infrastruktur proyek
    mendukungnya.

Hindari circular import. Bila perlu, pindahkan helper autentikasi/token
ke modul inti yang tidak mengimpor `main.py`, tetapi pertahankan
kompatibilitas endpoint lama dan lakukan perubahan sekecil mungkin.

## 6. Backend API yang diharapkan

Sesuaikan prefix dan konvensi endpoint dengan proyek nyata. Endpoint
berikut adalah target perilaku, bukan keharusan menggunakan nama persis
jika proyek sudah punya konvensi berbeda.

### Warga

-   `POST /api/chat/conversations` --- buat atau ambil percakapan aktif
    milik warga.
-   `GET /api/chat/conversations/me` --- ambil percakapan milik warga
    yang login.
-   `GET /api/chat/conversations/{conversation_id}/messages` --- ambil
    riwayat pesan, hanya jika percakapan milik warga tersebut.
-   WebSocket `/api/chat/ws/{conversation_id}` --- koneksi realtime
    untuk percakapan warga.

### Admin

-   `GET /api/admin/chat/conversations` --- daftar percakapan dengan
    pagination dan ringkasan pesan terakhir.
-   `GET /api/admin/chat/conversations/{conversation_id}/messages` ---
    riwayat pesan.
-   WebSocket admin atau mekanisme notifikasi realtime yang setara untuk
    menerima pesan baru dari warga.
-   Endpoint untuk menutup/membuka percakapan hanya jika fitur status
    tersebut diimplementasikan.

### Validasi API

-   Validasi panjang pesan dengan batas yang wajar, misalnya maksimum
    2.000 karakter.
-   Tolak pesan kosong/whitespace.
-   Gunakan respons HTTP dan pesan error yang konsisten.
-   Tambahkan pagination pada daftar percakapan dan riwayat pesan agar
    tidak memuat semua data sekaligus.
-   Jangan menampilkan detail exception internal atau rahasia
    konfigurasi ke klien.
-   Tambahkan dokumentasi endpoint melalui schema FastAPI jika
    memungkinkan.

## 7. WebSocket realtime

-   Gunakan WebSocket FastAPI dan pengelola koneksi yang sesuai dengan
    arsitektur aplikasi.
-   Autentikasi koneksi saat handshake/sebelum menerima pesan.
-   Validasi hak akses terhadap `conversation_id` pada setiap koneksi.
-   Untuk pesan yang masuk, validasi payload dan simpan ke database.
-   Setelah commit database berhasil, kirim pesan yang tersimpan ke
    klien yang berhak menerimanya.
-   Sertakan sekurangnya `id`, `conversation_id`, `sender_id`,
    `sender_role`, `sender_name`, `message`, dan `timestamp` pada event
    pesan.
-   Gunakan format event JSON yang terdokumentasi, misalnya:
    -   `type: "message"` untuk pesan baru.
    -   `type: "error"` untuk error yang aman ditampilkan.
    -   `type: "connected"` untuk konfirmasi koneksi.
-   Tangani disconnect dengan baik dan bersihkan koneksi dari connection
    manager.
-   Jangan mengandalkan daftar koneksi dalam memori sebagai penyimpanan
    pesan. Database tetap menjadi sumber riwayat.
-   Jelaskan keterbatasan connection manager in-memory jika aplikasi
    dijalankan dengan beberapa worker/server. Jangan mengklaim realtime
    lintas banyak worker berjalan tanpa mekanisme pub/sub bersama.
-   Jangan membuat koneksi database SQLAlchemy yang sama dipakai secara
    bersamaan oleh banyak task WebSocket. Gunakan session per
    operasi/task sesuai pola proyek.
-   Jangan menyiarkan pesan warga ke semua warga. Pesan hanya dikirim ke
    warga pemilik percakapan dan admin yang berwenang.
-   Pastikan pesan yang disimpan tidak dikirim ganda karena event
    koneksi atau pengiriman ulang.

## 8. Frontend React

Periksa pola routing, layout, API client, dan penyimpanan token yang
sudah ada. Integrasikan fitur ke UI yang sudah ada; jangan membuat
aplikasi frontend kedua.

### UI warga

-   Tambahkan menu/halaman Customer Service atau Chat.
-   Tampilkan riwayat percakapan, bubble pesan yang membedakan pesan
    sendiri dan admin, waktu pesan, kolom input, dan tombol kirim.
-   Muat riwayat dari REST API, lalu sambungkan WebSocket.
-   Tangani status connecting/connected/disconnected dan percobaan
    reconnect secara terbatas dengan jeda bertahap.
-   Hindari membuat pesan duplikat ketika pesan yang baru dikirim
    diterima kembali dari WebSocket.
-   Auto-scroll ke pesan terbaru tanpa menghalangi pengguna membaca
    pesan lama.
-   Nonaktifkan tombol kirim ketika isi kosong atau koneksi belum siap,
    atau sediakan antrean lokal hanya jika dirancang dengan aman.

### UI admin

-   Tambahkan halaman/panel chat admin sesuai pola dashboard admin yang
    ada.
-   Tampilkan daftar percakapan, nama warga, status, pesan terakhir, dan
    waktu aktivitas.
-   Saat admin memilih percakapan, muat riwayat dan hubungkan realtime.
-   Sediakan indikator pesan baru dan status percakapan jika sesuai
    dengan desain proyek.
-   Pastikan komponen memutus WebSocket saat unmount atau ketika
    berpindah percakapan.

### Frontend dan keamanan

-   Gunakan API client dan mekanisme token yang sudah ada.
-   Jangan menanam secret di frontend.
-   Jangan mengirim identitas pengirim sebagai otoritas; backend
    menentukan identitas dari token.
-   Jangan menaruh URL backend secara hard-coded jika proyek sudah
    memakai konfigurasi environment.
-   Pastikan tampilan tetap nyaman di desktop dan ponsel.
-   Jangan merombak halaman lain yang tidak berkaitan dengan fitur chat.

## 9. Pengujian yang wajib dilakukan

Tambahkan pengujian otomatis jika proyek sudah mempunyai framework test.
Jika belum, buat langkah uji manual yang konkret.

Uji sekurangnya:

1.  Warga terautentikasi dapat membuat/membuka percakapan sendiri.
2.  Warga dapat mengirim pesan dan pesan tersimpan ke database.
3.  Pesan baru diterima realtime oleh pihak yang berwenang.
4.  Riwayat tetap tersedia setelah halaman dimuat ulang.
5.  Warga A tidak dapat membaca atau mengirim pesan ke percakapan warga
    B, termasuk dengan mengganti ID di URL.
6.  Pengguna tanpa token ditolak.
7.  Token kedaluwarsa atau token rusak ditolak.
8.  Role `petugas` dan `driver` tidak dapat mengakses fitur admin chat.
9.  Admin dan superadmin dapat melihat daftar percakapan sesuai aturan.
10. Pesan kosong, terlalu panjang, atau payload yang tidak valid
    ditolak.
11. Disconnect/reconnect tidak membuat pesan duplikat.
12. Endpoint lama seperti login, `/api/auth/me`, dan fitur lain tetap
    berjalan.
13. Skema database lama dan data lama tidak hilang selama migrasi.
14. CORS dan koneksi WebSocket bekerja pada konfigurasi lokal yang
    digunakan proyek.

Jangan mengklaim pengujian berhasil jika belum benar-benar dijalankan.
Laporkan perintah dan hasil aktualnya.

## 10. Batasan perubahan

-   Jangan mengubah skema tabel `users` atau `warga` tanpa kebutuhan
    yang jelas.
-   Jangan menambahkan role `warga` ke enum tabel `users`; warga memang
    disimpan pada tabel terpisah.
-   Jangan mengubah login/OTP/reset password hanya untuk membuat chat
    bekerja, kecuali ditemukan bug yang benar-benar menghalangi dan
    perubahan dapat dilakukan secara aman.
-   Jangan menghapus endpoint, model, data, atau file yang sudah ada.
-   Jangan menambahkan dependency baru jika kemampuan bawaan stack sudah
    cukup.
-   Jangan membuat klaim bahwa aplikasi multi-worker sudah didukung jika
    koneksi hanya disimpan dalam memori proses.
-   Ikuti gaya kode dan struktur folder proyek, serta buat perubahan
    yang mudah ditinjau melalui Git diff.

## 11. Urutan pengerjaan

Kerjakan secara berurutan:

1.  Inspeksi proyek dan rangkum struktur autentikasi, konfigurasi
    database, frontend routing, dan skema chat saat ini.
2.  Rancang migrasi database yang aman.
3.  Implementasikan model dan migrasi.
4.  Implementasikan autentikasi/dependency chat tanpa circular import.
5.  Implementasikan REST API untuk percakapan dan riwayat.
6.  Implementasikan WebSocket untuk warga dan admin.
7.  Integrasikan UI React warga dan admin.
8.  Jalankan pemeriksaan syntax/lint/test yang tersedia.
9.  Lakukan pengujian endpoint dan alur chat.
10. Tinjau `git diff` untuk memastikan tidak ada perubahan tak terkait
    atau rahasia yang ikut ter-commit.

Jika salah satu asumsi ternyata tidak cocok dengan kode nyata,
**utamakan implementasi proyek yang ditemukan**, sesuaikan desain, dan
jelaskan alasannya. Jangan memaksakan contoh endpoint atau model di
dokumen ini jika bertentangan dengan struktur yang berjalan.

## 12. Format laporan akhir dari agent

Setelah selesai, berikan laporan dalam bahasa Indonesia yang mencakup:

-   Ringkasan fitur yang berhasil dibuat.
-   Daftar file baru dan file yang diubah.
-   Endpoint REST dan WebSocket yang tersedia.
-   Perubahan/migrasi database serta cara menjalankannya.
-   Perubahan konfigurasi environment, jika ada, tanpa menampilkan
    secret.
-   Cara menjalankan backend dan frontend.
-   Cara menguji chat sebagai warga dan admin.
-   Hasil test/lint yang benar-benar dijalankan.
-   Keterbatasan yang masih ada, terutama terkait multi-worker,
    reconnect, dan notifikasi admin.
-   Risiko atau langkah manual yang masih perlu dilakukan.

**Prioritas utama:** keamanan akses antarpercakapan, kompatibilitas
dengan autentikasi yang sudah ada, penyimpanan riwayat yang aman, dan
implementasi yang tidak merusak fitur lama.
