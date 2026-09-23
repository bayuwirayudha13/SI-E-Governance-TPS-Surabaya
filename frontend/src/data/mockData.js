import tpaBenowoImg from '../assets/images/tpa_benowo.jpg';
import bankSampahImg from '../assets/images/bank_sampah.jpg';
import beritaPulauKelapaImg from '../assets/images/berita_pulau_kelapa.jpg';
import beritaPandawaraImg from '../assets/images/berita_pandawara.jpg';
import beritaPirolisisImg from '../assets/images/berita_pirolisis.jpg';
import beritaKaliTebuImg from '../assets/images/berita_kali_tebu.jpg';
import beritaPenertibanImg from '../assets/images/berita_penertiban.jpg';
import beritaPilahAsnImg from '../assets/images/berita_pilah_asn.jpg';

export const tpsList = [
  {
    id: 1,
    nama: "TPA Benowo",
    kecamatan: "Benowo",
    kelurahan: "Romokalisari",
    kapasitasPersen: 82,
    kapasitasM3: 450,
    status: "Merah",
    statusText: "Kritis (Prioritas Pengangkutan)",
    jamOperasional: "24 Jam",
    koordinat: { x: 18, y: 35 },
    terakhirUpdate: "10 menit lalu",
    petugas: "Armada DLH Shift Pagi",
    lat: -7.2185,
    lng: 112.6042
  },
  {
    id: 2,
    nama: "TPS Wonokromo",
    kecamatan: "Wonokromo",
    kelurahan: "Darmo",
    kapasitasPersen: 74,
    kapasitasM3: 85,
    status: "Kuning",
    statusText: "Waspada (Mendekati Batas)",
    jamOperasional: "06:00 - 18:00 WIB",
    koordinat: { x: 52, y: 64 },
    terakhirUpdate: "25 menit lalu",
    petugas: "Bambang Sudirjo",
    lat: -7.3012,
    lng: 112.7388
  },
  {
    id: 3,
    nama: "TPS Bratang",
    kecamatan: "Gubeng",
    kelurahan: "Baratajaya",
    kapasitasPersen: 55,
    kapasitasM3: 60,
    status: "Hijau",
    statusText: "Aman (Tersedia Daya Tampung)",
    jamOperasional: "06:00 - 20:00 WIB",
    koordinat: { x: 62, y: 58 },
    terakhirUpdate: "15 menit lalu",
    petugas: "Hadi Santoso",
    lat: -7.2924,
    lng: 112.7568
  },
  {
    id: 4,
    nama: "TPS Keputih",
    kecamatan: "Sukolilo",
    kelurahan: "Keputih",
    kapasitasPersen: 45,
    kapasitasM3: 70,
    status: "Hijau",
    statusText: "Aman (Tersedia Daya Tampung)",
    jamOperasional: "06:00 - 19:00 WIB",
    koordinat: { x: 78, y: 50 },
    terakhirUpdate: "40 menit lalu",
    petugas: "Rahmat Hidayat",
    lat: -7.2917,
    lng: 112.8021
  },
  {
    id: 5,
    nama: "TPS Tambaksari",
    kecamatan: "Tambaksari",
    kelurahan: "Ploso",
    kapasitasPersen: 68,
    kapasitasM3: 90,
    status: "Kuning",
    statusText: "Waspada",
    jamOperasional: "05:30 - 18:30 WIB",
    koordinat: { x: 65, y: 38 },
    terakhirUpdate: "5 menit lalu",
    petugas: "Slamet Riyadi",
    lat: -7.2541,
    lng: 112.7684
  },
  {
    id: 6,
    nama: "TPS Tegalsari",
    kecamatan: "Tegalsari",
    kelurahan: "Kedungdoro",
    kapasitasPersen: 88,
    kapasitasM3: 50,
    status: "Merah",
    statusText: "Kritis (Peringatan Dini Overcapacity)",
    jamOperasional: "06:00 - 17:00 WIB",
    koordinat: { x: 48, y: 46 },
    terakhirUpdate: "2 menit lalu",
    petugas: "Dwi Wicaksono",
    lat: -7.2689,
    lng: 112.7381
  },
  {
    id: 7,
    nama: "TPS Kenjeran",
    kecamatan: "Kenjeran",
    kelurahan: "Bulak",
    kapasitasPersen: 52,
    kapasitasM3: 65,
    status: "Hijau",
    statusText: "Aman",
    jamOperasional: "06:00 - 20:00 WIB",
    koordinat: { x: 75, y: 25 },
    terakhirUpdate: "35 menit lalu",
    petugas: "Ahmad Fauzi",
    lat: -7.2294,
    lng: 112.7915
  },
  {
    id: 8,
    nama: "TPS Rungkut Lor",
    kecamatan: "Rungkut",
    kelurahan: "Rungkut Kidul",
    kapasitasPersen: 38,
    kapasitasM3: 55,
    status: "Hijau",
    statusText: "Aman",
    jamOperasional: "06:00 - 18:00 WIB",
    koordinat: { x: 68, y: 76 },
    terakhirUpdate: "18 menit lalu",
    petugas: "Nur Cahyo",
    lat: -7.3245,
    lng: 112.7758
  }
];

