# 1. Identitas & Profil Produk

## 1.1 Identitas & Profil Produk

SIPK-TPS Surabaya adalah platform aplikasi berbasis web geospasial (Web-GIS) yang dirancang khusus untuk memetakan, memantau, menganalisis, serta mengelola kapasitas tampung sampah di seluruh Tempat Penampungan Sementara (TPS) yang tersebar di wilayah Kota Surabaya secara konsisten dan terintegrasi.

| Atribut Produk | Rincian Keterangan | 
 | ----- | ----- | 
| **Nama Sistem Resmi** | Sistem Informasi Pemetaan Kapasitas Tempat Penampungan Sementara Kota Surabaya (SIPK-TPS) | 
| **Platform Utilitas** | Aplikasi Web Responsif (Aksesibel via Desktop, Tablet, & Smartphone Browser) | 
| **Arsitektur Utama** | Geographic Information System (GIS) terintegrasi dengan Relational Spatial Database System | 
| **Pengguna Utama** | Petugas Lapangan TPS, Dinas Lingkungan Hidup (DLH) Kota Surabaya, Driver Armada Truk, dan Masyarakat Umum | 
| **Domain Fokus** | Smart Environment, Smart Governance, dan Manajemen Persampahan Perkotaan | 

## 1.2 Ringkasan Eksekutif & Visi Produk

Kota Surabaya sebagai salah satu metropolitan terbesar di Indonesia menghasilkan akumulasi volume sampah harian yang cukup masif. Pengelolaan alur pembuangan sampah dari tingkat rumah tangga menuju Tempat Penampungan Sementara (TPS) sebelum diangkut ke Tempat Pemrosesan Akhir (TPA) Benowo kerap mengalami kendala keterlambatan informasi. Hal ini sering memicu kerawanan penumpukan sampah melimpah (*overcapacity*) di beberapa titik lokasi TPS tertentu.

SIPK-TPS Surabaya hadir sebagai solusi digitalisasi tata kelola geospasial untuk menghapuskan asimetri informasi kapasitas rantai pasok sampah perkotaan. Dengan memanfaatkan pemetaan spasial interaktif, platform ini menyajikan pemantauan tingkat keterisian volume TPS secara presisi, terukur, dan berbasis data mutakhir (*updated data*). Website ini juga memberikan *reward* kepada warga yang mengumpulkan/mensetorkan sampah sesuai jenisnya, khususnya sampah anorganik/sampah yang bisa didaur ulang.

## 1.3 Pilar & Kapabilitas Utama Sistem

Platform SIPK-TPS dibangun berlandaskan 5 (lima) pilar kapabilitas fungsional utama:

1. **Visualisasi Spasial Interaktif**

   Menyajikan peta vektor Kota Surabaya yang menampilkan seluruh titik koordinat TPS secara presisi. Indikator visual berbasis gradasi warna dinamis mempermudah identifikasi status keterisian volume sampah di setiap TPS secara seketika.

2. **Manajemen & Monitoring Keterisian**

   Modul khusus bagi petugas di lapangan untuk memperbarui kondisi keterisian fisik TPS. Data yang diinput diolah langsung oleh *engine* sistem untuk menghitung estimasi batas waktu kritis penumpukan.

3. **Pengambilan Keputusan DLH (DSS)**

   Menyediakan *dashboard* analitik eksekutif bagi pimpinan DLH untuk memantau tren akumulasi sampah bulanan per kecamatan, memprioritaskan penanganan zona kritis, dan mematangkan perencanaan redistribusi armada.

4. **Layanan Transparansi Publik**

   Antarmuka publik tanpa perlu registrasi yang memungkinkan warga Surabaya mengetahui lokasi TPS terdekat, jam operasional, serta kondisi kapasitas penampungan secara terbuka.

5. **Reward untuk Warga**

   Memberikan *reward* kepada warga apabila warga tersebut mensetorkan sampah yang bisa didaur ulang dan dikumpulkan sesuai jenisnya, khususnya sampah anorganik.

## 1.4 Nilai Tambah & Kebaharuan Sistem

* **Digitalisasi Pelaporan Manual:** Mengubah pola pelaporan konvensional berbasis formulir kertas atau grup pesan instan menjadi pembaruan terstruktur berbasis koordinat GPS yang terekam otomatis di basis data geospasial.

