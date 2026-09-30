-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 28, 2026 at 09:39 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sipk_tps_baru`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int UNSIGNED NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','petugas') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'petugas',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password_hash`, `nama`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin_dlh', '$2b$12$placeholderhashgantidenganbcrypt', 'Admin DLH Surabaya', 'super_admin', '2026-09-15 03:18:33', '2026-09-15 03:18:33');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_pengangkutan`
--

CREATE TABLE `jadwal_pengangkutan` (
  `id` int UNSIGNED NOT NULL,
  `tps_id` int UNSIGNED NOT NULL,
  `hari` set('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jam` time NOT NULL,
  `keterangan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal_pengangkutan`
--

INSERT INTO `jadwal_pengangkutan` (`id`, `tps_id`, `hari`, `jam`, `keterangan`) VALUES
(1, 1, 'Senin,Rabu,Jumat', '07:00:00', NULL),
(2, 2, 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu', '06:30:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kecamatan`
--

CREATE TABLE `kecamatan` (
  `id` int NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelurahan`
--

CREATE TABLE `kelurahan` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wilayah_kota` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kelurahan`
--

INSERT INTO `kelurahan` (`id`, `nama`, `kecamatan`, `wilayah_kota`) VALUES
(1, 'Tembok Dukuh', 'Bubutan', 'Surabaya Pusat'),
(2, 'Petemon', 'Bubutan', 'Surabaya Pusat'),
(3, 'Gundih', 'Bubutan', 'Surabaya Pusat'),
(4, 'Bubutan', 'Bubutan', 'Surabaya Pusat'),
(5, 'Simokerto', 'Simokerto', 'Surabaya Pusat'),
(6, 'Sidotopo', 'Simokerto', 'Surabaya Pusat'),
(7, 'Sidodadi', 'Simokerto', 'Surabaya Pusat');

-- --------------------------------------------------------

--
-- Table structure for table `laporan_warga`
--

CREATE TABLE `laporan_warga` (
  `id` int UNSIGNED NOT NULL,
  `tps_id` int UNSIGNED NOT NULL,
  `warga_id` int UNSIGNED DEFAULT NULL,
  `jenis_laporan` enum('Penuh','Rusak','Tidak Terawat','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `foto_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lapor` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status_tindak_lanjut` enum('Belum Ditindaklanjuti','Diproses','Selesai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Belum Ditindaklanjuti',
  `ditindaklanjuti_oleh` int UNSIGNED DEFAULT NULL,
  `catatan_admin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `petugas_pengangkut`
--

CREATE TABLE `petugas_pengangkut` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_hp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wilayah_tugas` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Aktif','Nonaktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `petugas_pengangkut`
--

INSERT INTO `petugas_pengangkut` (`id`, `nama`, `no_hp`, `username`, `password_hash`, `wilayah_tugas`, `status`, `created_at`) VALUES
(1, 'Slamet Riyadi', '081234567890', 'petugas_slamet', '$2b$12$placeholderhashgantidenganbcrypt', 'Bubutan', 'Aktif', '2026-09-15 03:18:33');

-- --------------------------------------------------------

--
-- Table structure for table `setoran_sampah`
--

CREATE TABLE `setoran_sampah` (
  `id` int UNSIGNED NOT NULL,
  `warga_id` int UNSIGNED NOT NULL,
  `tps_id` int UNSIGNED DEFAULT NULL,
  `jenis_sampah` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Botol Plastik (PET)',
  `perkiraan_berat_kg` decimal(6,2) DEFAULT NULL,
  `poin_diperoleh` int UNSIGNED DEFAULT NULL,
  `foto_bukti_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metode_setor` enum('Antar ke TPS','Dijemput Petugas') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Antar ke TPS',
  `alamat_penjemputan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `petugas_id` int UNSIGNED DEFAULT NULL,
  `qr_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Menunggu Penjemputan','Sudah Divalidasi','Dibatalkan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Menunggu Penjemputan',
  `waktu_setor` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `waktu_validasi` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `setoran_sampah`
--

INSERT INTO `setoran_sampah` (`id`, `warga_id`, `tps_id`, `jenis_sampah`, `perkiraan_berat_kg`, `poin_diperoleh`, `foto_bukti_url`, `metode_setor`, `alamat_penjemputan`, `petugas_id`, `qr_code`, `status`, `waktu_setor`, `waktu_validasi`) VALUES
(1, 1, NULL, 'Botol Plastik (PET)', '2.50', NULL, NULL, 'Dijemput Petugas', 'Jl. Contoh No. 10, Kel. Tembok Dukuh', NULL, 'QR-TEST-0001', 'Menunggu Penjemputan', '2026-09-15 03:18:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tps`
--

CREATE TABLE `tps` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lama` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lokasi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kecamatan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wilayah_kota` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `jenis_tps` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jumlah_container` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `daya_tampung_m3` decimal(8,2) DEFAULT NULL,
  `status` enum('Aktif','Tidak Aktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif',
  `sumber_data` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Data internal DLH',
  `tanggal_update` date DEFAULT NULL,
  `catatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tps`
--

INSERT INTO `tps` (`id`, `nama`, `nama_lama`, `lokasi`, `kecamatan`, `wilayah_kota`, `latitude`, `longitude`, `jenis_tps`, `jumlah_container`, `daya_tampung_m3`, `status`, `sumber_data`, `tanggal_update`, `catatan`, `created_at`, `updated_at`) VALUES
(1, 'TEMBOK DK', NULL, 'Jl. Demak Kalibutuh', 'Bubutan', 'Surabaya Pusat', NULL, NULL, 'Compactor', '50 (0,66 M3)', '28.00', 'Aktif', 'Data internal DLH', '2026-01-01', NULL, '2026-09-15 03:18:33', '2026-09-15 03:18:33'),
(2, 'PRINGADI', NULL, 'Jl. Pringadi', 'Bubutan', 'Surabaya Pusat', NULL, NULL, 'TPS Biasa', '1 (14M3)', '14.00', 'Aktif', 'Data internal DLH', '2026-01-01', NULL, '2026-09-15 03:18:33', '2026-09-15 03:18:33'),
(3, 'PENGHELA', NULL, 'Jl. Penghela', 'Bubutan', 'Surabaya Pusat', NULL, NULL, 'TPS Biasa', '2 (14M3)', '28.00', 'Aktif', 'Data internal DLH', '2026-01-01', NULL, '2026-09-15 03:18:33', '2026-09-15 03:18:33'),
(4, 'PS. SIMOLAWANG', NULL, 'Jl. Simolawang', 'Simokerto', 'Surabaya Pusat', NULL, NULL, 'TPS Biasa', '1 Dump Truck', '14.00', 'Aktif', 'Data internal DLH', '2026-01-01', NULL, '2026-09-15 03:18:33', '2026-09-15 03:18:33'),
(5, 'PECINDILAN', NULL, 'Jl. Pecindilan', 'Simokerto', 'Surabaya Pusat', NULL, NULL, 'Compactor', '1 (14M3)', '14.00', 'Tidak Aktif', 'Data internal DLH', '2026-01-01', NULL, '2026-09-15 03:18:33', '2026-09-15 03:18:33');

-- --------------------------------------------------------

--
-- Table structure for table `tps_kelurahan`
--

CREATE TABLE `tps_kelurahan` (
  `tps_id` int UNSIGNED NOT NULL,
  `kelurahan_id` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tps_kelurahan`
--

INSERT INTO `tps_kelurahan` (`tps_id`, `kelurahan_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(1, 2),
(1, 3),
(2, 4),
(3, 4),
(4, 5),
(4, 6),
(4, 7),
(5, 7);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashed_password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lengkap` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','petugas','driver') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warga`
--

CREATE TABLE `warga` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_hp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_poin` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warga`
--

INSERT INTO `warga` (`id`, `nama`, `email`, `password_hash`, `no_hp`, `total_poin`, `created_at`) VALUES
(1, 'Contoh Warga', 'warga.contoh@example.com', '$2b$12$placeholderhashgantidenganbcrypt', '081200000000', 0, '2026-09-15 03:18:33');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `jadwal_pengangkutan`
--
ALTER TABLE `jadwal_pengangkutan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tps_id` (`tps_id`);

--
-- Indexes for table `kecamatan`
--
ALTER TABLE `kecamatan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`),
  ADD UNIQUE KEY `kode` (`kode`),
  ADD KEY `ix_kecamatan_id` (`id`);

--
-- Indexes for table `kelurahan`
--
ALTER TABLE `kelurahan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kelurahan_kecamatan` (`nama`,`kecamatan`),
  ADD KEY `idx_kelurahan_kecamatan` (`kecamatan`);

--
-- Indexes for table `laporan_warga`
--
ALTER TABLE `laporan_warga`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tps_id` (`tps_id`),
  ADD KEY `warga_id` (`warga_id`),
  ADD KEY `ditindaklanjuti_oleh` (`ditindaklanjuti_oleh`),
  ADD KEY `idx_laporan_status` (`status_tindak_lanjut`);

--
-- Indexes for table `petugas_pengangkut`
--
ALTER TABLE `petugas_pengangkut`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `setoran_sampah`
--
ALTER TABLE `setoran_sampah`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_code` (`qr_code`),
  ADD KEY `tps_id` (`tps_id`),
  ADD KEY `idx_setoran_warga` (`warga_id`),
  ADD KEY `idx_setoran_waktu` (`waktu_setor`),
  ADD KEY `idx_setoran_petugas` (`petugas_id`),
  ADD KEY `idx_setoran_status` (`status`);

--
-- Indexes for table `tps`
--
ALTER TABLE `tps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tps_kecamatan` (`kecamatan`),
  ADD KEY `idx_tps_status` (`status`);

--
-- Indexes for table `tps_kelurahan`
--
ALTER TABLE `tps_kelurahan`
  ADD PRIMARY KEY (`tps_id`,`kelurahan_id`),
  ADD KEY `kelurahan_id` (`kelurahan_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_username` (`username`),
  ADD UNIQUE KEY `ix_users_email` (`email`),
  ADD KEY `ix_users_id` (`id`);

--
-- Indexes for table `warga`
--
ALTER TABLE `warga`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jadwal_pengangkutan`
--
ALTER TABLE `jadwal_pengangkutan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `kecamatan`
--
ALTER TABLE `kecamatan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kelurahan`
--
ALTER TABLE `kelurahan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `laporan_warga`
--
ALTER TABLE `laporan_warga`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `petugas_pengangkut`
--
ALTER TABLE `petugas_pengangkut`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `setoran_sampah`
--
ALTER TABLE `setoran_sampah`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tps`
--
ALTER TABLE `tps`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `warga`
--
ALTER TABLE `warga`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `jadwal_pengangkutan`
--
ALTER TABLE `jadwal_pengangkutan`
  ADD CONSTRAINT `jadwal_pengangkutan_ibfk_1` FOREIGN KEY (`tps_id`) REFERENCES `tps` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `laporan_warga`
--
ALTER TABLE `laporan_warga`
  ADD CONSTRAINT `laporan_warga_ibfk_1` FOREIGN KEY (`tps_id`) REFERENCES `tps` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `laporan_warga_ibfk_2` FOREIGN KEY (`warga_id`) REFERENCES `warga` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `laporan_warga_ibfk_3` FOREIGN KEY (`ditindaklanjuti_oleh`) REFERENCES `admin` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `setoran_sampah`
--
ALTER TABLE `setoran_sampah`
  ADD CONSTRAINT `setoran_sampah_ibfk_1` FOREIGN KEY (`warga_id`) REFERENCES `warga` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `setoran_sampah_ibfk_2` FOREIGN KEY (`tps_id`) REFERENCES `tps` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `setoran_sampah_ibfk_3` FOREIGN KEY (`petugas_id`) REFERENCES `petugas_pengangkut` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tps_kelurahan`
--
ALTER TABLE `tps_kelurahan`
  ADD CONSTRAINT `tps_kelurahan_ibfk_1` FOREIGN KEY (`tps_id`) REFERENCES `tps` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tps_kelurahan_ibfk_2` FOREIGN KEY (`kelurahan_id`) REFERENCES `kelurahan` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
