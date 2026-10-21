import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import './WargaPanel.css';
import { api } from '../api/client';
import { fetchPublicTps } from '../services/api';
import KelurahanMap from './KelurahanMap';
import WargaChat from './WargaChat';
import {
  TPS_SURABAYA_ALL,
  KELURAHAN_SURABAYA_ALL,
  KECAMATAN_SURABAYA_LIST,
  getTpsByKelurahan,
  getTpsByKecamatan
} from '../data/tpsSurabayaData';

// Real Scannable QR Code Component
function RealQRCode({ text, size = 210, color = "#166534", onGenerated }) {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!text) return;

    QRCode.toDataURL(text, {
      width: Math.max(size * 2, 350),
      margin: 1,
      color: {
        dark: color,
        light: '#ffffff'
      },
      errorCorrectionLevel: 'L' // Low -> QR lebih jarang, lebih mudah di-scan cepat
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          if (onGenerated) onGenerated(url);
        }
      })
      .catch((err) => {
        console.error('Gagal generate real QR code:', err);
        if (isMounted) setError(err);
      });

    return () => {
      isMounted = false;
    };
  }, [text, size, color]);

  if (error) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', padding: '10px' }}>
        Gagal memuat QR Code
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
        Membuat QR Asli...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Kode QR Asli Validasi SI-PETASAN"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        borderRadius: '6px',
        objectFit: 'contain'
      }}
    />
  );
}

// Data types for plastic in Setor & Panduan
const PLASTIC_TYPES = [
  { id: 'pete', code: 'PETE', name: 'PET / PETE', sub: 'Botol air minum, botol minuman', rate: 50, color: '#0284c7' },
  { id: 'hdpe', code: 'HDPE', name: 'HDPE', sub: 'Galon, jerigen, botol deterjen', rate: 45, color: '#16a34a' },
  { id: 'pvc', code: 'PVC', name: 'PVC', sub: 'Pipa, selang, kemasan bening', rate: 30, color: '#9333ea' },
  { id: 'ldpe', code: 'LDPE', name: 'LDPE', sub: 'Kantong kresek, plastik wrap', rate: 25, color: '#ea580c' },
  { id: 'pp', code: 'PP', name: 'PP', sub: 'Tutup botol, sedotan, ember', rate: 40, color: '#dc2626' },
  { id: 'ps', code: 'PS', name: 'PS / Styrofoam', sub: 'Gelas plastik, kotak styrofoam', rate: 15, color: '#854d0e' },
  { id: 'other', code: 'OTHER', name: 'Lainnya (ABS, PC, dll)', sub: 'Casing elektronik, helm, galon PC', rate: 20, color: '#334155' }
];

// TPS Tracking data
const TPS_LIST = [
  { id: 'mawar', name: 'TPS Mawar', capacity: 68, status: 'AMAN', color: 'green', dotColor: '#16a34a', x: 190, y: 150 },
  { id: 'melati', name: 'TPS Melati', capacity: 82, status: 'HAMPIR PENUH', color: 'yellow', dotColor: '#f59e0b', x: 350, y: 165 },
  { id: 'kenanga', name: 'TPS Kenanga', capacity: 94, status: 'OVERLOAD', color: 'red', dotColor: '#ef4444', x: 320, y: 240 },
  { id: 'flamboyan', name: 'TPS Flamboyan', capacity: 45, status: 'AMAN', color: 'green', dotColor: '#16a34a', x: 260, y: 215 },
  { id: 'cempaka', name: 'TPS Cempaka', capacity: 77, status: 'HAMPIR PENUH', color: 'yellow', dotColor: '#f59e0b', x: 390, y: 242 },
  { id: 'dahlia', name: 'TPS Dahlia', capacity: 31, status: 'AMAN', color: 'green', dotColor: '#16a34a', x: 228, y: 260 }
];

// Pilihan Paket E-Wallet Tukar Reward (Sesuai Gambar Figma)
const E_WALLET_PACKAGES = [
  {
    id: 'pkg-10k',
    nominal: 'Rp10.000',
    title: 'Saldo Rp10.000',
    desc: 'Cocok untuk transaksi harian dan pembayaran digital.',
    stock: 40,
    points: 200,
    themeColor: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#d1fae5',
    tagColor: '#10b981',
  },
  {
    id: 'pkg-25k',
    nominal: 'Rp25.000',
    title: 'Saldo Rp25.000',
    desc: 'Tukarkan ke layanan e-wallet pilihanmu.',
    stock: 28,
    points: 500,
    themeColor: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#dbeafe',
    tagColor: '#3b82f6',
  },
  {
    id: 'pkg-50k',
    nominal: 'Rp50.000',
    title: 'Saldo Rp50.000',
    desc: 'Lebih hemat 50 poin untuk nominal lebih besar.',
    stock: 18,
    points: 950,
    themeColor: '#0d9488',
    bgColor: '#f0fdfa',
    borderColor: '#ccfbf1',
    tagColor: '#0d9488',
  },
  {
    id: 'pkg-100k',
    nominal: 'Rp100.000',
    title: 'Saldo Rp100.000',
    desc: 'Pilihan saldo tertinggi untuk warga aktif.',
    stock: 8,
    points: 1800,
    themeColor: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#ffedd5',
    tagColor: '#f97316',
  },
];

// Real Official Logos for Indonesian E-Wallets
function DanaLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '8px', background: 'linear-gradient(135deg, #118EEA 0%, #0c77c6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(17, 142, 234, 0.35)' }}>
      <svg width={size * 0.78} height={size * 0.28} viewBox="0 0 76 24" fill="none">
        <path d="M12.5 0H5.2C2.3 0 0 2.3 0 5.2v13.6C0 21.7 2.3 24 5.2 24h7.3c6.9 0 12.5-5.4 12.5-12S19.4 0 12.5 0zm0 17.5H5.8c-.8 0-1.5-.7-1.5-1.5V8c0-.8.7-1.5 1.5-1.5h6.7c3.3 0 6 2.5 6 5.5s-2.7 5.5-6 5.5z" fill="#FFF" />
        <path d="M37.3 17.8l-1.3-4.1h-7.6l-1.3 4.1h-4.6L30 1.2h4.5l7.5 16.6h-4.7zm-5.1-13l-2.6 8.3h5.2l-2.6-8.3z" fill="#FFF" />
        <path d="M57.6 17.8L49.1 6v11.8h-4.3V1.2h4.3l8.4 11.7V1.2h4.3v16.6h-4.2z" fill="#FFF" />
        <path d="M72.3 17.8l-1.3-4.1h-7.6l-1.3 4.1h-4.6L65 1.2h4.5l7.5 16.6h-4.7zm-5.1-13l-2.6 8.3h5.2l-2.6-8.3z" fill="#FFF" />
      </svg>
    </div>
  );
}

function OvoLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '8px', background: 'linear-gradient(135deg, #4C2A86 0%, #38186b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(76, 42, 134, 0.35)' }}>
      <svg width={size * 0.78} height={size * 0.32} viewBox="0 0 60 22" fill="none">
        <ellipse cx="10" cy="11" rx="9" ry="10" stroke="#FFF" strokeWidth="3.2" fill="none" />
        <ellipse cx="10" cy="11" rx="3.5" ry="4" fill="#FFF" />
        <path d="M22 2.5L29 19.5L36 2.5" stroke="#FFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx="48" cy="11" rx="9" ry="10" stroke="#FFF" strokeWidth="3.2" fill="none" />
        <ellipse cx="48" cy="11" rx="3.5" ry="4" fill="#FFF" />
      </svg>
    </div>
  );
}

function GopayLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '8px', background: 'linear-gradient(135deg, #00AED6 0%, #0093B5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0, 174, 214, 0.35)' }}>
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32" fill="none">
        <path d="M16 4C9.37 4 4 9.37 4 16c0 6.63 5.37 12 12 12s12-5.37 12-12c0-6.63-5.37-12-12-12zm0 18.2A6.2 6.2 0 1 1 22.2 16 6.21 6.21 0 0 1 16 22.2z" fill="#FFF" />
        <circle cx="16" cy="16" r="3.2" fill="#00AED6" />
        <circle cx="21" cy="9.5" r="2.2" fill="#FFF" />
      </svg>
    </div>
  );
}

function ShopeepayLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '8px', background: 'linear-gradient(135deg, #EE4D2D 0%, #d83a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(238, 77, 45, 0.35)' }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        <rect x="3.5" y="8" width="17" height="13.5" rx="2.5" fill="#FFF" />
        <path d="M14 11.5c0-.8-.7-1.3-1.8-1.3-1.1 0-1.8.5-1.8 1.2 0 1.5 3.6 1.1 3.6 3.2 0 1.2-1 2-2.1 2s-2.2-.7-2.2-1.7" stroke="#EE4D2D" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Opsi E-Wallet di Modal Konfirmasi (Dengan Logo Asli)
const EWALLET_OPTIONS = [
  { id: 'DANA', name: 'DANA', color: '#118EEA', bg: '#eff8ff', LogoComponent: DanaLogo },
  { id: 'OVO', name: 'OVO', color: '#4C2A86', bg: '#fbf7ff', LogoComponent: OvoLogo },
  { id: 'GoPay', name: 'GoPay', color: '#00AED6', bg: '#f0faff', LogoComponent: GopayLogo },
  { id: 'ShopeePay', name: 'ShopeePay', color: '#EE4D2D', bg: '#fff5f3', LogoComponent: ShopeepayLogo },
];

const DEFAULT_TUKAR_HISTORY = [
  {
    id: 'TRX-6262',
    title: 'GoPay - Saldo Rp10.000',
    date: '14 Okt 2026',
    points: 200,
    status: 'Diproses',
  },
  {
    id: 'TRX-2408',
    title: 'Saldo DANA Rp25.000',
    date: '24 Agu 2026',
    points: 500,
    status: 'Selesai',
  },
];