export const newsArticles = [
  {
    id: 1,
    title: "Tempat Pembuangan Sampah Sementara di Pulau Kelapa Direlokasi",
    theme: "light",
    image: beritaPulauKelapaImg,
    category: "Infrastruktur TPS",
    date: "22 September 2026",
    summary: "Penanganan sampah sementara dipindahkan untuk menjaga kelestarian lingkungan pesisir dan kenyamanan warga sekitar, sejalan dengan program penataan kawasan ramah lingkungan Pemkot Surabaya.",
    content: `Dinas Lingkungan Hidup (DLH) Kota Surabaya bersama pihak kecamatan resmi memindahkan lokasi Tempat Pembuangan Sampah Sementara (TPS) di wilayah pesisir ke titik terpadu yang lebih representatif dan higienis.

Langkah ini diambil demi memitigasi dampak bau dan pencemaran laut, serta memastikan sampah terkelola secara tertutup sebelum armada truk DLH membawanya menuju TPA Benowo. Warga menyambut antusias relokasi ini karena area pesisir kini tertata rapi dan bersih.`
  },
  {
    id: 2,
    title: "Pandawara Group Ajak Masyarakat Peduli Lingkungan",
    theme: "dark",
    image: beritaPandawaraImg,
    category: "Aksi Komunitas",
    date: "20 September 2026",
    summary: "Bersama relawan dan warga Surabaya menyusuri aliran sungai untuk membersihkan timbunan sampah plastik yang menumpuk demi mengembalikan kelancaran debit air perkotaan.",
    content: `Aksi kolaborasi bersih-bersih lingkungan digelar bersama komunitas pemuda Pandawara Group di salah satu sungai Surabaya. Ratusan relawan pemuda bahu membahu mengangkat sampah plastik kemasan, karung, dan residu rumah tangga.

Kegiatan ini sekaligus mengkampanyekan pentingnya pemilahan sampah anorganik sejak dari rumah tangga melalui platform SI-PETASAN agar tidak bermuara ke saluran air dan merusak ekosistem bahari Surabaya.`
  },
  {
    id: 3,
    title: "Brida Surabaya Kembangkan pirolisis sampah jadi bahan bakar",
    theme: "light",
    image: beritaPirolisisImg,
    category: "Inovasi & Riset",
    date: "18 September 2026",
    summary: "Riset inovatif pemanfaatan sampah anorganik plastik menjadi bahan bakar alternatif untuk operasional armada kota demi mewujudkan ekonomi sirkular ramah lingkungan.",
    content: `Badan Riset dan Inovasi Daerah (Brida) Kota Surabaya berhasil menguji coba mesin pirolisis generasi terbaru yang mengkonversi limbah plastik non-daur ulang menjadi bahan bakar cair setara solar dan bensin.

Teknologi ini mampu mengolah hingga ratusan kilogram plastik per hari. Hasil pengujian menunjukkan nilai kalori yang optimal dan emisi yang memenuhi standar ramah lingkungan, siap diserap untuk armada pendukung dinas kebersihan.`
  },
  {
    id: 4,
    title: "Satgas Lestari Angkat 1,18 Ton Sampah di Kali Tebu Surabaya",
    theme: "dark",
    image: beritaKaliTebuImg,
    category: "Operasional DLH",
    date: "16 September 2026",
    summary: "Satgas kebersihan DLH Surabaya gerak cepat mengevakuasi timbunan sampah domestik dan enceng gondok sepanjang aliran Kali Tebu guna mengantisipasi luapan air saat musim penghujan.",
    content: `Sebanyak 35 personel Satgas Kebersihan Saluran Air DLH Kota Surabaya diterjunkan di Kali Tebu. Dengan peralatan jaring apung dan perahu karet, tim berhasil mengangkut 1,18 ton material sampah domestik.

Pemkot Surabaya terus mengimbau warga agar memanfaatkan titik TPS resmi terdekat yang telah terdata dalam sistem SI-PETASAN serta tidak membuang sampah ke aliran sungai demi kenyamanan bersama.`
  },
  {
    id: 5,
    title: "Wali Kota Eri Tertibkan Pengolahan Sampah Ilegal di Keputih Surabaya",
    theme: "light",
    image: beritaPenertibanImg,
    category: "Kebijakan & Regulasi",
    date: "14 September 2026",
    summary: "Pemkot Surabaya bertindak tegas menertibkan TPS liar guna memastikan pengelolaan sampah sesuai regulasi tata ruang dan menjaga kesehatan lingkungan permukiman.",
    content: `Wali Kota Eri Cahyadi memimpin langsung inspeksi lapangan di kawasan Keputih untuk menertibkan aktivitas penampungan dan pembakaran sampah ilegal. Lokasi tersebut kini dialihkan ke skema pengumpulan Bank Sampah terdaftar.

"Surabaya telah memiliki sistem pemetaan TPS resmi berbasis geospasial. Jangan ada lagi TPS liar yang membakar sampah dan mengganggu pernapasan warga. Warga cukup pilah dari rumah dan setor ke kelurahan untuk mendapatkan reward," tegas Wali Kota Eri.`
  },
  {
    id: 6,
    title: "Wali Kota Eri Instruksikan ASN Surabaya Pilah Sampah dari Rumah",
    theme: "dark",
    image: beritaPilahAsnImg,
    category: "Sosialisasi & Edukasi",
    date: "12 September 2026",
    summary: "Aparatur Sipil Negara Pemkot Surabaya diminta menjadi pelopor gaya hidup minim sampah dengan memilah organik, anorganik, dan residu sebelum disetor ke Bank Sampah kelurahan.",
    content: `Wali Kota Eri menerbitkan surat edaran wajib pilah sampah bagi seluruh ASN dan pegawai di lingkungan Pemkot Surabaya. ASN diwajibkan memiliki catatan aktif setor sampah anorganik terpilah di Bank Sampah unit kelurahan masing-masing.

Gerakan ini terbukti mendorong peningkatan volume sampah bernilai ekonomi yang terkumpul dan menurunkan beban volume sampah harian yang dibawa ke TPA Benowo hingga 15% pada bulan pertama implementasi.`
  }
];