* **Mitigasi Dini Overcapacity (Early Warning):** Sistem mampu memicu peringatan otomatis (*system alert*) ketika suatu TPS melampaui ambang batas 80% dari kapasitas maksimalnya, sehingga pemindahan sampah dapat segera dijadwalkan sebelum terjadi pencemaran lingkungan sekitar.

* **Peningkatan Efisiensi Logistik Pengangkutan:** Membantu DLH menghindari pergerakan truk sampah ke TPS yang masih kosong atau belum memenuhi kuota muat, sekaligus memfokuskan armada pada titik-titik lokasi prioritas tinggi.

* **Standardisasi Data Spasial Persampahan:** Mewujudkan basis data tunggal (*Single Source of Truth*) terkait infrastruktur TPS di Kota Surabaya yang mudah diintegrasikan dengan platform Surabaya Single Window (SSW) atau sistem Smart City Pemkot Surabaya lainnya.

* **Memberikan Reward kepada Warga:** Memberikan insentif/reward kepada warga apabila menyetorkan sampah anorganik yang terpilah.

# 2. Latar Belakang, Tujuan & Target Pengguna

## 2.1 Latar Belakang & Analisis Permasalahan

Sebagai pusat aktivitas perekonomian dan pemukiman di Jawa Timur, Kota Surabaya menghasilkan sampah mencapai 1.500 hingga 1.800 ton per hari. Seluruh akumulasi sampah dari kawasan perumahan, pasar tradisional, *commercial center*, dan area publik dikumpulkan terlebih dahulu di lebih dari ratusan titik Tempat Penampungan Sementara (TPS) sebelum diangkut menuju TPA Benowo.

Dalam skema manajemen operasional eksisting, pengelolaan rantaian persampahan ini menghadapi kendala struktural yang diuraikan pada matriks analisis masalah berikut:

| Domain Masalah | Kondisi Eksisting (Baseline) | Dampak Operasional | 
 | ----- | ----- | ----- | 
| **Pengawasan Volume** | Pemantauan visual secara manual tanpa pengukuran kubikasi yang presisi. | Keterlambatan pendeteksian TPS yang meluap (*overcapacity*), memicu bau tak sedap dan pencemaran lingkungan. | 
| **Manajemen Logistik Armada** | Jadwal pengangkutan truk sampah bersifat statis dan berbasis rute tetap tanpa melihat status *real-time* TPS. | Inefisiensi bahan bakar dan waktu; truk mendatangi TPS yang belum penuh sementara TPS kritis terlambat ditangani. | 
| **Infrastruktur Data Spasial** | Data lokasi dan atribut TPS masih terfragmentasi dalam berkas *spreadsheet* terpisah. | Kesulitan bagi pembuat kebijakan DLH dalam memetakan zona merah akumulasi sampah secara akurat. | 
| **Keterbukaan Publik** | Masyarakat kesulitan memperoleh informasi lokasi TPS aktif dan jam operasional penampungan. | Timbulnya praktik pembuangan sampah sembarangan di luar lokasi resmi TPS oleh oknum warga. | 

## 2.2 Tujuan

### Tujuan Strategis & Manajerial

* Mengoptimalkan efisiensi alokasi armada pengangkut sampah DLH Surabaya berbasis tingkat urgensi lokasi.

* Menyediakan platform *Decision Support System* (DSS) berbasis GIS untuk perencanaan infrastruktur persampahan kota.

* Meningkatkan indeks kepuasan publik terhadap kebersihan lingkungan melalui transparansi data lokasi TPS.

### Tujuan Teknis & Operasional

* Digitalisasi pembaruan volume TPS berbasis spasial dengan waktu pembaruan (*update interval*) < 5 menit.

* Mengintegrasikan mekanisme *Early Warning Alert* berbasis ambang batas keterisian 80% volume penampungan.

* Membangun basis data geospasial terpusat yang memenuhi standar interoperabilitas data Pemkot Surabaya.

* Memberikan edukasi kepada warga serta memberikan *reward* (sampah anorganik) kepada warga yang mensetorkan sampah.

