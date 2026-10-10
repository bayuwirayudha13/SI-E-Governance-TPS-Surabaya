import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import './WargaPanel.css';
import { api } from '../api/client';

// Real Scannable QR Code Component
function RealQRCode({ text, size = 210, color = "#166534", onGenerated }) {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!text) return;

    QRCode.toDataURL(text, {
      width: Math.max(size * 2, 350), // High pixel density for sharp scan on phone screen
      margin: 1,
      color: {
        dark: color,
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
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

// Placeholder for schedule data — will be loaded from API
const DEFAULT_SCHEDULE = [];

// TPS Tracking data
const TPS_LIST = [
  { id: 'mawar', name: 'TPS Mawar', capacity: 68, status: 'AMAN', color: 'green', dotColor: '#16a34a', x: 190, y: 150 },
  { id: 'melati', name: 'TPS Melati', capacity: 82, status: 'HAMPIR PENUH', color: 'yellow', dotColor: '#f59e0b', x: 350, y: 165 },
  { id: 'kenanga', name: 'TPS Kenanga', capacity: 94, status: 'OVERLOAD', color: 'red', dotColor: '#ef4444', x: 320, y: 240 },
  { id: 'flamboyan', name: 'TPS Flamboyan', capacity: 45, status: 'AMAN', color: 'green', dotColor: '#16a34a', x: 260, y: 215 },
  { id: 'cempaka', name: 'TPS Cempaka', capacity: 77, status: 'HAMPIR PENUH', color: 'yellow', dotColor: '#f59e0b', x: 390, y: 242 },
  { id: 'dahlia', name: 'TPS Dahlia', capacity: 31, status: 'AMAN', color: 'green', dotColor: '#16a34a', x: 228, y: 260 }
];

export default function WargaPanel({ onLogout, wargaId = 12 }) {
  // Navigation: 'dashboard' | 'jadwal' | 'setor' | 'qr-status' | 'panduan' | 'tracking'
  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#dashboard' || hash === '#warga') return 'dashboard';
    if (hash === '#jadwal') return 'jadwal';
    if (hash === '#setor') return 'setor';
    if (hash === '#panduan') return 'panduan';
    if (hash === '#tracking') return 'tracking';
    return 'qr-status'; // default directly to QR & Status Validasi matching screenshot
  });

  const [userData, setUserData] = useState(null);

  // Warga stats state
  const [points, setPoints] = useState(0);
  const [totalSetoran, setTotalSetoran] = useState(0);
  const [totalKg, setTotalKg] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleItems, setScheduleItems] = useState([]);

  // Setor & Reward interactive state
  const [selectedPlastic, setSelectedPlastic] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');

  // Tracking TPS state
  const [selectedTpsId, setSelectedTpsId] = useState('mawar');
  const [tpsList, setTpsList] = useState(TPS_LIST);

  const selectedTps = tpsList.find((t) => t.id === selectedTpsId) || tpsList[0];

  // =========================================================
  // RINCIAN PEMERIKSAAN & REAL QR CODE STATE
  // =========================================================
  const getInitialRincian = () => {
    try {
      const saved = localStorage.getItem('sipetasan_rincian_pemeriksaan');
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

  // Real QR Content String (Scannable by Phone Camera / Google Lens / Barcode Scanner)
  const qrTextContent = useMemo(() => {
    const kode = rincianPemeriksaan.kodeValidasi || (userData?.id ? `SP-2025-${String(userData.id).padStart(4, '0')}` : 'SP-2025-0042');
    const namaWarga = userData?.nama || userData?.full_name || 'Budi Santoso';
    const kel = userData?.kelurahan || 'Sukamaju';
    const alamat = `${kel} - RT 03 / ${userData?.alamat_rumah || 'Jl. Mawar'}`;

    let text = `=== SI-PETASAN VALIDASI SAMPAH ===\n`;
    text += `Kode Validasi : ${kode}\n`;
    text += `Nama Warga    : ${namaWarga}\n`;
    text += `Alamat        : ${alamat}\n`;
    text += `Jenis Sampah  : ${rincianPemeriksaan.jenisSampah}\n`;
    text += `Berat Laporan : ${rincianPemeriksaan.beratDilaporkan}\n`;
    text += `Berat Aktual  : ${rincianPemeriksaan.beratAktual}\n`;
    text += `Kondisi       : ${rincianPemeriksaan.kondisiSampah}\n`;
    text += `Status        : ${rincianPemeriksaan.status}\n`;

    if (rincianPemeriksaan.itemsTambahan && rincianPemeriksaan.itemsTambahan.length > 0) {
      text += `Item Tambahan :\n`;
      rincianPemeriksaan.itemsTambahan.forEach((it) => {
        text += `- ${it.label}: ${it.value}\n`;
      });
    }

    if (rincianPemeriksaan.catatanPetugas) {
      text += `Catatan       : ${rincianPemeriksaan.catatanPetugas}\n`;
    }

    text += `----------------------------------\n`;
    text += `Verifikasi Resmi DLH Kota Surabaya`;
    return text;
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
      else if (hash === '#panduan') setActiveMenu('panduan');
      else if (hash === '#tracking') setActiveMenu('tracking');
      else if (hash === '#dashboard' || hash === '#warga') setActiveMenu('dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const getFormattedDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const kel = userData?.kelurahan ? `Kelurahan ${userData.kelurahan}` : 'Kelurahan Sukamaju';
    return `${kel} • ${dayName}, ${day} ${month} ${year}`;
  };

  // Load data on mount
  useEffect(() => {
    loadWargaData();
    loadSetoranData();
    loadJadwalData();
  }, [wargaId]);

  const loadWargaData = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data) {
        setUserData(response.data);
        setPoints(response.data.total_poin !== undefined ? response.data.total_poin : 1250);
      }
    } catch (err) {
      console.error('Load warga data error:', err);
    }
  };

  const loadSetoranData = async () => {
    try {
      const storedUserId = localStorage.getItem('user_id');
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

  const loadJadwalData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/jadwal/`);
      if (response.ok) {
        const data = await response.json();
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

  // Handle deposit submission
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlastic || !weightInput || parseFloat(weightInput) <= 0) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const storedUserId = localStorage.getItem('user_id');
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

      setTimeout(() => {
        setDepositSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error('Deposit error:', err);
      setErrorMsg(err.message || 'Gagal setor sampah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="warga-container">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="warga-sidebar">
        <div>
          {/* Logo Badge */}
          <div className="warga-logo-badge">
            <div className="warga-logo-icon">SI</div>
            <div>
              <div className="warga-brand-name">SI-PETASAN</div>
              <div className="warga-brand-sub">KELURAHAN SUKAMAJU</div>
            </div>
          </div>

          {/* Menu Section */}
          <div className="warga-menu-section">
            <div className="warga-menu-label">MENU WARGA</div>
            <nav className="warga-nav-list">
              <button
                type="button"
                className={`warga-nav-btn ${activeMenu === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveMenu('dashboard')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`warga-nav-btn ${activeMenu === 'jadwal' ? 'active' : ''}`}
                onClick={() => setActiveMenu('jadwal')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span>Jadwal Pengambilan</span>
              </button>

              <button
                type="button"
                className={`warga-nav-btn ${activeMenu === 'setor' ? 'active' : ''}`}
                onClick={() => setActiveMenu('setor')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Setor &amp; Reward</span>
              </button>

              <button
                type="button"
                className={`warga-nav-btn ${activeMenu === 'qr-status' ? 'active' : ''}`}
                onClick={() => setActiveMenu('qr-status')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                  <rect x="7" y="7" width="3" height="3" fill="currentColor"></rect>
                  <rect x="14" y="7" width="3" height="3" fill="currentColor"></rect>
                  <rect x="7" y="14" width="3" height="3" fill="currentColor"></rect>
                  <rect x="14" y="14" width="3" height="3" fill="currentColor"></rect>
                </svg>
                <span>QR &amp; Status Validasi</span>
              </button>

              <button
                type="button"
                className={`warga-nav-btn ${activeMenu === 'panduan' ? 'active' : ''}`}
                onClick={() => setActiveMenu('panduan')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                </svg>
                <span>Panduan Pemilahan</span>
              </button>

              <button
                type="button"
                className={`warga-nav-btn ${activeMenu === 'tracking' ? 'active' : ''}`}
                onClick={() => setActiveMenu('tracking')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <span>Tracking TPS</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Profile Card */}
        <div className="warga-sidebar-footer">
          <div className="warga-profile-pill">
            <div className="warga-avatar-sm">W</div>
            <div>
              <div className="warga-profile-name">{userData?.nama || 'Warga'}</div>
              <div className="warga-profile-sub">{userData?.kelurahan ? `Kelurahan ${userData.kelurahan}` : 'Kelurahan Sukamaju'}</div>
            </div>
          </div>
          <button type="button" className="warga-logout-link" onClick={onLogout}>
            &larr; Keluar
          </button>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="warga-main-content">
        {/* Top Header Bar */}
        <header className="warga-top-header">
          <div>
            <h2 className="warga-page-title">
              {activeMenu === 'dashboard' && 'Dashboard'}
              {activeMenu === 'jadwal' && 'Jadwal Pengambilan'}
              {activeMenu === 'setor' && 'Setor & Reward'}
              {activeMenu === 'qr-status' && 'QR & Status Validasi'}
              {activeMenu === 'panduan' && 'Panduan Pemilahan'}
              {activeMenu === 'tracking' && 'Tracking TPS'}
            </h2>
            <div className="warga-page-date">
              {getFormattedDate()}
            </div>
          </div>

          <div className="warga-header-points">
            <div className="warga-points-meta">
              <span className="warga-points-label">Total Poin Kamu</span>
              <span className="warga-points-val">{(points || 1250).toLocaleString('id-ID')} pts</span>
            </div>
            <div className="warga-avatar-lg">W</div>
          </div>
        </header>

        {/* Deposit success notification toast if any */}
        {depositSuccessMsg && (
          <div className="warga-toast-success">
            <span>🎉 {depositSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD (Image 4) */}
        {/* ========================================================= */}
        {activeMenu === 'dashboard' && (
          <div className="warga-content-body">
            {/* Top Notification Banner */}
            <div className="warga-alert-banner green">
              <div className="warga-alert-icon">🚚</div>
              <div>
                <strong className="warga-alert-title">Pengambilan sampah hari ini!</strong>
                <p className="warga-alert-desc">
                  RT 01-03 Jl. Mawar &bull; 06:00–08:00 &bull; Petugas: Hendra
                </p>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="warga-stats-grid">
              {/* Card 1: Poin */}
              <div className="warga-stat-card">
                <div className="warga-stat-top">
                  <span className="warga-stat-icon gold">⭐</span>
                  <span className="warga-stat-badge">SAYA</span>
                </div>
                <div className="warga-stat-value-row">
                  <span className="warga-stat-number">{points.toLocaleString('id-ID')}</span>
                  <span className="warga-stat-unit">pts</span>
                </div>
                <span className="warga-stat-label">Poin Saya</span>
              </div>

              {/* Card 2: Total Setoran */}
              <div className="warga-stat-card">
                <div className="warga-stat-top">
                  <span className="warga-stat-icon green">♻️</span>
                  <span className="warga-stat-badge">SAYA</span>
                </div>
                <div className="warga-stat-value-row">
                  <span className="warga-stat-number">{totalSetoran}</span>
                  <span className="warga-stat-unit">kali</span>
                </div>
                <span className="warga-stat-label">Total Setoran</span>
              </div>

              {/* Card 3: Sampah Disetor */}
              <div className="warga-stat-card">
                <div className="warga-stat-top">
                  <span className="warga-stat-icon gray">🗑️</span>
                  <span className="warga-stat-badge">SAYA</span>
                </div>
                <div className="warga-stat-value-row">
                  <span className="warga-stat-number">{totalKg}</span>
                  <span className="warga-stat-unit">kg</span>
                </div>
                <span className="warga-stat-label">Sampah Disetor</span>
              </div>
            </div>

            {/* Middle 2 Columns: TPS Terdekat & Jadwal Minggu Ini */}
            <div className="warga-two-col-grid">
              {/* Left Column: TPS Terdekat Saya */}
              <div className="warga-panel-card">
                <h3 className="warga-card-title">TPS Terdekat Saya</h3>
                <div className="warga-tps-progress-list">
                  {/* TPS Mawar */}
                  <div className="warga-tps-item">
                    <div className="warga-tps-item-head">
                      <div className="warga-tps-name-row">
                        <span className="warga-dot green"></span>
                        <span className="warga-tps-name">TPS Mawar</span>
                      </div>
                      <span className="warga-tps-pct green">68%</span>
                    </div>
                    <div className="warga-bar-track">
                      <div className="warga-bar-fill green" style={{ width: '68%' }}></div>
                    </div>
                  </div>

                  {/* TPS Melati */}
                  <div className="warga-tps-item">
                    <div className="warga-tps-item-head">
                      <div className="warga-tps-name-row">
                        <span className="warga-dot yellow"></span>
                        <span className="warga-tps-name">TPS Melati</span>
                      </div>
                      <span className="warga-tps-pct yellow">82%</span>
                    </div>
                    <div className="warga-bar-track">
                      <div className="warga-bar-fill yellow" style={{ width: '82%' }}></div>
                    </div>
                  </div>

                  {/* TPS Kenanga */}
                  <div className="warga-tps-item">
                    <div className="warga-tps-item-head">
                      <div className="warga-tps-name-row">
                        <span className="warga-dot red"></span>
                        <span className="warga-tps-name">TPS Kenanga</span>
                      </div>
                      <span className="warga-tps-pct red">94%</span>
                    </div>
                    <div className="warga-bar-track">
                      <div className="warga-bar-fill red" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="warga-inline-link-btn"
                  onClick={() => setActiveMenu('tracking')}
                >
                  Lihat peta TPS &rarr;
                </button>
              </div>

              {/* Right Column: Jadwal Minggu Ini */}
              <div className="warga-panel-card">
                <h3 className="warga-card-title">Jadwal Minggu Ini</h3>
                <div className="warga-schedule-brief-list">
                  <div className="warga-brief-item">
                    <div>
                      <div className="warga-brief-day">Senin</div>
                      <div className="warga-brief-sub">RT 01-03 Jl. Mawar</div>
                    </div>
                    <span className="warga-tag green">Rutin</span>
                  </div>

                  <div className="warga-brief-item">
                    <div>
                      <div className="warga-brief-day">Selasa</div>
                      <div className="warga-brief-sub">RT 04-06 Jl. Melati</div>
                    </div>
                    <span className="warga-tag green">Rutin</span>
                  </div>

                  <div className="warga-brief-item">
                    <div>
                      <div className="warga-brief-day">Rabu</div>
                      <div className="warga-brief-sub">RT 07-09 Jl. Kenanga</div>
                    </div>
                    <span className="warga-tag green">Rutin</span>
                  </div>

                  <div className="warga-brief-item">
                    <div>
                      <div className="warga-brief-day">Kamis</div>
                      <div className="warga-brief-sub">RT 10-12 Jl. Flamboyan</div>
                    </div>
                    <span className="warga-tag green">Rutin</span>
                  </div>

                  <div className="warga-brief-item">
                    <div>
                      <div className="warga-brief-day">Jumat</div>
                      <div className="warga-brief-sub">RT 01-06 Semua Zona</div>
                    </div>
                    <span className="warga-tag blue">Besar</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="warga-inline-link-btn"
                  onClick={() => setActiveMenu('jadwal')}
                >
                  Lihat semua jadwal &rarr;
                </button>
              </div>
            </div>

            {/* Bottom Full-Width CTA Button */}
            <button
              type="button"
              className="warga-big-action-btn"
              onClick={() => setActiveMenu('setor')}
            >
              <span>⭐ Setor Sampah &amp; Dapatkan Reward Sekarang</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: JADWAL PENGAMBILAN (Image 3) */}
        {/* ========================================================= */}
        {activeMenu === 'jadwal' && (
          <div className="warga-content-body">
            {/* Top Tip Banner */}
            <div className="warga-alert-banner soft">
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <span>Siapkan sampah terpilah sebelum jam pengambilan agar petugas dapat langsung mengambilnya.</span>
            </div>

            {/* Table Card */}
            <div className="warga-panel-card">
              <h3 className="warga-card-title" style={{ marginBottom: '18px' }}>
                Jadwal Pengambilan Sampah &mdash; Kelurahan Sukamaju
              </h3>

              <div className="warga-table-container">
                <table className="warga-data-table">
                  <thead>
                    <tr>
                      <th>HARI</th>
                      <th>AREA / ZONA</th>
                      <th>WAKTU</th>
                      <th>PETUGAS</th>
                      <th>TIPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleItems.map((item, idx) => (
                      <tr key={idx} className={item.isToday ? 'row-highlight-today' : ''}>
                        <td className="col-day">
                          <strong>{item.day}</strong>
                          {item.isToday && <span className="warga-pill-today">HARI INI</span>}
                        </td>
                        <td>{item.area}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.time}</td>
                        <td>{item.officer}</td>
                        <td>
                          {item.type === 'Rutin' && <span className="warga-tag green">Rutin</span>}
                          {item.type === 'Besar' && <span className="warga-tag blue">Besar</span>}
                          {item.type === 'Libur' && <span className="warga-tag gray">Libur</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SETOR & REWARD (Image 1) */}
        {/* ========================================================= */}
        {activeMenu === 'setor' && (
          <div className="warga-content-body">
            <div className="warga-panel-card">
              <div style={{ marginBottom: '20px' }}>
                <h3 className="warga-card-title" style={{ marginBottom: '4px' }}>
                  Pilih Jenis Plastik yang Disetor
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                  Pilih jenis plastik, lalu isi berat (kg) untuk hitung poin reward kamu.
                </p>
              </div>

              {/* 2-Column Plastic Selection Cards */}
              <div className="warga-plastic-grid">
                {PLASTIC_TYPES.map((plastic) => {
                  const isSelected = selectedPlastic?.id === plastic.id;
                  return (
                    <div
                      key={plastic.id}
                      className={`warga-plastic-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPlastic(plastic)}
                    >
                      <div className="warga-plastic-left">
                        <span className="warga-resin-badge" style={{ backgroundColor: plastic.color }}>
                          {plastic.code}
                        </span>
                        <div>
                          <strong className="warga-plastic-name">{plastic.name}</strong>
                          <p className="warga-plastic-sub">{plastic.sub}</p>
                          <span className="warga-plastic-rate">{plastic.rate} poin/kg</span>
                        </div>
                      </div>

                      {/* Radio Circle */}
                      <div className={`warga-radio-circle ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="warga-radio-inner"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form Input for Weight when a plastic is selected */}
              {selectedPlastic && (
                <form onSubmit={handleDepositSubmit} className="warga-deposit-form">
                  <div className="warga-form-inner">
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Masukkan Estimasi Berat Plastik ({selectedPlastic.code}):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          required
                          placeholder="Contoh: 2.5"
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          className="warga-weight-input"
                        />
                        <span style={{ fontWeight: 600, color: '#64748b' }}>kg</span>
                      </div>
                    </div>

                    <div className="warga-calc-summary">
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Estimasi Reward:</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>
                        +{weightInput && parseFloat(weightInput) > 0 ? Math.round(parseFloat(weightInput) * selectedPlastic.rate) : 0} pts
                      </div>
                    </div>

                    <button type="submit" className="warga-submit-deposit-btn">
                      Kirim Setoran Sampah &rarr;
                    </button>
                  </div>
                </form>
              )}
            </div>
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
                <div className="warga-qr-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                    <rect x="7" y="7" width="3" height="3" fill="currentColor"></rect>
                    <rect x="14" y="7" width="3" height="3" fill="currentColor"></rect>
                    <rect x="7" y="14" width="3" height="3" fill="currentColor"></rect>
                    <rect x="14" y="14" width="3" height="3" fill="currentColor"></rect>
                  </svg>
                </div>

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
                {/* Card 1: STATUS TERBARU */}
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

                {/* Card 2: Rincian Pemeriksaan Petugas */}
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

        {/* ========================================================= */}
        {/* TAB 4: PANDUAN PEMILAHAN (Image 2) */}
        {/* ========================================================= */}
        {activeMenu === 'panduan' && (
          <div className="warga-content-body">
            {/* Top 3 Category Cards: Organik, Anorganik, Residu */}
            <div className="warga-guide-top-grid">
              {/* 1. Organik */}
              <div className="warga-category-card organik">
                <div className="warga-cat-header">
                  <span className="warga-cat-title">🍃 Organik</span>
                </div>
                <ul className="warga-cat-bullet-list">
                  <li>Sisa makanan &amp; nasi</li>
                  <li>Kulit buah &amp; sayuran</li>
                  <li>Daun kering &amp; ranting</li>
                  <li>Ampas kopi &amp; teh</li>
                  <li>Cangkang telur</li>
                  <li>Kertas tisu bekas</li>
                </ul>
                <div className="warga-cat-footer-pill green">
                  <span>💡 Kompos dalam 2–4 minggu</span>
                </div>
              </div>

              {/* 2. Anorganik */}
              <div className="warga-category-card anorganik">
                <div className="warga-cat-header">
                  <span className="warga-cat-title">♻️ Anorganik</span>
                </div>
                <ul className="warga-cat-bullet-list">
                  <li>Botol plastik (PETE/HDPE)</li>
                  <li>Kaleng aluminium &amp; besi</li>
                  <li>Kertas &amp; karton bersih</li>
                  <li>Kaca &amp; botol beling</li>
                  <li>Plastik keras (PP, HDPE)</li>
                  <li>Aluminium foil bersih</li>
                </ul>
                <div className="warga-cat-footer-pill blue">
                  <span>💡 Setorkan ke bank sampah untuk poin</span>
                </div>
              </div>

              {/* 3. Residu */}
              <div className="warga-category-card residu">
                <div className="warga-cat-header">
                  <span className="warga-cat-title">🗑️ Residu</span>
                </div>
                <ul className="warga-cat-bullet-list">
                  <li>Styrofoam &amp; busa</li>
                  <li>Popok bayi &amp; diaper</li>
                  <li>Plastik multilayer snack</li>
                  <li>Karet &amp; ban bekas</li>
                  <li>Baterai &amp; lampu bekas*</li>
                  <li>Obat kadaluarsa*</li>
                </ul>
                <div className="warga-cat-footer-pill orange">
                  <span>💡 Minimasi penggunaan produk residu</span>
                </div>
              </div>
            </div>

            {/* Bottom Card: Panduan Kode Plastik Daur Ulang */}
            <div className="warga-panel-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 className="warga-card-title" style={{ marginBottom: '4px' }}>
                  Panduan Kode Plastik Daur Ulang
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                  Cek kode segitiga di bawah produk plastik kamu
                </p>
              </div>

              <div className="warga-resin-guide-grid">
                {PLASTIC_TYPES.map((plastic) => (
                  <div key={plastic.id} className="warga-resin-guide-card">
                    <span className="warga-resin-badge" style={{ backgroundColor: plastic.color }}>
                      {plastic.code}
                    </span>
                    <strong className="warga-resin-title">{plastic.name}</strong>
                    <p className="warga-resin-sub">{plastic.sub}</p>
                    <span className="warga-resin-bonus" style={{ color: plastic.color }}>
                      +{plastic.rate} poin/kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TRACKING TPS (Image 5) */}
        {/* ========================================================= */}
        {activeMenu === 'tracking' && (
          <div className="warga-content-body">
            {/* Top TPS Selector Bar */}
            <div className="warga-panel-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
                Pilih TPS terdekat dari lokasi kamu:
              </div>
              <div className="warga-tps-chip-row">
                {TPS_LIST.map((tps) => {
                  const isSelected = selectedTpsId === tps.id;
                  return (
                    <button
                      key={tps.id}
                      type="button"
                      className={`warga-tps-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedTpsId(tps.id)}
                    >
                      <span className="warga-chip-dot" style={{ backgroundColor: tps.dotColor }}></span>
                      <span>{tps.name} ({tps.capacity}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main 2-Column: Left Map & Right Status */}
            <div className="warga-tracking-grid">
              {/* Left Column: Vector Interactive Map Card */}
              <div className="warga-panel-card" style={{ flex: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 className="warga-card-title">Peta TPS Kelurahan</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Real-time &bull; 6 titik TPS</span>
                  </div>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>🗺️</span>
                    <span>Buka Google Maps</span>
                  </a>
                </div>

                {/* SVG Vector Map Container */}
                <div className="warga-map-viewport">
                  {/* Live Badge Top Right */}
                  <div className="warga-map-live-tag">
                    <span className="warga-live-pulse-dot"></span>
                    <span>LIVE &bull; 5 mnt lalu</span>
                  </div>

                  <svg viewBox="0 0 540 320" className="warga-svg-map">
                    {/* Zone background soft shapes */}
                    <rect width="540" height="320" fill="#f0fdf4" rx="10" />

                    {/* Green zone patches */}
                    <ellipse cx="140" cy="90" rx="45" ry="25" fill="#dcfce7" opacity="0.8" />
                    <ellipse cx="440" cy="110" rx="55" ry="30" fill="#dcfce7" opacity="0.8" />
                    <ellipse cx="210" cy="245" rx="60" ry="28" fill="#dcfce7" opacity="0.7" />

                    {/* Water reservoir blue patch */}
                    <ellipse cx="460" cy="270" rx="50" ry="22" fill="#bae6fd" opacity="0.8" />

                    {/* Road Network Lines */}
                    <line x1="40" y1="60" x2="500" y2="280" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                    <line x1="160" y1="20" x2="380" y2="300" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
                    <line x1="30" y1="200" x2="520" y2="100" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
                    <line x1="70" y1="140" x2="480" y2="220" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />

                    {/* Dashed Route line for auto reroute (from Overloaded Kenanga to Safe Flamboyan) */}
                    <line
                      x1="320"
                      y1="240"
                      x2="260"
                      y2="215"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeDasharray="5,4"
                    />

                    {/* Render each TPS Pin Marker on the SVG */}
                    {TPS_LIST.map((tps) => {
                      const isSelected = selectedTpsId === tps.id;
                      return (
                        <g
                          key={tps.id}
                          className="warga-map-pin-group"
                          onClick={() => setSelectedTpsId(tps.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Pulsing ring if selected */}
                          {isSelected && (
                            <circle
                              cx={tps.x}
                              cy={tps.y}
                              r="16"
                              fill="none"
                              stroke={tps.dotColor}
                              strokeWidth="2"
                              opacity="0.8"
                              className="warga-svg-pulse-ring"
                            />
                          )}

                          {/* Outer White Halo */}
                          <circle cx={tps.x} cy={tps.y} r="10" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />

                          {/* Inner Colored Dot */}
                          <circle cx={tps.x} cy={tps.y} r="6" fill={tps.dotColor} />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating Map Legend Bottom Left */}
                  <div className="warga-map-legend-box">
                    <div className="warga-legend-title">LEGENDA TPS</div>
                    <div className="warga-legend-item">
                      <span className="warga-dot green"></span>
                      <span>Aman &lt; 75%</span>
                    </div>
                    <div className="warga-legend-item">
                      <span className="warga-dot yellow"></span>
                      <span>Hampir Penuh &gt; 75%</span>
                    </div>
                    <div className="warga-legend-item">
                      <span className="warga-dot red"></span>
                      <span>Overload &gt; 90%</span>
                    </div>
                    <div className="warga-legend-item" style={{ marginTop: '3px' }}>
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>- - &gt;</span>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Rute Pengalihan Otomatis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: 2 Stacked Status Detail Cards */}
              <div className="warga-tracking-right-col" style={{ flex: 1 }}>
                {/* Card 1: Selected TPS Details & Progress */}
                <div className="warga-panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TPS Pilihan</span>
                    <span className={`warga-status-tag ${selectedTps.color}`}>
                      {selectedTps.color === 'green' && '✓ AMAN'}
                      {selectedTps.color === 'yellow' && '⚠️ WASPADA'}
                      {selectedTps.color === 'red' && '⛔ OVERLOAD'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                    {selectedTps.name}
                  </h4>

                  <div className="warga-bar-track" style={{ height: '8px', marginBottom: '8px' }}>
                    <div
                      className={`warga-bar-fill ${selectedTps.color}`}
                      style={{ width: `${selectedTps.capacity}%` }}
                    ></div>
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                    {selectedTps.capacity}% terisi
                  </div>
                </div>

                {/* Card 2: Recommendation Info Banner */}
                <div className={`warga-recommendation-card ${selectedTps.color}`}>
                  <div className="warga-rec-icon-box">
                    {selectedTps.color === 'green' && '✅'}
                    {selectedTps.color === 'yellow' && '⚠️'}
                    {selectedTps.color === 'red' && '⛔'}
                  </div>
                  <h5 className="warga-rec-title">
                    {selectedTps.color === 'green' && 'TPS ini masih aman!'}
                    {selectedTps.color === 'yellow' && 'Kapasitas Mendekati Batas!'}
                    {selectedTps.color === 'red' && 'TPS Sedang Overload!'}
                  </h5>
                  <p className="warga-rec-desc">
                    {selectedTps.color === 'green' &&
                      `Kamu bisa langsung menyetorkan sampah terpilah ke ${selectedTps.name}.`}
                    {selectedTps.color === 'yellow' &&
                      `Disarankan menyetor sebelum pukul 12:00 atau beralih ke TPS Mawar terdekat.`}
                    {selectedTps.color === 'red' &&
                      `Sistem secara otomatis mengalihkan rute Anda ke TPS Flamboyan / TPS Mawar terdekat.`}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="warga-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