export default function WargaPanel({ onLogout, wargaId = 12, currentUser }) {
  const [dbUser, setDbUser] = useState(currentUser || null);
  const [userData, setUserData] = useState(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState(currentUser?.kelurahan || 'Kelurahan');
  const [kelurahanTpsList, setKelurahanTpsList] = useState(() => getTpsByKelurahan(currentUser?.kelurahan || 'Kelurahan'));
  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#dashboard' || hash === '#warga') return 'dashboard';
    if (hash === '#jadwal') return 'jadwal';
    if (hash === '#setor') return 'setor';
    if (hash === '#tukar' || hash === '#tukar-reward' || hash === '#reward') return 'tukar-reward';
    if (hash === '#panduan') return 'panduan';
    if (hash === '#tracking') return 'tracking';
    return 'qr-status';
  });

  useEffect(() => {
    const authUser = sessionStorage.getItem('auth_user');
    if (authUser) {
      try { setDbUser(JSON.parse(authUser)); } catch (e) { }
    }
  }, [currentUser]);

  // Update TPS list when kelurahan changes
  useEffect(() => {
    async function loadTps() {
      const data = await fetchPublicTps();
      if (data && data.length > 0) {
        const mappedData = data.map(item => ({
          id: item.id,
          nama: item.nama,
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          lokasi: item.lokasi || item.nama,
          kecamatan: item.kecamatan,
          wilayahKota: item.wilayah_kota,
          jenisTps: item.jenis_tps || 'TPS',
          jumlahContainer: item.jumlah_container || '-',
          dayaTampungM3: item.daya_tampung_m3 || 0,
          capacity: 50,
          statusText: item.status === 'Aktif' ? 'AMAN' : 'TIDAK AKTIF',
          statusColor: item.status === 'Aktif' ? 'green' : 'red',
          jamOperasional: '06:00 - 18:00'
        }));
        const filtered = mappedData.filter(t => t.kecamatan === selectedKelurahan || t.wilayahKota === selectedKelurahan);
        setKelurahanTpsList(filtered.length > 0 ? filtered : mappedData.slice(0, 6));
      } else {
        const list = getTpsByKelurahan(selectedKelurahan);
        setKelurahanTpsList(list.length > 0 ? list : TPS_SURABAYA_ALL.slice(0, 6));
      }
    }
    loadTps();
  }, [selectedKelurahan]);

  const activeUser = userData || dbUser || currentUser;
  const displayWargaName = activeUser?.nama_lengkap || activeUser?.nama || 'Warga';
  const displayWargaEmail = activeUser?.email || 'warga@sipetasan.com';
  const displayKecamatanRaw = activeUser?.kecamatan || '';
  const displayKelurahanRaw = activeUser?.kelurahan || '';
  const displayAvatar = displayWargaName.charAt(0).toUpperCase();

  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDateFormatted(now.toLocaleDateString('id-ID', options));
  }, []);

  const [points, setPoints] = useState(1050);
  const [tukarHistory, setTukarHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sipetasan_tukar_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_TUKAR_HISTORY;
  });
  const [selectedRewardPkg, setSelectedRewardPkg] = useState(null);
  const [showTukarModal, setShowTukarModal] = useState(false);
  const [selectedEwallet, setSelectedEwallet] = useState(null);
  const [modalStep, setModalStep] = useState('select-ewallet'); // 'select-ewallet' | 'fill-form'
  const [ewalletPhone, setEwalletPhone] = useState('');
  const [ewalletAccountName, setEwalletAccountName] = useState('');
  const [ewalletNotes, setEwalletNotes] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [totalSetoran, setTotalSetoran] = useState(0);
  const [totalKg, setTotalKg] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [selectedPlastic, setSelectedPlastic] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');
  const [selectedTpsId, setSelectedTpsId] = useState('mawar');
  const [tpsList] = useState(TPS_LIST);

  const selectedTps = tpsList.find((t) => t.id === selectedTpsId) || tpsList[0];

  // =========================================================
  // RINCIAN PEMERIKSAAN & REAL QR CODE STATE
  // =========================================================
  const getInitialRincian = () => {
    try {
      const saved = sessionStorage.getItem('sipetasan_rincian_pemeriksaan');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Gagal membaca saved rincian:', e);
    }
    return {
      kodeValidasi: 'SP-2025-0042',
      beratDilaporkan: '3.5 kg',
      beratAktual: 'Menunggu timbang',
      kondisiSampah: 'Menunggu pemeriksaan',
      jenisSampah: 'PETE, HDPE',
      status: 'Menunggu pengambilan',
      waktuUpdate: 'Update 08.15',
      catatanPetugas: '',
      itemsTambahan: []
    };
  };

  const [rincianPemeriksaan, setRincianPemeriksaan] = useState(getInitialRincian);
  const [showRincianModal, setShowRincianModal] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'tambah'
  const [activeModalTab, setActiveModalTab] = useState('utama'); // 'utama' | 'tambah-item'
  const [rincianForm, setRincianForm] = useState(rincianPemeriksaan);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [showQrPreviewModal, setShowQrPreviewModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Alur validasi step calculation (1: Laporan, 2: Dipindai, 3: Diperiksa)
  const alurStep = useMemo(() => {
    const st = (rincianPemeriksaan.status || '').toLowerCase();
    if (st.includes('selesai') || st.includes('sudah') || st.includes('validasi')) return 3;
    if (st.includes('proses') || (rincianPemeriksaan.beratAktual && rincianPemeriksaan.beratAktual !== 'Menunggu timbang')) return 2;
    return 1;
  }, [rincianPemeriksaan]);

  // Compact QR Payload - mudah di-scan petugas (pakai delimiter |, bukan multiline panjang)
  // Format: SI-PETASAN|KODE|NAMA|KELURAHAN|ALAMAT|JENIS|BERAT => < 120 char, QR low-density
  const qrTextContent = useMemo(() => {
    const kode = rincianPemeriksaan.kodeValidasi || (userData?.id ? `SP-2025-${String(userData.id).padStart(4, '0')}` : 'SP-2025-0042');
    const namaWarga = (userData?.nama || userData?.full_name || 'Budi Santoso').replace(/\|/g, ' ').trim();
    const kel = (userData?.kelurahan || 'Sukamaju').replace(/\|/g, ' ').trim();
    const alamatClean = (userData?.alamat_rumah || 'Jl. Mawar').replace(/\|/g, ' ').replace(/,/g, ' ').trim();
    const jenis = (rincianPemeriksaan.jenisSampah || 'PETE').replace(/\|/g, ',').trim();
    const berat = (rincianPemeriksaan.beratDilaporkan || '3.5 kg').replace(/\|/g, ' ').trim();
    // Compact: SI-PETASAN|SP-2025-0042|Budi Santoso|Sukamaju|Jl Mawar|PETE|3.5kg
    return `SI-PETASAN|${kode}|${namaWarga}|${kel}|${alamatClean}|${jenis}|${berat}`;
  }, [rincianPemeriksaan, userData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenEditModal = () => {
    setModalMode('edit');
    setActiveModalTab('utama');
    setRincianForm({ ...rincianPemeriksaan });
    setShowRincianModal(true);
  };

  const handleOpenTambahModal = () => {
    setModalMode('tambah');
    setActiveModalTab('tambah-item');
    setRincianForm({ ...rincianPemeriksaan });
    setNewItemLabel('');
    setNewItemValue('');
    setShowRincianModal(true);
  };

  const handleSaveRincian = (e) => {
    e.preventDefault();
    const updated = {
      ...rincianForm,
      waktuUpdate: `Update ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')}`
    };
    setRincianPemeriksaan(updated);
    try {
      localStorage.setItem('sipetasan_rincian_pemeriksaan', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    setShowRincianModal(false);
    showToast('✅ Rincian pemeriksaan & Kode QR berhasil diperbarui!');
  };

  const handleAddExtraItem = () => {
    if (!newItemLabel.trim() || !newItemValue.trim()) return;
    const items = [...(rincianForm.itemsTambahan || []), { label: newItemLabel.trim(), value: newItemValue.trim() }];
    const updated = { ...rincianForm, itemsTambahan: items };
    setRincianForm(updated);
    setNewItemLabel('');
    setNewItemValue('');
    showToast('Item berhasil ditambahkan ke daftar!');
  };

  const handleRemoveExtraItem = (idx) => {
    const items = (rincianPemeriksaan.itemsTambahan || []).filter((_, i) => i !== idx);
    const updated = { ...rincianPemeriksaan, itemsTambahan: items };
    setRincianPemeriksaan(updated);
    try {
      localStorage.setItem('sipetasan_rincian_pemeriksaan', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    showToast('Item berhasil dihapus');
  };

  const handleCopyQrText = async () => {
    try {
      await navigator.clipboard.writeText(qrTextContent);
      setCopyFeedback(true);
      showToast('📋 Isi data QR berhasil disalin ke clipboard!');
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      showToast('Gagal menyalin teks');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-SIPETASAN-${rincianPemeriksaan.kodeValidasi || 'VALIDASI'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('⬇️ Kode QR berhasil diunduh!');
  };

  const handleQuickPreset = (type) => {
    if (type === 'default') {
      setRincianForm({
        kodeValidasi: 'SP-2025-0042',
        beratDilaporkan: '3.5 kg',
        beratAktual: 'Menunggu timbang',
        kondisiSampah: 'Menunggu pemeriksaan',
        jenisSampah: 'PETE, HDPE',
        status: 'Menunggu pengambilan',
        catatanPetugas: '',
        itemsTambahan: []
      });
    } else if (type === 'verified') {
      setRincianForm({
        kodeValidasi: 'SP-2025-0042',
        beratDilaporkan: '3.5 kg',
        beratAktual: '3.8 kg',
        kondisiSampah: 'Bersih & Terpilah',
        jenisSampah: 'PETE, HDPE',
        status: 'Sudah Divalidasi / Selesai',
        catatanPetugas: 'Sampah terpilah bersih tanpa sisa cairan. Poin reward penuh.',
        itemsTambahan: [{ label: 'Petugas Lapangan', value: 'Hendra (Armada 02)' }]
      });
    } else if (type === 'process') {
      setRincianForm({
        ...rincianForm,
        status: 'Sedang Diproses Petugas',
        kondisiSampah: 'Dalam Pemeriksaan Lapangan'
      });
    }
  };

  // Sync with hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#qr' || hash === '#qr-status' || hash === '#validasi') setActiveMenu('qr-status');
      else if (hash === '#jadwal') setActiveMenu('jadwal');
      else if (hash === '#setor') setActiveMenu('setor');
      else if (hash === '#tukar' || hash === '#tukar-reward' || hash === '#reward') setActiveMenu('tukar-reward');
      else if (hash === '#panduan') setActiveMenu('panduan');
      else if (hash === '#tracking') setActiveMenu('tracking');
      else if (hash === '#dashboard' || hash === '#warga') setActiveMenu('dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const getFormattedDate = () => {
    const kel = displayKelurahanRaw ? `Kelurahan ${displayKelurahanRaw}` : 'Kelurahan Sukamaju';
    return `${kel} \u2022 ${currentDateFormatted || 'Rabu, 14 Oktober 2026'}`;
  };

  // Buka modal konfirmasi penukaran e-wallet
  const handleOpenTukarModal = (pkg) => {
    if (points < pkg.points) return;
    setSelectedRewardPkg(pkg);
    setSelectedEwallet(null);
    setModalStep('select-ewallet');
    setEwalletPhone(activeUser?.no_hp || '');
    setEwalletAccountName(displayWargaName || '');
    setEwalletNotes('');
    setShowTukarModal(true);
  };

  // Pilih E-Wallet dan langsung lanjutkan ke Formulir Pengisian
  const handleSelectEwallet = (walletId) => {
    setSelectedEwallet(walletId);
    setModalStep('fill-form');
  };

  // Konfirmasi penukaran setelah mengisi formulir
  const handleConfirmTukar = async () => {
    if (!selectedRewardPkg || !selectedEwallet) return;

    const phoneTrimmed = ewalletPhone.trim();
    if (!phoneTrimmed || phoneTrimmed.length < 8) {
      showToast('⚠️ Masukkan nomor HP / E-Wallet yang valid.');
      return;
    }

    const nameTrimmed = ewalletAccountName.trim();
    if (!nameTrimmed) {
      showToast('⚠️ Masukkan nama lengkap pemilik akun e-wallet.');
      return;
    }

    if (points < selectedRewardPkg.points) {
      showToast('⚠️ Poin tidak mencukupi untuk penukaran ini.');
      return;
    }

    setIsRedeeming(true);
    const cost = selectedRewardPkg.points;
    const newRemainingPts = Math.max(0, points - cost);
    const storedUserId = sessionStorage.getItem('user_id');
    const actualWargaId = storedUserId || wargaId;

    try {
      await api.post('/api/setoran/tukar-reward', {
        warga_id: parseInt(actualWargaId),
        reward_title: selectedRewardPkg.title,
        ewallet_type: selectedEwallet,
        nominal: selectedRewardPkg.nominal,
        poin_digunakan: cost,
        nomor_ewallet: phoneTrimmed,
        atas_nama: nameTrimmed,
        catatan: ewalletNotes.trim(),
      });
    } catch (err) {
      console.warn('API tukar-reward info:', err);
    }

    // Update local points state
    setPoints(newRemainingPts);
    if (userData) {
      setUserData(prev => prev ? { ...prev, total_poin: newRemainingPts, no_hp: phoneTrimmed } : prev);
    }

    // Tambah riwayat penukaran baru
    const trxRandom = Math.floor(1000 + Math.random() * 9000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newTx = {
      id: `TRX-${trxRandom}`,
      title: `${selectedEwallet === 'DANA' ? 'Saldo DANA ' + selectedRewardPkg.nominal : selectedEwallet + ' - ' + selectedRewardPkg.title}`,
      subtitle: `a.n. ${nameTrimmed} (${phoneTrimmed})`,
      date: dateFormatted,
      points: cost,
      status: 'Diproses',
    };

    const nextHistory = [newTx, ...tukarHistory];
    setTukarHistory(nextHistory);
    try {
      localStorage.setItem('sipetasan_tukar_history', JSON.stringify(nextHistory));
    } catch (e) {
      console.warn(e);
    }

    setIsRedeeming(false);
    setShowTukarModal(false);
    showToast(`🎉 Penukaran saldo ${selectedRewardPkg.nominal} ke ${selectedEwallet} (${phoneTrimmed}) berhasil diproses!`);
    setSelectedRewardPkg(null);
    setSelectedEwallet(null);
    setModalStep('select-ewallet');
  };

  useEffect(() => {
    loadWargaData();
    loadSetoranData();
    loadJadwalData();
    loadScanHistory();
  }, [wargaId]);

  const loadWargaData = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data) {
        setUserData(response.data);
        const p = response.data.total_poin !== undefined ? response.data.total_poin : 1050;
        setPoints(p > 0 ? p : 1050);
      }
    } catch (err) {
      console.error('Load warga data error:', err);
      setPoints((prev) => (prev > 0 ? prev : 1050));
    }
  };

  const loadSetoranData = async () => {
    try {
      const storedUserId = sessionStorage.getItem('user_id');
      const actualWargaId = storedUserId || wargaId;
      const response = await api.get(`/api/setoran/?warga_id=${actualWargaId}`);
      if (response.data) {
        setTotalSetoran(response.data.length);
        const totalBerat = response.data.reduce((sum, s) => sum + (parseFloat(s.perkiraan_berat_kg) || 0), 0);
        setTotalKg(parseFloat(totalBerat.toFixed(1)));
      }
    } catch (err) {
      console.error('Load setoran data error:', err);
    }
  };

  const loadScanHistory = async () => {
    try {
      const storedUserId = sessionStorage.getItem('user_id');
      const actualWargaId = storedUserId || wargaId;
      const response = await api.get(`/api/petugas/scan-history?warga_id=${actualWargaId}`);
      if (response.data && Array.isArray(response.data)) {
        setScanHistory(response.data);
      }
    } catch (err) {
      console.error('Load scan history error:', err);
    }
  };

  const loadJadwalData = async () => {
    try {
      const response = await api.get('/api/jadwal/');
      if (response.data) {
        const data = response.data;
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[new Date().getDay()];
        const formatted = data.map(j => {
          const t = (j.tipe || '').toLowerCase();
          return {
            day: j.hari,
            isToday: j.hari === todayName,
            area: j.area,
            time: j.tipe === 'Libur' ? '—' : `${j.waktu_mulai}–${j.waktu_selesai}`,
            officer: j.petugas,
            type: t.includes('besar') ? 'Besar' : t.includes('libur') ? 'Libur' : 'Rutin'
          };
        });
        setScheduleItems(formatted);
      }
    } catch (err) {
      console.error('Load jadwal data error:', err);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlastic || !weightInput || parseFloat(weightInput) <= 0) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const storedUserId = sessionStorage.getItem('user_id');
      const actualWargaId = storedUserId || wargaId;
      await api.post('/api/setoran/', {
        warga_id: parseInt(actualWargaId),
        jenis_sampah: selectedPlastic.code,
        perkiraan_berat_kg: parseFloat(weightInput),
        metode_setor: 'Diantar Langsung',
      });
      const kg = parseFloat(weightInput);
      const addedPoints = Math.round(kg * selectedPlastic.rate);
      setPoints((prev) => prev + addedPoints);
      setTotalSetoran((prev) => prev + 1);
      setTotalKg((prev) => parseFloat((prev + kg).toFixed(1)));
      setDepositSuccessMsg(`Berhasil setor ${kg} kg ${selectedPlastic.name}! Mendapatkan +${addedPoints} pts.`);
      setWeightInput('');
      setSelectedPlastic(null);
      setTimeout(() => setDepositSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal setor sampah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="warga-container">
      <aside className="warga-sidebar">
        <div>
          <div className="warga-logo-badge">
            <div className="warga-logo-icon">SI</div>
            <div>
              <div className="warga-brand-name">SI-PETASAN</div>
              <div className="warga-brand-sub">
                {displayKelurahanRaw ? `KELURAHAN ${displayKelurahanRaw.toUpperCase()}` : 'KELURAHAN SUKAMAJU'}
              </div>
            </div>
          </div>
          <div className="warga-menu-section">
            <div className="warga-menu-label">MENU WARGA</div>
            <nav className="warga-nav-list">
              <button type="button" className={`warga-nav-btn ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveMenu('dashboard')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>Dashboard</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'jadwal' ? 'active' : ''}`} onClick={() => setActiveMenu('jadwal')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                <span>Jadwal Pengambilan</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'setor' ? 'active' : ''}`} onClick={() => setActiveMenu('setor')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>Setor &amp; Reward</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'tukar-reward' ? 'active' : ''}`} onClick={() => setActiveMenu('tukar-reward')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                <span>Tukar Reward</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'riwayat-pengambilan' ? 'active' : ''}`} onClick={() => setActiveMenu('riwayat-pengambilan')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path></svg>
                <span>Riwayat Pengambilan</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'qr-status' ? 'active' : ''}`} onClick={() => setActiveMenu('qr-status')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="3" height="3" fill="currentColor"></rect><rect x="14" y="7" width="3" height="3" fill="currentColor"></rect><rect x="7" y="14" width="3" height="3" fill="currentColor"></rect><rect x="14" y="14" width="3" height="3" fill="currentColor"></rect></svg>
                <span>QR &amp; Status Validasi</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'panduan' ? 'active' : ''}`} onClick={() => setActiveMenu('panduan')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                <span>Panduan Pemilahan</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'chat' ? 'active' : ''}`} onClick={() => setActiveMenu('chat')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span>Chat Admin</span>
              </button>
              <button type="button" className={`warga-nav-btn ${activeMenu === 'tracking' ? 'active' : ''}`} onClick={() => setActiveMenu('tracking')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                <span>Tracking TPS</span>
              </button>
            </nav>
          </div>
        </div>
        <div className="warga-sidebar-footer">
          <div className="warga-profile-pill">
            <div className="warga-avatar-sm">{displayAvatar}</div>
            <div>
              <div className="warga-profile-name">{displayWargaName}</div>
              <div className="warga-profile-sub" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{displayWargaEmail}</div>
            </div>
          </div>
          <button type="button" className="warga-logout-link" onClick={onLogout}>&larr; Keluar</button>
        </div>
      </aside>
      <main className="warga-main-content">
        <header className="warga-top-header">
          <div>
            <h2 className="warga-page-title">
              {activeMenu === 'dashboard' && 'Dashboard'}
              {activeMenu === 'jadwal' && 'Jadwal Pengambilan'}
              {activeMenu === 'setor' && 'Setor & Reward'}
              {activeMenu === 'tukar-reward' && 'Tukar Reward'}
              {activeMenu === 'riwayat-pengambilan' && 'Riwayat Pengambilan Sampah'}
              {activeMenu === 'qr-status' && 'QR & Status Validasi'}
              {activeMenu === 'panduan' && 'Panduan Pemilahan'}
              {activeMenu === 'chat' && 'Chat Admin'}
              {activeMenu === 'tracking' && 'Tracking TPS'}
            </h2>
            <div className="warga-page-date">{getFormattedDate()}</div>
          </div>
          <div className="warga-header-points">
            <div className="warga-points-meta">
              <span className="warga-points-label">Total Poin Kamu</span>
              <span className="warga-points-val">{points.toLocaleString('id-ID')} pts</span>
            </div>
            <div className="warga-avatar-lg">{displayAvatar}</div>
          </div>
        </header>
        {depositSuccessMsg && <div className="warga-toast-success"><span>🎉 {depositSuccessMsg}</span></div>}
        {errorMsg && <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>{errorMsg}</div>}
        {activeMenu === 'dashboard' && (
          <div className="warga-content-body">
            <div className="warga-alert-banner green">
              <div className="warga-alert-icon">🚚</div>
              <div>
                <strong className="warga-alert-title">Pengambilan sampah hari ini!</strong>
                <p className="warga-alert-desc">RT 01-03 Jl. Mawar &bull; 06:00–08:00 &bull; Petugas: Hendra</p>
              </div>
            </div>
            <div className="warga-stats-grid">
              <div className="warga-stat-card">
                <div className="warga-stat-top"><span className="warga-stat-icon gold">⭐</span><span className="warga-stat-badge">SAYA</span></div>
                <div className="warga-stat-value-row"><span className="warga-stat-number">{points.toLocaleString('id-ID')}</span><span className="warga-stat-unit">pts</span></div>
                <span className="warga-stat-label">Poin Saya</span>
              </div>
              <div className="warga-stat-card">
                <div className="warga-stat-top"><span className="warga-stat-icon green">♻️</span><span className="warga-stat-badge">SAYA</span></div>
                <div className="warga-stat-value-row"><span className="warga-stat-number">{totalSetoran}</span><span className="warga-stat-unit">kali</span></div>
                <span className="warga-stat-label">Total Setoran</span>
              </div>
              <div className="warga-stat-card">
                <div className="warga-stat-top"><span className="warga-stat-icon gray">🗑️</span><span className="warga-stat-badge">SAYA</span></div>
                <div className="warga-stat-value-row"><span className="warga-stat-number">{totalKg}</span><span className="warga-stat-unit">kg</span></div>
                <span className="warga-stat-label">Sampah Disetor</span>
              </div>
            </div>
            <div className="warga-two-col-grid">
              <div className="warga-panel-card">
                <h3 className="warga-card-title">TPS Terdekat Saya — Kel. {selectedKelurahan || user?.kelurahan || 'Kelurahan'}</h3>
                <div className="warga-tps-progress-list">
                  {kelurahanTpsList.slice(0, 3).map((tps) => {
                    const isCritical = tps.statusColor === 'red' || tps.capacity >= 90;
                    const isWarning = tps.statusColor === 'yellow' || (tps.capacity >= 75 && tps.capacity < 90);
                    const colorClass = isCritical ? 'red' : isWarning ? 'yellow' : 'green';
                    return (
                      <div
                        key={tps.id}
                        className="warga-tps-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedTpsId(tps.id);
                          setActiveMenu('tracking');
                        }}
                        title="Klik untuk melihat di peta"
                      >
                        <div className="warga-tps-item-head">
                          <div className="warga-tps-name-row">
                            <span className={`warga-dot ${colorClass}`}></span>
                            <span className="warga-tps-name">{tps.nama}</span>
                          </div>
                          <span className={`warga-tps-pct ${colorClass}`}>{tps.capacity}%</span>
                        </div>
                        <div className="warga-bar-track">
                          <div className={`warga-bar-fill ${colorClass}`} style={{ width: `${tps.capacity}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button type="button" className="warga-inline-link-btn" onClick={() => setActiveMenu('tracking')}>Lihat peta TPS &rarr;</button>
              </div>
              <div className="warga-panel-card">
                <h3 className="warga-card-title">Jadwal Minggu Ini</h3>
                <div className="warga-schedule-brief-list">
                  {scheduleItems.slice(0, 5).map((item, i) => (
                    <div key={i} className="warga-brief-item">
                      <div><div className="warga-brief-day">{item.day}</div><div className="warga-brief-sub">{item.area}</div></div>
                      <span className={`warga-tag ${item.type === 'Besar' ? 'blue' : item.type === 'Libur' ? 'gray' : 'green'}`}>{item.type}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="warga-inline-link-btn" onClick={() => setActiveMenu('jadwal')}>Lihat semua jadwal &rarr;</button>
              </div>
            </div>
            <button type="button" className="warga-big-action-btn" onClick={() => setActiveMenu('setor')}><span>⭐ Setor Sampah &amp; Dapatkan Reward Sekarang</span><span>&rarr;</span></button>
          </div>
        )}
        {activeMenu === 'jadwal' && (
          <div className="warga-content-body">
            <div className="warga-alert-banner soft"><span style={{ fontSize: '1.1rem' }}>💡</span><span>Siapkan sampah terpilah sebelum jam pengambilan agar petugas dapat langsung mengambilnya.</span></div>
            <div className="warga-panel-card">
              <h3 className="warga-card-title" style={{ marginBottom: '18px' }}>Jadwal Pengambilan Sampah — Kelurahan Sukamaju</h3>
              <div className="warga-table-container">
                <table className="warga-data-table">
                  <thead><tr><th>HARI</th><th>AREA / ZONA</th><th>WAKTU</th><th>PETUGAS</th><th>TIPE</th></tr></thead>
                  <tbody>
                    {scheduleItems.map((item, idx) => (
                      <tr key={idx} className={item.isToday ? 'row-highlight-today' : ''}>
                        <td className="col-day"><strong>{item.day}</strong>{item.isToday && <span className="warga-pill-today">HARI INI</span>}</td>
                        <td>{item.area}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.time}</td>
                        <td>{item.officer}</td>
                        <td><span className={`warga-tag ${item.type === 'Besar' ? 'blue' : item.type === 'Libur' ? 'gray' : 'green'}`}>{item.type}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeMenu === 'setor' && (
          <div className="warga-content-body">
            <div className="warga-panel-card">
              <div style={{ marginBottom: '20px' }}>
                <h3 className="warga-card-title" style={{ marginBottom: '4px' }}>Pilih Jenis Plastik yang Disetor</h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b' }}>Pilih jenis plastik, lalu isi berat (kg) untuk hitung poin reward kamu.</p>
              </div>
              <div className="warga-plastic-grid">
                {PLASTIC_TYPES.map((plastic) => {
                  const isSelected = selectedPlastic?.id === plastic.id;
                  return (
                    <div key={plastic.id} className={`warga-plastic-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedPlastic(plastic)}>
                      <div className="warga-plastic-left">
                        <span className="warga-resin-badge" style={{ backgroundColor: plastic.color }}>{plastic.code}</span>
                        <div><strong className="warga-plastic-name">{plastic.name}</strong><p className="warga-plastic-sub">{plastic.sub}</p><span className="warga-plastic-rate">{plastic.rate} poin/kg</span></div>
                      </div>
                      <div className={`warga-radio-circle ${isSelected ? 'checked' : ''}`}>{isSelected && <div className="warga-radio-inner"></div>}</div>
                    </div>
                  );
                })}
              </div>
              {selectedPlastic && (
                <form onSubmit={handleDepositSubmit} className="warga-deposit-form">
                  <div className="warga-form-inner">
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Masukkan Estimasi Berat Plastik ({selectedPlastic.code}):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" step="0.1" min="0.1" required placeholder="Contoh: 2.5" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="warga-weight-input" />
                        <span style={{ fontWeight: 600, color: '#64748b' }}>kg</span>
                      </div>
                    </div>
                    <div className="warga-calc-summary">
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Estimasi Reward:</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>+{weightInput && parseFloat(weightInput) > 0 ? Math.round(parseFloat(weightInput) * selectedPlastic.rate) : 0} pts</div>
                    </div>
                    <button type="submit" className="warga-submit-deposit-btn">Kirim Setoran Sampah &rarr;</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: TUKAR REWARD (Pilihan E-Wallet & Riwayat Penukaran)   */}
        {/* Sesuai dengan Desain Figma                                */}
        {/* ========================================================= */}
        {activeMenu === 'tukar-reward' && (
          <div className="warga-content-body">
            {/* HERO CARD: SALDO REWARD TERSEDIA */}
            <div className="warga-reward-hero">
              <div className="warga-reward-hero-left">
                <div className="warga-reward-hero-tag">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12"></polyline>
                    <rect x="2" y="7" width="20" height="5"></rect>
                    <line x1="12" y1="22" x2="12" y2="7"></line>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                  </svg>
                  <span>SALDO REWARD TERSEDIA</span>
                </div>
                <div className="warga-reward-hero-pts">
                  <span>{points.toLocaleString('id-ID')}</span>
                  <span className="unit">poin</span>
                </div>
                <p className="warga-reward-hero-sub">
                  Tukarkan poin menjadi saldo e-wallet pilihanmu.
                </p>
              </div>

              <div className="warga-reward-hero-badge">
                <div className="warga-reward-star-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div>
                  <div className="warga-reward-badge-label">Keanggotaan</div>
                  <div className="warga-reward-badge-val">Warga Hijau &bull; Level 2</div>
                </div>
              </div>
            </div>

            {/* SECTION HEADER: PILIHAN E-WALLET */}
            <div className="warga-reward-section-header">
              <div>
                <h3 className="warga-reward-section-title">Pilihan E-Wallet</h3>
                <p className="warga-reward-section-sub">
                  Saldo dikirim ke nomor e-wallet yang terdaftar pada akunmu.
                </p>
              </div>
              <div className="warga-reward-filter-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <span>Khusus saldo e-wallet</span>
              </div>
            </div>

            {/* GRID OF 4 E-WALLET PACKAGES */}
            <div className="warga-reward-grid">
              {E_WALLET_PACKAGES.map((pkg) => {
                const isAffordable = points >= pkg.points;
                return (
                  <div key={pkg.id} className="warga-reward-card">
                    <div>
                      <div className="warga-reward-card-top">
                        <div
                          className="warga-reward-icon-box"
                          style={{
                            background: pkg.bgColor,
                            border: `1px solid ${pkg.borderColor}`,
                            color: pkg.themeColor,
                          }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                            <path d="M16 10h5v4h-5a2 2 0 0 1 0-4z"></path>
                          </svg>
                        </div>
                        <span className="warga-reward-stock-badge">{pkg.stock} tersedia</span>
                      </div>

                      <div className="warga-reward-tag" style={{ color: pkg.tagColor }}>
                        E-WALLET
                      </div>
                      <h4 className="warga-reward-title">{pkg.title}</h4>
                      <p className="warga-reward-desc">{pkg.desc}</p>
                    </div>

                    <div className="warga-reward-card-bottom">
                      <div className="warga-reward-cost-wrap">
                        <span className="warga-reward-cost">{pkg.points.toLocaleString('id-ID')}</span>
                        <span className="warga-reward-cost-unit">poin</span>
                      </div>

                      <button
                        type="button"
                        className="warga-reward-btn"
                        disabled={!isAffordable}
                        onClick={() => handleOpenTukarModal(pkg)}
                      >
                        {isAffordable ? 'Tukar' : 'Poin kurang'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIWAYAT PENUKARAN */}
            <div className="warga-reward-history-card">
              <div className="warga-reward-history-header">
                <div>
                  <h4 className="warga-reward-history-title">Riwayat Penukaran</h4>
                  <p className="warga-reward-history-sub">
                    Pantau status hadiah yang pernah kamu tukarkan.
                  </p>
                </div>
                <span className="warga-reward-history-count">
                  {tukarHistory.length} transaksi
                </span>
              </div>

              <div className="warga-reward-history-list">
                {tukarHistory.map((item, idx) => (
                  <div key={item.id || idx} className="warga-reward-history-item">
                    <div className="warga-reward-history-left">
                      <div className="warga-reward-history-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 12 20 22 4 22 4 12"></polyline>
                          <rect x="2" y="7" width="20" height="5"></rect>
                          <line x1="12" y1="22" x2="12" y2="7"></line>
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                        </svg>
                      </div>
                      <div>
                        <h5 className="warga-reward-history-name">{item.title}</h5>
                        <p className="warga-reward-history-date">
                          {item.id} &bull; {item.subtitle ? `${item.subtitle} \u2022 ` : ''}{item.date}
                        </p>
                      </div>
                    </div>

                    <div className="warga-reward-history-right">
                      <span className="warga-reward-history-pts">
                        -{item.points} poin
                      </span>
                      <span
                        className={`warga-reward-status-badge ${item.status.toLowerCase().includes('proses') ? 'diproses' : 'selesai'
                          }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: RIWAYAT PENGAMBILAN SAMPAH */}
        {/* ========================================================= */}
        {activeMenu === 'riwayat-pengambilan' && (
          <div className="warga-content-body">
            <h3 className="warga-section-title">Riwayat Pengambilan Sampah</h3>
            <p className="warga-section-subtitle">Daftar pengambilan sampah yang telah dilakukan petugas</p>

            {scanHistory.length === 0 ? (
              <div className="warga-empty-state" style={{ marginTop: '40px' }}>
                <div className="warga-empty-icon" style={{ color: '#94a3b8' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <p style={{ color: '#94a3b8', marginTop: '16px' }}>Belum ada riwayat pengambilan</p>
              </div>
            ) : (
              <div className="warga-reward-history-list">
                {scanHistory.map((item, idx) => (
                  <div key={item.id || idx} className="warga-reward-history-item">
                    <div className="warga-reward-history-left">
                      <div className="warga-reward-history-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="warga-reward-history-name">Pengambilan Sampah</h5>
                        <p className="warga-reward-history-date">
                          {item.id} &bull; {item.nama_warga || 'Warga'} • {item.kelurahan || '-'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          {item.jenis_sampah || '-'} • {item.berat || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="warga-reward-history-right">
                      <span className="warga-reward-history-date" style={{ fontSize: '0.75rem' }}>
                        {item.scanned_at ? (() => {
                          const dt = new Date(item.scanned_at);
                          const wibTime = new Date(dt.getTime() + (7 * 60 * 60 * 1000));
                          return wibTime.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
                        })() : '-'}
                      </span>
                      {item.foto_bukti_url && (
                        <button
                          onClick={() => { setSelectedScanFoto(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.foto_bukti_url}`); setShowScanFotoModal(true); }}
                          style={{ marginTop: '8px', padding: '4px 12px', fontSize: '0.7rem', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Lihat Foto
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showScanFotoModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowScanFotoModal(false)}>
                <div style={{ maxWidth: '500px', width: '90%', background: '#fff', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0 }}>Foto Bukti Pengambilan</h4>
                    <button onClick={() => setShowScanFotoModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </div>
                  <div style={{ padding: '24px' }}>
                    {selectedScanFoto && (
                      <img src={selectedScanFoto} alt="Foto Bukti" style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                    )}
                    <div style={{ display: 'none', background: '#f1f5f9', padding: '32px', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                      <p>Gagal memuat foto</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <button onClick={() => setShowScanFotoModal(false)} style={{ padding: '8px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Tutup</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* TAB: QR & STATUS VALIDASI (Matching User Screenshot) */}
        {/* ========================================================= */}
        {activeMenu === 'qr-status' && (
          <div className="warga-content-body">
            <div className="warga-qr-grid">
              {/* Left Column: QR Pengambilan Sampah (Real Scannable QR Code) */}
              <div className="warga-qr-card">
                <div className="warga-qr-badge"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="3" height="3" fill="currentColor"></rect><rect x="14" y="7" width="3" height="3" fill="currentColor"></rect><rect x="7" y="14" width="3" height="3" fill="currentColor"></rect><rect x="14" y="14" width="3" height="3" fill="currentColor"></rect></svg></div>
                <h3 className="warga-qr-title">QR Pengambilan Sampah</h3>
                <p className="warga-qr-subtitle">
                  Tunjukkan QR ini kepada petugas sebelum sampah ditimbang.
                </p>

                {/* Real Scannable QR Code */}
                <div className="warga-qr-image-wrapper">
                  <RealQRCode
                    text={qrTextContent}
                    size={210}
                    color="#166534"
                    onGenerated={setQrDataUrl}
                  />
                </div>

                {/* Live Scanner indicator */}
                <div className="warga-qr-scannable-pill">
                  <span className="qr-scannable-dot"></span>
                  <span>Kode QR Asli &bull; Siap di-scan Kamera HP</span>
                </div>

                <div className="warga-qr-code-pill">
                  {rincianPemeriksaan.kodeValidasi || (userData?.id ? `SP-2025-${String(userData.id).padStart(4, '0')}` : 'SP-2025-0042')}
                </div>

                <p className="warga-qr-address-sub">
                  Warga {userData?.kelurahan || 'Sukamaju'} &bull; RT 03 &bull; {userData?.alamat_rumah || 'Jl. Mawar'}
                </p>

                {/* Action Buttons for User testing */}
                <div className="warga-qr-btn-group">
                  <button
                    type="button"
                    className="warga-qr-util-btn"
                    onClick={handleCopyQrText}
                    title="Salin isi data teks QR"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>{copyFeedback ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>

                  <button
                    type="button"
                    className="warga-qr-util-btn"
                    onClick={() => setShowQrPreviewModal(true)}
                    title="Lihat teks yang terkandung dalam QR"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    </svg>
                    <span>Isi QR</span>
                  </button>

                  <button
                    type="button"
                    className="warga-qr-util-btn download"
                    onClick={handleDownloadQr}
                    title="Download gambar QR Code"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Unduh</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3 Stacked Cards */}
              <div className="warga-qr-right-col">
                <div className="warga-status-terbaru-card">
                  <div className="warga-status-header-row">
                    <span className="warga-status-label-badge">STATUS TERBARU</span>
                    <span className="warga-status-time">{rincianPemeriksaan.waktuUpdate || 'Update 08.15'}</span>
                  </div>
                  <h3 className="warga-status-heading">
                    {rincianPemeriksaan.status}
                  </h3>
                  <p className="warga-status-subtext">
                    {rincianPemeriksaan.status.toLowerCase().includes('selesai') || rincianPemeriksaan.status.toLowerCase().includes('sudah')
                      ? 'Sampah telah berhasil diverifikasi dan ditimbang petugas. Poin reward telah ditambahkan!'
                      : rincianPemeriksaan.status.toLowerCase().includes('proses')
                        ? 'Petugas armada sedang menimbang dan memeriksa kebersihan sampah di lokasi.'
                        : 'Tunjukkan QR kepada petugas ketika sampah dijemput.'}
                  </p>
                </div>
                <div className="warga-rincian-card">
                  <div className="warga-rincian-header">
                    <div>
                      <h4 className="warga-rincian-title">Rincian Pemeriksaan Petugas</h4>
                      <span className="warga-rincian-subtitle">Data setoran terhubung otomatis dengan QR aktif</span>
                    </div>
                    <div className="warga-rincian-actions">
                      <button
                        type="button"
                        className="warga-action-chip-btn edit"
                        onClick={handleOpenEditModal}
                        title="Edit nilai rincian pemeriksaan"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Edit Rincian</span>
                      </button>

                      <button
                        type="button"
                        className="warga-action-chip-btn tambah"
                        onClick={handleOpenTambahModal}
                        title="Tambah jenis sampah / item pemeriksaan baru"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>Tambah Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="warga-rincian-grid">
                    <div className="warga-rincian-row">
                      <div className="warga-rincian-cell">
                        <div className="warga-rincian-cell-label">Berat dilaporkan</div>
                        <div className="warga-rincian-cell-value">{rincianPemeriksaan.beratDilaporkan}</div>
                      </div>
                      <div className="warga-rincian-cell">
                        <div className="warga-rincian-cell-label">Berat aktual</div>
                        <div className={`warga-rincian-cell-value ${rincianPemeriksaan.beratAktual !== 'Menunggu timbang' ? 'highlight-val' : ''}`}>
                          {rincianPemeriksaan.beratAktual}
                        </div>
                      </div>
                    </div>
                    <div className="warga-rincian-row">
                      <div className="warga-rincian-cell">
                        <div className="warga-rincian-cell-label">Kondisi sampah</div>
                        <div className={`warga-rincian-cell-value ${rincianPemeriksaan.kondisiSampah.toLowerCase().includes('bersih') ? 'highlight-green' : ''}`}>
                          {rincianPemeriksaan.kondisiSampah}
                        </div>
                      </div>
                      <div className="warga-rincian-cell">
                        <div className="warga-rincian-cell-label">Jenis sampah</div>
                        <div className="warga-rincian-cell-value">{rincianPemeriksaan.jenisSampah}</div>
                      </div>
                    </div>
                  </div>

                  {/* Extra Items List if added */}
                  {rincianPemeriksaan.itemsTambahan && rincianPemeriksaan.itemsTambahan.length > 0 && (
                    <div className="warga-extra-items-box">
                      <div className="warga-extra-items-title">Item Tambahan Terdaftar:</div>
                      <div className="warga-extra-items-list">
                        {rincianPemeriksaan.itemsTambahan.map((it, idx) => (
                          <div key={idx} className="warga-extra-item-chip">
                            <span className="dot"></span>
                            <span><strong>{it.label}:</strong> {it.value}</span>
                            <button
                              type="button"
                              className="remove-chip-btn"
                              onClick={() => handleRemoveExtraItem(idx)}
                              title="Hapus item ini"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rincianPemeriksaan.catatanPetugas && (
                    <div className="warga-rincian-note-box">
                      <span>💬</span>
                      <span><strong>Catatan Petugas:</strong> {rincianPemeriksaan.catatanPetugas}</span>
                    </div>
                  )}
                </div>

                {/* Card 3: Alur Validasi */}
                <div className="warga-alur-card">
                  <h4 className="warga-alur-title">Alur Validasi</h4>
                  <div className="warga-alur-steps">
                    <div className="warga-alur-step-item">
                      <div className="warga-alur-step-circle active">1</div>
                      <div className="warga-alur-step-content">
                        <div className="warga-alur-step-title">Laporan dibuat warga</div>
                        <div className="warga-alur-step-desc">
                          {rincianPemeriksaan.beratDilaporkan} &bull; {rincianPemeriksaan.jenisSampah}
                        </div>
                      </div>
                    </div>

                    <div className="warga-alur-step-item">
                      <div className={`warga-alur-step-circle ${alurStep >= 2 ? 'active' : 'pending'}`}>2</div>
                      <div className="warga-alur-step-content">
                        <div className="warga-alur-step-title">QR dipindai petugas</div>
                        <div className="warga-alur-step-desc">
                          {alurStep >= 2
                            ? 'Petugas armada telah memindai QR code ini di lokasi.'
                            : 'Identitas dan laporan terbuka otomatis saat di-scan.'}
                        </div>
                      </div>
                    </div>

                    <div className="warga-alur-step-item">
                      <div className={`warga-alur-step-circle ${alurStep >= 3 ? 'active' : 'pending'}`}>3</div>
                      <div className="warga-alur-step-content">
                        <div className="warga-alur-step-title">Kebersihan &amp; berat diperiksa</div>
                        <div className="warga-alur-step-desc">
                          {alurStep >= 3
                            ? `Selesai: ${rincianPemeriksaan.beratAktual} (${rincianPemeriksaan.kondisiSampah})`
                            : 'Hasil dikirim langsung sebagai pemberitahuan.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeMenu === 'panduan' && (
          <div className="warga-content-body">
            <div className="warga-guide-top-grid">
              <div className="warga-category-card organik"><div className="warga-cat-header"><span className="warga-cat-title">🍃 Organik</span></div><ul className="warga-cat-bullet-list"><li>Sisa makanan &amp; nasi</li><li>Kulit buah &amp; sayuran</li><li>Daun kering &amp; ranting</li><li>Ampas kopi &amp; teh</li><li>Cangkang telur</li><li>Kertas tisu bekas</li></ul><div className="warga-cat-footer-pill green"><span>💡 Kompos dalam 2–4 minggu</span></div></div>
              <div className="warga-category-card anorganik"><div className="warga-cat-header"><span className="warga-cat-title">♻️ Anorganik</span></div><ul className="warga-cat-bullet-list"><li>Botol plastik (PETE/HDPE)</li><li>Kaleng aluminium &amp; besi</li><li>Kertas &amp; karton bersih</li><li>Kaca &amp; botol beling</li><li>Plastik keras (PP, HDPE)</li><li>Aluminium foil bersih</li></ul><div className="warga-cat-footer-pill blue"><span>💡 Setorkan ke bank sampah untuk poin</span></div></div>
              <div className="warga-category-card residu"><div className="warga-cat-header"><span className="warga-cat-title">🗑️ Residu</span></div><ul className="warga-cat-bullet-list"><li>Styrofoam &amp; busa</li><li>Popok bayi &amp; diaper</li><li>Plastik multilayer snack</li><li>Karet &amp; ban bekas</li><li>Baterai &amp; lampu bekas*</li><li>Obat kadaluarsa*</li></ul><div className="warga-cat-footer-pill orange"><span>💡 Minimasi penggunaan produk residu</span></div></div>
            </div>
            <div className="warga-panel-card">
              <div style={{ marginBottom: '18px' }}><h3 className="warga-card-title" style={{ marginBottom: '4px' }}>Panduan Kode Plastik Daur Ulang</h3><p style={{ fontSize: '0.86rem', color: '#64748b' }}>Cek kode segitiga di bawah produk plastik kamu</p></div>
              <div className="warga-resin-guide-grid">
                {PLASTIC_TYPES.map((plastic) => (
                  <div key={plastic.id} className="warga-resin-guide-card">
                    <span className="warga-resin-badge" style={{ backgroundColor: plastic.color }}>{plastic.code}</span>
                    <strong className="warga-resin-title">{plastic.name}</strong><p className="warga-resin-sub">{plastic.sub}</p>
                    <span className="warga-resin-bonus" style={{ color: plastic.color }}>+{plastic.rate} poin/kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeMenu === 'chat' && (
          <WargaChat />
        )}
        {activeMenu === 'tracking' && (
          <div className="warga-content-body">
            {/* Real TPS Chips of Selected Kelurahan */}
            <div className="warga-panel-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  Pilih titik TPS yang melayani <strong>Kelurahan {selectedKelurahan}</strong>:
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Menampilkan {kelurahanTpsList.length} TPS terverifikasi DLH
                </span>
              </div>
              <div className="warga-tps-chip-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {kelurahanTpsList.map((tps) => {
                  const isCritical = tps.statusColor === 'red' || tps.capacity >= 90;
                  const isWarning = tps.statusColor === 'yellow' || (tps.capacity >= 75 && tps.capacity < 90);
                  const colorClass = isCritical ? 'red' : isWarning ? 'yellow' : 'green';
                  return (
                    <button
                      key={tps.id}
                      type="button"
                      className={`warga-tps-chip ${selectedTpsId === tps.id ? 'active' : ''}`}
                      onClick={() => setSelectedTpsId(tps.id)}
                    >
                      <span
                        className="warga-chip-dot"
                        style={{ backgroundColor: tps.dotColor || (colorClass === 'red' ? '#ef4444' : colorClass === 'yellow' ? '#f59e0b' : '#16a34a') }}
                      ></span>
                      <span>{tps.nama} ({tps.capacity}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="warga-tracking-grid">
              {/* Left Column: Interactive Leaflet Kelurahan Map */}
              <div className="warga-panel-card" style={{ flex: 1.6, padding: '16px' }}>
                <KelurahanMap
                  tpsList={kelurahanTpsList}
                  selectedTpsId={selectedTpsId}
                  onSelectTps={(tps) => setSelectedTpsId(tps.id)}
                  selectedKelurahan={selectedKelurahan}
                  onSelectKelurahan={(kel) => {
                    setSelectedKelurahan(kel);
                    const nextList = getTpsByKelurahan(kel);
                    if (nextList.length > 0) setSelectedTpsId(nextList[0].id);
                  }}
                  allKelurahanList={KELURAHAN_SURABAYA_ALL}
                  allKecamatanList={KECAMATAN_SURABAYA_LIST}
                  userRegisteredKelurahan={displayKelurahanRaw}
                  currentKecamatan={selectedTps?.kecamatan || displayKecamatanRaw}
                />
              </div>

              {/* Right Column: 2 Stacked Status Detail Cards */}
              <div className="warga-tracking-right-col" style={{ flex: 1 }}>
                {/* Card 1: Selected TPS Details & Progress */}
                <div className="warga-panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      TPS Terpilih &bull; Kel. {selectedKelurahan}
                    </span>
                    <span className={`warga-status-tag ${selectedTps.statusColor || 'green'}`}>
                      {selectedTps.statusText ? selectedTps.statusText.toUpperCase() : (selectedTps.status || 'AMAN')}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {selectedTps.nama}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
                    📍 {selectedTps.lokasi}
                  </div>

                  <div className="warga-bar-track" style={{ height: '8px', marginBottom: '8px' }}>
                    <div
                      className={`warga-bar-fill ${selectedTps.statusColor || 'green'}`}
                      style={{ width: `${selectedTps.capacity}%` }}
                    ></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '14px' }}>
                    <span>Kapasitas Terisi</span>
                    <span>{selectedTps.capacity}%</span>
                  </div>

                  {/* Real TPS specs from Excel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.78rem', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                    <div><span style={{ color: '#64748b' }}>Jenis:</span> <strong>{selectedTps.jenisTps || 'Compactor'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Daya Tampung:</span> <strong>{selectedTps.dayaTampungM3} m³</strong></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>Kontainer:</span> <strong>{selectedTps.jumlahContainer}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>Status Operasional:</span> <strong style={{ color: selectedTps.status === 'Aktif' ? '#16a34a' : '#ef4444' }}>{selectedTps.status || 'Aktif'}</strong></div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTps.lat},${selectedTps.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        textDecoration: 'none'
                      }}
                    >
                      <span>🧭</span>
                      <span>Rute Google Maps</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => alert(`Laporan kondisi TPS ${selectedTps.nama} telah diteruskan ke Satgas Pengawas DLH Surabaya.`)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                      title="Lapor kendala ke DLH Surabaya"
                    >
                      ⚠️ Lapor
                    </button>
                  </div>
                </div>

                {/* Card 2: Recommendation Info Banner */}
                <div className={`warga-recommendation-card ${selectedTps.statusColor || 'green'}`}>
                  <div className="warga-rec-icon-box">
                    {selectedTps.statusColor === 'green' && '✅'}
                    {selectedTps.statusColor === 'yellow' && '⚠️'}
                    {selectedTps.statusColor === 'red' && '⛔'}
                    {selectedTps.statusColor === 'gray' && 'ℹ️'}
                  </div>
                  <h5 className="warga-rec-title">
                    {selectedTps.statusColor === 'green' && 'TPS ini aman untuk disetor!'}
                    {selectedTps.statusColor === 'yellow' && 'Kapasitas Mendekati Batas!'}
                    {selectedTps.statusColor === 'red' && 'TPS Sedang Overload!'}
                    {selectedTps.statusColor === 'gray' && 'TPS Sedang Tidak Aktif'}
                  </h5>
                  <p className="warga-rec-desc">
                    {selectedTps.statusColor === 'green' &&
                      `Kapasitas penampungan di ${selectedTps.nama} masih dalam kondisi aman. Anda dapat menyetorkan sampah langsung hari ini.`}
                    {selectedTps.statusColor === 'yellow' &&
                      `Kapasitas sudah mencapai ${selectedTps.capacity}%. Disarankan menyetorkan sampah sebelum jam sibuk pukul 12:00 WIB.`}
                    {selectedTps.statusColor === 'red' &&
                      `Rute dialihkan otomatis: TPS ini overload (${selectedTps.capacity}%). Disarankan beralih ke TPS lain di Kelurahan ${selectedKelurahan} yang masih aman.`}
                    {selectedTps.statusColor === 'gray' &&
                      `TPS ini sedang dalam status tidak aktif atau pemeliharaan oleh DLH Surabaya.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: EDIT / TAMBAH RINCIAN PEMERIKSAAN PETUGAS          */}
      {/* ========================================================= */}
      {showRincianModal && (
        <div className="warga-modal-backdrop" onClick={() => setShowRincianModal(false)}>
          <div className="warga-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="warga-modal-header">
              <h3 className="warga-modal-title">
                {modalMode === 'edit' ? '✏️ Edit Rincian Pemeriksaan' : '➕ Tambah Data Pemeriksaan'}
              </h3>
              <button
                type="button"
                className="warga-modal-close-btn"
                onClick={() => setShowRincianModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="warga-modal-tabs">
              <button
                type="button"
                className={`warga-modal-tab-btn ${activeModalTab === 'utama' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('utama')}
              >
                Form Data Utama
              </button>
              <button
                type="button"
                className={`warga-modal-tab-btn ${activeModalTab === 'tambah-item' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('tambah-item')}
              >
                Tambah Item Tambahan
              </button>
            </div>

            {/* Modal Body */}
            <div className="warga-modal-body">
              {activeModalTab === 'utama' ? (
                <form id="rincian-edit-form" onSubmit={handleSaveRincian} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Quick Presets */}
                  <div>
                    <span className="warga-form-label">Preset Cepat Demo:</span>
                    <div className="warga-quick-presets">
                      <button
                        type="button"
                        className="warga-preset-pill"
                        onClick={() => handleQuickPreset('default')}
                      >
                        🔄 Reset ke Menunggu
                      </button>
                      <button
                        type="button"
                        className="warga-preset-pill"
                        onClick={() => handleQuickPreset('process')}
                      >
                        ⏳ Sedang Diproses
                      </button>
                      <button
                        type="button"
                        className="warga-preset-pill"
                        onClick={() => handleQuickPreset('verified')}
                      >
                        ✅ Selesai Divalidasi (3.8 kg, Bersih)
                      </button>
                    </div>
                  </div>

                  <div className="warga-form-row-2">
                    <div className="warga-form-group">
                      <label className="warga-form-label">Kode Validasi / QR:</label>
                      <input
                        type="text"
                        className="warga-form-input"
                        value={rincianForm.kodeValidasi}
                        onChange={(e) => setRincianForm({ ...rincianForm, kodeValidasi: e.target.value })}
                        placeholder="Contoh: SP-2025-0042"
                        required
                      />
                    </div>
                    <div className="warga-form-group">
                      <label className="warga-form-label">Status Validasi:</label>
                      <select
                        className="warga-form-select"
                        value={rincianForm.status}
                        onChange={(e) => setRincianForm({ ...rincianForm, status: e.target.value })}
                      >
                        <option value="Menunggu pengambilan">Menunggu pengambilan</option>
                        <option value="Sedang Diproses Petugas">Sedang Diproses Petugas</option>
                        <option value="Sudah Divalidasi / Selesai">Sudah Divalidasi / Selesai</option>
                        <option value="Perlu Pemeriksaan Ulang">Perlu Pemeriksaan Ulang</option>
                      </select>
                    </div>
                  </div>

                  <div className="warga-form-row-2">
                    <div className="warga-form-group">
                      <label className="warga-form-label">Berat Dilaporkan:</label>
                      <input
                        type="text"
                        className="warga-form-input"
                        value={rincianForm.beratDilaporkan}
                        onChange={(e) => setRincianForm({ ...rincianForm, beratDilaporkan: e.target.value })}
                        placeholder="Contoh: 3.5 kg"
                        required
                      />
                    </div>
                    <div className="warga-form-group">
                      <label className="warga-form-label">Berat Aktual:</label>
                      <input
                        type="text"
                        className="warga-form-input"
                        value={rincianForm.beratAktual}
                        onChange={(e) => setRincianForm({ ...rincianForm, beratAktual: e.target.value })}
                        placeholder="Contoh: Menunggu timbang atau 3.8 kg"
                        required
                      />
                    </div>
                  </div>

                  <div className="warga-form-row-2">
                    <div className="warga-form-group">
                      <label className="warga-form-label">Kondisi Sampah:</label>
                      <select
                        className="warga-form-select"
                        value={rincianForm.kondisiSampah}
                        onChange={(e) => setRincianForm({ ...rincianForm, kondisiSampah: e.target.value })}
                      >
                        <option value="Menunggu pemeriksaan">Menunggu pemeriksaan</option>
                        <option value="Bersih & Terpilah">Bersih & Terpilah</option>
                        <option value="Kering Bersih">Kering Bersih</option>
                        <option value="Sedikit Kotor">Sedikit Kotor</option>
                        <option value="Tercampur Organik">Tercampur Organik</option>
                      </select>
                    </div>
                    <div className="warga-form-group">
                      <label className="warga-form-label">Jenis Sampah:</label>
                      <input
                        type="text"
                        className="warga-form-input"
                        value={rincianForm.jenisSampah}
                        onChange={(e) => setRincianForm({ ...rincianForm, jenisSampah: e.target.value })}
                        placeholder="Contoh: PETE, HDPE"
                        required
                      />
                    </div>
                  </div>

                  <div className="warga-form-group">
                    <label className="warga-form-label">Catatan Tambahan Petugas (Opsional):</label>
                    <textarea
                      rows="2"
                      className="warga-form-textarea"
                      value={rincianForm.catatanPetugas}
                      onChange={(e) => setRincianForm({ ...rincianForm, catatanPetugas: e.target.value })}
                      placeholder="Catatan hasil timbang atau kondisi pilahan warga..."
                    ></textarea>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Tambahkan item pemeriksaan atau jenis sampah tambahan ke dalam rincian dan QR code ini.
                  </p>

                  <div className="warga-form-group">
                    <label className="warga-form-label">Nama Item / Kategori:</label>
                    <input
                      type="text"
                      className="warga-form-input"
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      placeholder="Contoh: Sampah Tambahan, Petugas Lapangan, Reward Estimasi"
                    />
                  </div>

                  <div className="warga-form-group">
                    <label className="warga-form-label">Nilai / Detail Keterangan:</label>
                    <input
                      type="text"
                      className="warga-form-input"
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                      placeholder="Contoh: Kardus Karton 1.2 kg, Truk Armada #02, +150 Poin"
                    />
                  </div>

                  <button
                    type="button"
                    className="warga-btn-primary"
                    onClick={handleAddExtraItem}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    ➕ Tambahkan ke Daftar
                  </button>

                  {/* Preview Current Extra Items */}
                  <div style={{ marginTop: '10px' }}>
                    <span className="warga-form-label">Daftar Item Tambahan Saat Ini:</span>
                    {rincianForm.itemsTambahan && rincianForm.itemsTambahan.length > 0 ? (
                      <div className="warga-extra-items-list" style={{ marginTop: '8px' }}>
                        {rincianForm.itemsTambahan.map((it, idx) => (
                          <div key={idx} className="warga-extra-item-chip">
                            <span className="dot"></span>
                            <span><strong>{it.label}:</strong> {it.value}</span>
                            <button
                              type="button"
                              className="remove-chip-btn"
                              onClick={() => {
                                const filtered = rincianForm.itemsTambahan.filter((_, i) => i !== idx);
                                setRincianForm({ ...rincianForm, itemsTambahan: filtered });
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', margin: '6px 0 0 0' }}>
                        Belum ada item tambahan. Isi formulir di atas untuk menambahkan.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="warga-modal-footer">
              <button
                type="button"
                className="warga-btn-secondary"
                onClick={() => setShowRincianModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                form="rincian-edit-form"
                className="warga-btn-primary"
                onClick={(e) => {
                  if (activeModalTab === 'tambah-item') {
                    handleSaveRincian(e);
                  }
                }}
              >
                💾 Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW ISI KODE QR                                */}
      {/* ========================================================= */}
      {showQrPreviewModal && (
        <div className="warga-modal-backdrop" onClick={() => setShowQrPreviewModal(false)}>
          <div className="warga-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="warga-modal-header">
              <h3 className="warga-modal-title">
                📱 Isi Teks Kode QR Asli
              </h3>
              <button
                type="button"
                className="warga-modal-close-btn"
                onClick={() => setShowQrPreviewModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="warga-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                Berikut adalah isi data nyata yang terenkode di dalam QR Code. Ketika kamera HP atau Google Lens memindai QR, teks ini akan langsung terbaca:
              </p>

              <div className="warga-preview-code-block">
                {qrTextContent}
              </div>
            </div>

            <div className="warga-modal-footer">
              <button
                type="button"
                className="warga-btn-secondary"
                onClick={() => setShowQrPreviewModal(false)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="warga-btn-primary"
                onClick={handleCopyQrText}
              >
                📋 {copyFeedback ? 'Tersalin!' : 'Salin Teks QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI PENUKARAN E-WALLET (MULTI-STEP FORM)    */}
      {/* ========================================================= */}
      {showTukarModal && selectedRewardPkg && (
        <div className="warga-modal-backdrop" onClick={() => setShowTukarModal(false)}>
          <div className="warga-ewallet-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* STEP 1: PILIH E-WALLET */}
            {modalStep === 'select-ewallet' && (
              <>
                <div className="warga-ewallet-modal-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12"></polyline>
                    <rect x="2" y="7" width="20" height="5"></rect>
                    <line x1="12" y1="22" x2="12" y2="7"></line>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                  </svg>
                </div>

                <h3 className="warga-ewallet-modal-title">Konfirmasi Penukaran</h3>
                <p className="warga-ewallet-modal-sub">
                  Pilih tujuan e-wallet untuk menerima saldo.
                </p>

                {/* Pilihan E-Wallet (2x2 Grid dengan Logo Asli) */}
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                  Pilih e-wallet
                </label>
                <div className="warga-ewallet-grid">
                  {EWALLET_OPTIONS.map((wallet) => {
                    const isSelected = selectedEwallet === wallet.id;
                    const LogoComp = wallet.LogoComponent;
                    return (
                      <div
                        key={wallet.id}
                        className={`warga-ewallet-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectEwallet(wallet.id)}
                      >
                        <div className="warga-ewallet-opt-left">
                          <LogoComp size={34} />
                          <span className="warga-ewallet-opt-name">{wallet.name}</span>
                        </div>

                        <div className="warga-ewallet-radio">
                          {isSelected && <div className="warga-ewallet-radio-inner"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reward Pilihan Summary Box */}
                <div className="warga-ewallet-summary-box">
                  <p className="warga-ewallet-sum-label">Reward pilihan</p>
                  <h4 className="warga-ewallet-sum-title">{selectedRewardPkg.title}</h4>
                  <p className="warga-ewallet-sum-hint">
                    Klik salah satu e-wallet di atas untuk mengisi data penerima
                  </p>

                  <div className="warga-ewallet-divider"></div>

                  <div className="warga-ewallet-sum-row">
                    <span className="label">Poin digunakan</span>
                    <span className="val green">-{selectedRewardPkg.points}</span>
                  </div>
                  <div className="warga-ewallet-sum-row">
                    <span className="label">Sisa saldo</span>
                    <span className="val">
                      {(points - selectedRewardPkg.points).toLocaleString('id-ID')} poin
                    </span>
                  </div>
                </div>

                {/* Notice / Disclaimer */}
                <p className="warga-ewallet-notice">
                  Penukaran tidak dapat dibatalkan. Pastikan nomor e-wallet pada akunmu aktif dan sesuai dengan layanan yang dipilih.
                </p>

                {/* Action Buttons */}
                <div className="warga-ewallet-modal-actions">
                  <button
                    type="button"
                    className="warga-ewallet-btn-cancel"
                    onClick={() => {
                      setShowTukarModal(false);
                      setSelectedEwallet(null);
                      setSelectedRewardPkg(null);
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="warga-ewallet-btn-confirm"
                    disabled={!selectedEwallet}
                    onClick={() => setModalStep('fill-form')}
                  >
                    Lanjutkan &rarr;
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: FORMULIR PENUKARAN E-WALLET (NOMOR & ATAS NAMA) */}
            {modalStep === 'fill-form' && (
              <>
                <div className="warga-ewallet-form-top">
                  <button
                    type="button"
                    className="warga-ewallet-back-link"
                    onClick={() => setModalStep('select-ewallet')}
                  >
                    &larr; Ganti E-Wallet
                  </button>
                  <div className="warga-ewallet-active-chip">
                    {(() => {
                      const opt = EWALLET_OPTIONS.find(w => w.id === selectedEwallet);
                      if (opt) {
                        const Logo = opt.LogoComponent;
                        return <Logo size={22} />;
                      }
                      return null;
                    })()}
                    <span>Saldo {selectedEwallet}</span>
                  </div>
                </div>

                <h3 className="warga-ewallet-modal-title">Formulir Penukaran E-Wallet</h3>
                <p className="warga-ewallet-modal-sub">
                  Lengkapi nomor akun dan nama pemilik untuk pengiriman saldo.
                </p>

                {/* Input: Nomor E-Wallet / Nomor HP */}
                <div className="warga-ewallet-input-group">
                  <label className="warga-ewallet-input-label">
                    Nomor Akun / HP {selectedEwallet} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="warga-ewallet-input-field"
                    placeholder="Contoh: 081234567890"
                    value={ewalletPhone}
                    onChange={(e) => setEwalletPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    autoFocus
                  />
                  <div className="warga-ewallet-input-helper">
                    Nomor telepon yang terhubung dengan akun {selectedEwallet} aktif Anda.
                  </div>
                </div>

                {/* Input: Atas Nama Pemilik Akun */}
                <div className="warga-ewallet-input-group">
                  <label className="warga-ewallet-input-label">
                    Atas Nama Pemilik Akun <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="warga-ewallet-input-field"
                    placeholder="Nama lengkap sesuai akun e-wallet"
                    value={ewalletAccountName}
                    onChange={(e) => setEwalletAccountName(e.target.value)}
                  />
                  <div className="warga-ewallet-input-helper">
                    Harus persis sama dengan nama di aplikasi {selectedEwallet} agar transfer sukses.
                  </div>
                </div>

                {/* Input: Catatan Tambahan (Opsional) */}
                <div className="warga-ewallet-input-group">
                  <label className="warga-ewallet-input-label">
                    Catatan Tambahan <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    className="warga-ewallet-input-field"
                    placeholder="Contoh: Nomor utama WhatsApp"
                    value={ewalletNotes}
                    onChange={(e) => setEwalletNotes(e.target.value)}
                  />
                </div>

                {/* Ringkasan Konfirmasi */}
                <div className="warga-ewallet-summary-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="warga-ewallet-sum-label">Rincian Pengiriman</span>
                    <strong style={{ fontSize: '0.88rem', color: '#15803d' }}>{selectedRewardPkg.title}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45 }}>
                    <div><strong>Tujuan:</strong> {selectedEwallet} &bull; {ewalletPhone || 'Belum diisi'}</div>
                    <div><strong>Penerima:</strong> a.n. {ewalletAccountName || 'Belum diisi'}</div>
                  </div>

                  <div className="warga-ewallet-divider"></div>

                  <div className="warga-ewallet-sum-row">
                    <span className="label">Poin digunakan</span>
                    <span className="val green">-{selectedRewardPkg.points}</span>
                  </div>
                  <div className="warga-ewallet-sum-row">
                    <span className="label">Sisa saldo</span>
                    <span className="val">
                      {(points - selectedRewardPkg.points).toLocaleString('id-ID')} poin
                    </span>
                  </div>
                </div>

                {/* Notice */}
                <p className="warga-ewallet-notice">
                  Pastikan data nomor dan nama pemilik sudah benar sebelum konfirmasi.
                </p>

                {/* Action Buttons */}
                <div className="warga-ewallet-modal-actions">
                  <button
                    type="button"
                    className="warga-ewallet-btn-cancel"
                    onClick={() => setModalStep('select-ewallet')}
                  >
                    &larr; Kembali
                  </button>
                  <button
                    type="button"
                    className="warga-ewallet-btn-confirm"
                    disabled={!ewalletPhone.trim() || !ewalletAccountName.trim() || isRedeeming}
                    onClick={handleConfirmTukar}
                  >
                    {isRedeeming ? 'Memproses...' : 'Konfirmasi & Tukar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="warga-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