## 2.3 Target Pengguna & Analisa Peran (User Personas)

| Kelompok Pengguna | Hak Akses & Otorisasi | Tugas Utama dalam Sistem | Kebutuhan Antarmuka (UI) | 
 | ----- | ----- | ----- | ----- | 
| **Super Admin / Manajemen DLH** | Full Access (*Read, Write, Update, Delete*) | Monitoring peta makro kota, evaluasi kinerja kecamatan, alokasi armada truk, kelola master data TPS. | Dashboard eksekutif desktop dengan statistik analitik & panel kontrol lengkap. | 
| **Petugas Kelurahan** | Scoped / Area Access (*Read, Write, Update* - Wilayah Kelurahan) | Memvalidasi penimbangan sampah plastik warga via QR Code/Barcode, menginput/memverifikasi poin *reward* warga, memantau kapasitas TPS di wilayah keluruhannya, serta mengelola data partisipasi warga lokal. | Dashboard/Formulir web yang responsif dengan fitur pemindai (*scanner*) QR Code/Barcode cepat, input berat sampah (kg), dan riwayat pencatatan transaksi *reward*. | 
| **Petugas Lapangan TPS** | Restricted Access (*Update* Status TPS yang Ditugaskan) | Memperbarui volume sampah harian/berkala, melampirkan foto verifikasi lapangan, melaporkan kendala fisik TPS. | Formulir web *mobile* yang ringkas, responsif, dan hemat kuota data. | 
| **Pengemudi / Driver Armada** | Operator Access (*Read* Status & *Route View*) | Melihat daftar TPS prioritas (Status Merah/Kuning) yang harus diangkut serta rute pengangkutan optimal menuju TPA. | Tampilan peta GPS *mobile* dengan indikator rute dan status penjemputan. | 
| **Masyarakat Umum / Publik** | Public Access (*Read-Only*) | Mencari lokasi TPS terdekat, mengecek status ketersediaan ruang tampung, melihat jadwal pembuangan, serta memperoleh *reward* (sampah anorganik) saat menyetorkan sampah. | Peta publik interaktif bebas login dengan pencarian lokasi otomatis. | 

# 3. Rincian Fitur Utama & Requirement

## 3.1 Rincian Fitur Utama Sistem

| Nama Fitur | Fungsionalitas Fitur | Target Pengguna & Spesifikasi Teknis | 
 | ----- | ----- | ----- | 
| **Peta Interaktif GIS (Web-GIS Map)** | Pemetaan koordinat TPS berbasis layer interaktif (Leaflet/Mapbox). Indikator visual gradasi warna (Hijau: $\le 60\%$, Kuning: $61-79\%$, Merah: $\ge 80\%$). Marker clustering otomatis untuk optimasi performa rendering. | Publik, Admin, Driver: Render geospasial responsif, support filter per kecamatan & status keterisian. | 
| **Modul Input Volume Real-Time** | Formulir input volume sampah (persentase/kubikasi $\text{m}^3$). Geofencing & Geolocation Tagging berbasis browser GPS. Upload foto bukti fisik kondisi penampungan TPS. | Petugas Lapangan: Antarmuka *mobile-friendly*, validasi jarak lokasi ($< 100\text{ m}$ dari titik TPS). | 
| **Executive Dashboard & Analytics** | Visualisasi grafik akumulasi sampah harian/mingguan. | Super Admin / DLH: Widget statistik interaktif, ringkasan per kecamatan & status darurat. | 
| **Sistem Incentive & Reward Pemilahan Sampah Anorganik (Manajemen Reward & Penimbangan Sampah)** | Pencatatan dan verifikasi bobot/jenis sampah anorganik terpisah (plastik PET, HDPE, kaleng, kertas) via validasi QR Code/Barcode oleh Petugas Kelurahan. Kalkulasi otomatis akumulasi poin *reward* berdasarkan jenis dan berat sampah. Fitur riwayat penyetoran, penukaran poin (*redeem reward*), dan cetak/tampil bukti transaksi digital bagi warga. | Warga (Publik) & Petugas Kelurahan: REST API validasi transaksi, modul generator/pemindai QR Code, pembaruan saldo poin secara *real-time*, serta penyimpanan riwayat penimbangan berbasis database relasional. | 
| **System Alert & Early Warning** | Pemicu notifikasi otomatis saat TPS menyentuh status Merah ($\ge 80\%$). Panel rincian TPS kritis yang membutuhkan pengangkutan darurat. | Admin DLH & Driver Armada: Notifikasi *real-time* pada dashboard & browser. | 
| **Rekomendasi Rute Logistik** | Pengurutan daftar penjemputan TPS berdasarkan tingkat urgensi. Visualisasi jalur pengangkutan TPS kritis menuju TPA Benowo. Memberikan jadwal rute penjemputan sampah. | Driver & Koordinator Armada: Integrasi API peta rute navigasi darat. | 

