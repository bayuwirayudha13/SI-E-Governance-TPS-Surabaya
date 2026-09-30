import beritaPulauKelapaImg from '../assets/images/berita_pulau_kelapa.jpg';
import beritaPandawaraImg from '../assets/images/berita_pandawara.jpg';
import beritaPirolisisImg from '../assets/images/berita_pirolisis.jpg';
import beritaKaliTebuImg from '../assets/images/berita_kali_tebu.jpg';
import beritaPenertibanImg from '../assets/images/berita_penertiban.jpg';
import beritaPilahAsnImg from '../assets/images/berita_pilah_asn.jpg';

export const tpsList = [
	['TPA Benowo', 'Benowo', 'Romokalisari', 82, 'Merah', -7.2185, 112.6042],
	['TPS Wonokromo', 'Wonokromo', 'Darmo', 74, 'Kuning', -7.3012, 112.7388],
	['TPS Bratang', 'Gubeng', 'Baratajaya', 55, 'Hijau', -7.2924, 112.7568],
	['TPS Keputih', 'Sukolilo', 'Keputih', 45, 'Hijau', -7.2917, 112.8021],
	['TPS Tambaksari', 'Tambaksari', 'Ploso', 68, 'Kuning', -7.2541, 112.7684],
	['TPS Tegalsari', 'Tegalsari', 'Kedungdoro', 88, 'Merah', -7.2689, 112.7381],
	['TPS Kenjeran', 'Kenjeran', 'Bulak', 52, 'Hijau', -7.2294, 112.7915],
	['TPS Rungkut Lor', 'Rungkut', 'Rungkut Kidul', 38, 'Hijau', -7.3245, 112.7758],
	['PD. Benowo Indah', 'Pakal', 'Babat Jerawat', 64, 'Kuning', -7.2345, 112.6321],
	['TPS Kota Lama (Old Town)', 'Pabean Cantikan', 'Krembangan Utara', 48, 'Hijau', -7.2372, 112.7383],
	['TPS Gebang Putih', 'Sukolilo', 'Gebang Putih', 55, 'Hijau', -7.287, 112.788],
	['TPS Pakuwon City', 'Mulyorejo', 'Kalisari', 42, 'Hijau', -7.273, 112.8055],
	['Bank Sampah Pesapen', 'Krembangan', 'Perak Timur', 35, 'Hijau', -7.239, 112.729],
	['TPS Darmo Permai', 'Wonokromo', 'Sawunggaling', 58, 'Hijau', -7.288, 112.736]
].map(([nama, kecamatan, kelurahan, kapasitasPersen, status, lat, lng], index) => ({
	id: index + 1,
	nama,
	kecamatan,
	kelurahan,
	kapasitasPersen,
	kapasitasM3: 50 + index * 5,
	status,
	statusText: status === 'Merah' ? 'Kritis' : status === 'Kuning' ? 'Waspada' : 'Aman',
	jamOperasional: '06:00 - 20:00 WIB',
	koordinat: { x: 20 + index * 5, y: 30 + index * 3 },
	terakhirUpdate: `${index + 2} menit lalu`,
	petugas: 'Petugas DLH Surabaya',
	lat,
	lng
}));

export const newsArticles = [
	['Tempat Pembuangan Sampah Sementara di Pulau Kelapa Direlokasi', 'light', beritaPulauKelapaImg, 'Infrastruktur TPS', '22 September 2026'],
	['Pandawara Group Ajak Masyarakat Peduli Lingkungan', 'dark', beritaPandawaraImg, 'Aksi Komunitas', '20 September 2026'],
	['Brida Surabaya Kembangkan Pirolisis Sampah Jadi Bahan Bakar', 'light', beritaPirolisisImg, 'Inovasi & Riset', '18 September 2026'],
	['Satgas Lestari Angkat 1,18 Ton Sampah di Kali Tebu Surabaya', 'dark', beritaKaliTebuImg, 'Operasional DLH', '16 September 2026'],
	['Wali Kota Eri Tertibkan Pengolahan Sampah Ilegal di Keputih Surabaya', 'light', beritaPenertibanImg, 'Kebijakan & Regulasi', '14 September 2026'],
	['Wali Kota Eri Instruksikan ASN Surabaya Pilah Sampah dari Rumah', 'dark', beritaPilahAsnImg, 'Sosialisasi & Edukasi', '12 September 2026']
].map(([title, theme, image, category, date], index) => ({
	id: index + 1,
	title,
	theme,
	image,
	category,
	date,
	summary: 'Informasi terbaru tentang pengelolaan sampah dan kepedulian lingkungan di Kota Surabaya.',
	content: 'Baca informasi lengkap mengenai kegiatan dan kebijakan pengelolaan sampah di Surabaya.'
}));

export const wasteTypesData = [
	{
		id: 'organik',
		title: 'Sampah Organik',
		badgeColor: 'organik',
		description: 'Sampah yang mudah terurai dan dapat diolah menjadi kompos.',
		items: ['Sisa makanan', 'Kulit buah', 'Daun kering', 'Sisa sayuran'],
		buttonText: 'Pelajari Pengolahan',
		actionType: 'guide'
	},
	{
		id: 'anorganik',
		title: 'Sampah Anorganik',
		badgeColor: 'anorganik',
		description: 'Sampah bernilai ekonomi yang dapat didaur ulang.',
		items: ['Botol plastik', 'Kaleng bekas', 'Kardus bersih', 'Kaca'],
		buttonText: 'Dapatkan Reward',
		actionType: 'reward'
	},
	{
		id: 'residu',
		title: 'Sampah Residu',
		badgeColor: 'residu',
		description: 'Sampah yang sulit didaur ulang dan perlu penanganan khusus.',
		items: ['Styrofoam', 'Popok bayi', 'Karet', 'Puntung rokok'],
		buttonText: 'Panduan Penanganan',
		actionType: 'residu'
	}
];

export const rewardCatalog = [
	{ jenis: 'Plastik Botol PET (Bersih)', poinPerKg: 3500, rupiah: 3500 },
	{ jenis: 'Plastik Tutup Botol / HDPE', poinPerKg: 4000, rupiah: 4000 },
	{ jenis: 'Kardus & Box Karton Kering', poinPerKg: 2000, rupiah: 2000 },
	{ jenis: 'Kertas Arsip / HVS Putih', poinPerKg: 2800, rupiah: 2800 },
	{ jenis: 'Kaleng Minuman / Seng', poinPerKg: 4500, rupiah: 4500 },
	{ jenis: 'Aluminium & Logam Ringan', poinPerKg: 12000, rupiah: 12000 },
	{ jenis: 'Botol Kaca / Beling Utuh', poinPerKg: 1000, rupiah: 1000 }
];