export const wasteTypesData = [
  {
    id: "organik",
    title: "Sampah Organik",
    badgeColor: "organik",
    description: "Sampah yang mudah terurai secara alami dan dapat diolah menjadi kompos berkualitas tinggi atau pakan maggot BSF.",
    items: [
      "Sisa makanan",
      "Kulit buah",
      "Daun kering",
      "Sisa sayuran",
      "Cangkang telur",
      "Kertas kotor"
    ],
    buttonText: "Pelajari Pengolahan",
    actionType: "guide"
  },
  {
    id: "anorganik",
    title: "Sampah Anorganik",
    badgeColor: "anorganik",
    description: "Sampah bernilai ekonomi yang dapat didaur ulang. Setor dalam keadaan bersih dan kering ke Kelurahan untuk raih reward!",
    items: [
      "Botol Plastik (PET/HDPE)",
      "Kaleng Bekas",
      "Kardus Bersih",
      "Kaca & Beling",
      "Plastik Bersih",
      "Aluminium Foil"
    ],
    buttonText: "Dapatkan Reward",
    actionType: "reward"
  },
  {
    id: "residu",
    title: "Sampah Residu",
    badgeColor: "residu",
    description: "Sampah yang sulit atau tidak dapat didaur ulang secara konvensional dan harus dibuang ke TPS untuk penanganan khusus.",
    items: [
      "Styrofoam",
      "Popok Bayi",
      "Pembalut Bekas",
      "Karet & Ban Bekas",
      "Puntung Rokok",
      "Obat Kadaluwarsa (B3)"
    ],
    buttonText: "Panduan Penanganan",
    actionType: "residu"
  }
];

export const rewardCatalog = [
  { jenis: "Plastik Botol PET (Bersih)", poinPerKg: 3500, rupiah: 3500 },
  { jenis: "Plastik Tutup Botol / HDPE", poinPerKg: 4000, rupiah: 4000 },
  { jenis: "Kardus & Box Karton Kering", poinPerKg: 2000, rupiah: 2000 },
  { jenis: "Kertas Arsip / HVS Putih", poinPerKg: 2800, rupiah: 2800 },
  { jenis: "Kaleng Minuman / Seng", poinPerKg: 4500, rupiah: 4500 },
  { jenis: "Aluminium & Logam Ringan", poinPerKg: 12000, rupiah: 12000 },
  { jenis: "Botol Kaca / Beling Utuh", poinPerKg: 1000, rupiah: 1000 }
];