## 3.2 Functional Requirement

| ID | Requirement | 
 | ----- | ----- | 
| **FR-01** | Sistem menampilkan seluruh TPS di peta, dengan marker berbeda untuk status aktif/tidak aktif. | 
| **FR-02** | Sistem menampilkan detail TPS saat marker/baris tabel diklik. | 
| **FR-03** | Sistem menyimpan relasi *many-to-many* TPS $\leftrightarrow$ Kelurahan. | 
| **FR-04** | Sistem dapat memfilter TPS berdasarkan kecamatan, kelurahan, jenis, dan status. | 
| **FR-05** | Sistem menghitung jumlah TPS yang melayani tiap kelurahan secara otomatis dari relasi data. | 
| **FR-06** | Sistem menampilkan total daya tampung ($\text{m}^3$) TPS aktif per kecamatan/kelurahan. | 
| **FR-07** | Warga dapat mengirim laporan status TPS melalui formulir (tanpa perlu login). | 
| **FR-08** | Admin dapat login dan melakukan CRUD data TPS beserta relasi kelurahannya. | 
| **FR-09** | Sistem mencatat sumber & tanggal pembaruan terakhir untuk setiap data TPS. | 
| **FR-10** | Memberikan edukasi kepada warga serta memberikan *reward* (sampah anorganik) kepada warga yang mensetorkan sampah. | 

## 3.3 Non-Functional Requirement

| Kategori | Requirement | 
 | ----- | ----- | 
| **Kualitas Data** | Field kapasitas/container yang kosong ditampilkan sebagai "data tidak tersedia", bukan 0. | 
| **Ketertelusuran** | Setiap entri TPS mencantumkan sumber data & tanggal update. | 
| **Performa** | Peta dengan $\pm 230$ titik TPS tetap responsif (idealnya $< 2$ detik render awal). | 
| **Aksesibilitas** | Tampilan responsif untuk perangkat mobile (peta & tabel). | 
| **Keamanan** | Endpoint admin dan petugas kelurahan memerlukan autentikasi (JWT/Session); endpoint warga untuk QR Code/Reward memerlukan autentikasi login; sedangkan endpoint peta publik bersifat read-only tanpa autentikasi. | 
| **Skalabilitas** | Skema data TPS–Kelurahan mendukung penambahan kota lain tanpa perubahan skema besar. | 

# 4. Alur Sistem & User Story

## 4.1 Alur Bisnis Singkat

1. **Warga Memilah Sampah:** Organik, Anorganik, dan Residu.

2. **Kategori Anorganik:**

   * **Jika Ya:** Disetor ke Kelurahan $\rightarrow$ Petugas Cek Kebersihan $\rightarrow$ Evaluasi kebersihan (100% bersih = Reward Penuh; Kurang bersih = Keterangan & Penyesuaian Reward) $\rightarrow$ Disimpan di Kelurahan.

   * **Pengecekan Kapasitas Kelurahan (**$\ge 70\%$**):**

     * Jika **Ya**: Petugas TPS mengambil sampah ke TPS A.

     * Jika **Tidak**: Menunggu setoran berikutnya.

   * **Pengecekan Kapasitas TPS A:**

     * Jika **Penuh**: Sistem mengalihkan rute ke TPS B / TPS yang lebih longgar $\rightarrow$ Diproses di TPS B $\rightarrow$ Selesai.

     * Jika **Tidak Penuh**: Diproses di TPS A $\rightarrow$ Selesai.

3. **Kategori Non-Anorganik / Tidak Dipilah:** Diolah sendiri atau langsung dibuang ke TPS.

## 4.2 Alur Pengguna (Warga)

* **Akses Platform & Peta TPS:** Warga membuka aplikasi web SI-PETASAN SUROBOYO dan langsung diarahkan ke halaman utama yang menampilkan peta interaktif sebaran 231 TPS di Kota Surabaya.

* **Pemilahan Sampah Mandiri:** Warga memilah sampah dari rumah tangga menjadi tiga kategori utama: Organik, Anorganik (plastik PET, HDPE, kertas, kaleng), dan Residu.

* **Pencarian Lokasi Penyetoran:** Warga mencari titik penampungan terdekat di tingkat kelurahan atau melihat status kapasitas TPS melalui fitur pencarian berbasis kecamatan/kelurahan di peta.

* **Penyetoran & Pemeriksaan Kebersihan:** Warga membawa sampah anorganik yang sudah dipisah berdasarkan jenisnya ke titik penampungan Kelurahan. Petugas kelurahan akan memeriksa tingkat kebersihan sampah (target 100% bersih).

* **Perolehan QR Code & Reward:** Warga menunjukkan QR Code/Kode Anggota dari aplikasi kepada petugas untuk dipindai. Poin *reward* akan otomatis masuk ke akun warga berdasarkan berat, jenis, dan tingkat kebersihan sampah.

* **Pelaporan Kendala (Opsional):** Jika menemukan masalah di lapangan (seperti penampungan kelurahan penuh, TPS rusak, atau tumpukan sampah liar), warga dapat mengisi formulir laporan sederhana langsung melalui website.

## 4.3 User Stories

| Sebagai | Saya ingin | Agar | 
 | ----- | ----- | ----- | 
| **Warga** | Mengetahui lokasi TPS/titik penampungan kelurahan terdekat beserta status kapasitasnya | Saya tahu ke mana harus menyetorkan sampah rumah tangga. | 
| **Warga** | Memilah dan menyetorkan sampah anorganik terpisah (plastik, kertas, kaleng) sesuai jenisnya | Saya mendapatkan estimasi *reward* poin yang transparan dan akurat. | 
| **Warga** | Memiliki akun dengan QR Code digital dan riwayat penukaran poin | Saya dapat menunjukkan bukti identitas ke petugas dan menukarkan poin *reward* dengan mudah. | 
| **Warga** | Melaporkan jika TPS di sekitar saya penuh, rusak, atau terjadi penumpukan sampah | Masalah tersebut segera ditindaklanjuti oleh dinas/petugas terkait. | 
| **Petugas Kelurahan** | Memindai QR Code warga, menginput berat/jenis sampah, serta memverifikasi tingkat kebersihan sampah (100% bersih) | Poin *reward* dapat diberikan secara valid dan penampungan kelurahan tercatat dengan akurat. | 
| **Petugas Kelurahan** | Memantau ambang batas kapasitas penyimpanan kelurahan (peringatan saat mencapai 70%) | Pengangkutan sampah dari kelurahan ke TPS utama dapat segera dijadwalkan oleh petugas TPS. | 
| **Petugas TPS / Driver Armada** | Mendapatkan notifikasi pengalihan rute otomatis ketika TPS utama (TPS A) penuh | Sampah dari kelurahan dapat langsung dialihkan ke TPS alternatif yang kapasitasnya masih longgar. | 
| **Petugas Dinas Kebersihan / Super Admin** | Melihat peta makro sebaran 231 TPS, status kapasitas *real-time*, dan histori pengalihan rute | Saya bisa merencanakan rute pengangkutan dan evaluasi kinerja pengelolaan sampah secara efisien. | 
| **Perencana Kota** | Melihat kelurahan dengan rasio partisipasi warga dan kapasitas TPS yang kritis | Saya bisa memprioritaskan edukasi pemilahan atau pembangunan TPS baru di wilayah tersebut. | 

# 5. Sumber Data & Teknologi

## 5.1 Sumber Data

### Data Internal

* **Data Master TPS Kota Surabaya:** 231 entri (hasil ETL dari file internal) mencakup nama, lokasi, kecamatan, kelurahan yang dilayani, jenis TPS, jumlah container, daya tampung, dan status aktif/tidak aktif.

* **Data Master Jenis Sampah & Nilai Reward:** Katalog klasifikasi sampah anorganik (plastik PET, HDPE, kaleng, kertas, kardus) beserta bobot poin per kg dan indikator persentase kebersihan.

* **Data Transaksi Penyetoran Sampah Kelurahan:** Catatan riwayat penimbangan harian per warga, pemindaian QR Code, status verifikasi kebersihan, dan akumulasi poin *reward*.

* **Data Log Kapasitas Penampungan:** Data historis persentase keterisian tempat penyimpanan di tingkat kelurahan (skema pengangkutan saat $\ge 70\%$) serta histori pengalihan rute armada ke TPS alternatif saat TPS utama penuh.

### Data Dalam Negeri

* **SIPSN** — Sistem Informasi Pengelolaan Sampah Nasional (`sipsn.menlhk.go.id`)

* **One Map Indonesia** — BIG (`onemap.big.go.id`), layer Peta Sebaran Lokasi TPA

* **BPS Kota Surabaya** — Data jumlah penduduk per kelurahan

* **data.go.id / katalog.data.go.id** — Dataset TPS daerah lain sebagai pembanding

### Data Luar Negeri

* **World Bank** — What a Waste Global Database

* **OECD** — Environment Statistics

## 5.2 Teknologi

| Layer | Teknologi | 
 | ----- | ----- | 
| **Frontend** | React JS | 
| **Backend** | FastAPI (Python) | 
| **Database** | MySQL | 
| **Peta** | React-Leaflet | 

# 6. Ruang Lingkup & Batasan

## 6.1 In-scope (MVP)

* Peta interaktif sebaran 231 TPS & titik penampungan kelurahan (aktif & tidak aktif).

* Halaman detail TPS (kapasitas, status keterisian, jam operasional, dan filter per kecamatan).

* Sistem Reward & Pemilahan Sampah Anorganik: Input berat/jenis sampah anorganik dan akumulasi poin *reward* warga.

* Modul Validator Petugas Kelurahan: Fitur *scanner* QR Code/Barcode untuk verifikasi identitas warga dan pengecekan tingkat kebersihan sampah (100% bersih).

* Logika Agregasi & Pengalihan Rute TPS: Peringatan ambang batas penyimpanan kelurahan ($\ge 70\%$) serta pengalihan otomatis ke TPS alternatif saat TPS utama penuh.

* Formulir laporan warga (TPS penuh/rusak) dan Dashboard Admin/Petugas.

## 6.2 Out-of-scope (Tahap Ini)

* **Integrasi Poin ke E-Wallet Otomatis:** Penukaran poin *reward* masih dalam bentuk akumulasi poin/voucher digital internal (belum *direct transfer* ke GoPay/OVO/ShopeePay).

* **Sensor IoT Otomatis di TPS:** Pengisian data persentase kapasitas TPS masih berbasis input manual/konfirmasi oleh Petugas Lapangan/Kelurahan via *web system* (belum memakai sensor jarak ultrasonik IoT).

* Perhitungan rasio kapasitas per kapita menggunakan data penduduk BPS secara riil (fase pengembangan lanjutan).

## 6.3 Batasan Data

* **Data Master TPS:** Data lokasi dan profil 231 TPS merupakan *snapshot* satu waktu (hasil ekstraksi ETL dari file internal, bukan API *real-time* terintegrasi langsung dengan server DLH).

* **Kelengkapan Atribut TPS:** Sebagian entri TPS pada sumber data asli tidak memiliki informasi kapasitas, jumlah container, atau dimensi fisik yang lengkap, sehingga digunakan estimasi berbasis rata-rata jenis TPS.

* **Data Eksternal:** Data sekunder dari SIPSN, BIG, dan BPS berfungsi sebagai acuan pembanding dan pemetaan wilayah, bukan sebagai database transaksional harian.

* **Data Transaksi & Reward Sampah:** Pencatatan bobot sampah dan persentase kebersihan (100% bersih) bergantung penuh pada validasi manual (input/scan) oleh Petugas Kelurahan di lapangan.

* **Data Kapasitas TPS & Kelurahan:** Estimasi keterisian (misal: kelurahan mencapai $\ge 70\%$ atau TPS A penuh) diperbarui berdasarkan log transaksi pengangkutan dan input status petugas, belum terintegrasi dengan sensor berat/volume fisik secara otomatis.

# 7. Validation & Testing Method

| Metode | Tujuan | Kapan Dilakukan | 
 | ----- | ----- | ----- | 
| **Validasi Kualitas Data** | Memastikan data TPS hasil impor konsisten, bebas anomali, dan skema poin *reward* jenis sampah valid. | Sebelum data dimuat ke database. | 
| **Cross-check Data Eksternal** | Mendeteksi selisih signifikan dengan data resmi nasional (SIPSN/BIG). | Saat integrasi data eksternal. | 
| **Expert/Stakeholder Review** | Memastikan skema data, alur *reward*, dan aturan pengalihan rute TPS sesuai kebutuhan dinas/kelurahan. | Setelah PRD & desain awal disusun. | 
| **Black-box & Integration Testing** | Memastikan fungsi spesifik berjalan tepat: validasi QR Code, kalkulasi poin *reward*, pemicu batas 70% kelurahan, dan pengalihan rute TPS. | Saat pengembangan backend/frontend fitur transaksional selesai. | 
| **Usability Testing (SUS)** | Mengukur kemudahan warga memakai peta & fitur *reward*, serta kemudahan petugas dalam scan QR Code. | Setelah prototipe/MVP jadi. | 
| **User Acceptance Testing (UAT)** | Memvalidasi seluruh *functional requirement* terpenuhi bersama perwakilan warga & petugas. | Tahap akhir sebelum *deployment*. | 

**Kriteria Keberhasilan:** Data bebas duplikasi/anomali tak terjelaskan; selisih data internal vs. eksternal dalam batas wajar; skor SUS $\ge 68$; seluruh Functional Requirement lolos UAT.

# 8. Timeline & Risiko Pengembangan

## 8.1 Usulan Timeline (16 Minggu / 1 Semester)

| Fase | Minggu | Aktivitas Utama | 
 | ----- | ----- | ----- | 
| **1. Analisis & Perancangan** | 1–3 | Penyusunan Story, PRD, pembersihan & strukturisasi data TPS, desain skema database. | 
| **2. Desain UI/UX** | 4–5 | Wireframe & mockup peta, halaman detail TPS, panel admin. | 
| **3. Pengembangan Backend** | 6–9 | Setup FastAPI, endpoint REST API, koneksi MySQL, autentikasi admin. | 
| **4. Pengembangan Frontend** | 8–11 | Implementasi React, integrasi peta interaktif, formulir laporan warga. | 
| **5. Integrasi & Testing** | 12–13 | Integrasi frontend-backend, Usability Testing (SUS), perbaikan bug. | 
| **6. UAT & Deployment** | 14–15 | User Acceptance Testing, deployment ke staging/hosting. | 
| **7. Dokumentasi & Presentasi** | 16 | Penyusunan laporan akhir & persiapan presentasi/demo. | 

## 8.2 Risiko Pengembangan

| Risiko | Dampak | Mitigasi | 
 | ----- | ----- | ----- | 
| **Data kapasitas TPS tidak lengkap di sumber asli** | Analisis kapasitas per wilayah kurang akurat. | Tampilkan status "data tidak tersedia" secara eksplisit, bukan asumsi nilai default. | 
| **Data eksternal (SIPSN/BIG) sulit diakses/berubah format** | Proses *cross-check* data tertunda. | Siapkan data eksternal lebih awal sebagai file statis cadangan (bukan bergantung API *real-time*). | 
| **Keterlambatan integrasi frontend-backend** | Waktu testing berkurang. | Mulai integrasi bertahap sejak minggu ke-8, bukan di akhir. | 
| **Akses ke pihak dinas terkait terbatas untuk stakeholder review** | Validasi kebutuhan kurang mendalam. | Gunakan dosen pembimbing/asumsi berbasis literatur sebagai *proxy reviewer*. | 
| **Cakupan fitur terlalu luas untuk waktu satu semester** | Risiko fitur tidak selesai tepat waktu. | Prioritaskan fitur *in-scope* MVP; fitur lain dicatat sebagai pengembangan lanjutan. | 
