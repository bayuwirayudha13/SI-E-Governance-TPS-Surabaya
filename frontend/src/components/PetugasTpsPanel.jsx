import React, { useState, useEffect, useRef } from 'react';
import './PetugasTpsPanel.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { authService } from '../api/client';
import pandawaraImg from '../assets/images/berita_pandawara.jpg';
import kaliTebuImg from '../assets/images/berita_kali_tebu.jpg';
import bankSampahImg from '../assets/images/bank_sampah.jpg';
import pilahAsnImg from '../assets/images/berita_pilah_asn.jpg';

// Coordinate center: Sukamaju / Gubeng, Surabaya
const SUKAMAJU_CENTER = [-7.2750, 112.7550];

// 6 TPS in Kelurahan Sukamaju with realistic locations and statuses
const INITIAL_TPS_LIST = [
  {
    id: 'TPS-01',
    nama: 'TPS Mawar',
    kapasitas: 68,
    status: 'AMAN',
    color: '#16a34a',
    lat: -7.2720,
    lng: 112.7520,
    alamat: 'Jl. Mawar No. 14, Sukamaju',
    tonaseHariIni: 4.2
  },
  {
    id: 'TPS-02',
    nama: 'TPS Melati',
    kapasitas: 82,
    status: 'HAMPIR PENUH',
    color: '#f59e0b',
    lat: -7.2680,
    lng: 112.7600,
    alamat: 'Jl. Melati No. 8, Sukamaju',
    tonaseHariIni: 5.8
  },
  {
    id: 'TPS-03',
    nama: 'TPS Kenanga',
    kapasitas: 94,
    status: 'OVERLOAD',
    color: '#ef4444',
    lat: -7.2800,
    lng: 112.7550,
    alamat: 'Jl. Kenanga No. 22, Sukamaju',
    tonaseHariIni: 7.1
  },
  {
    id: 'TPS-04',
    nama: 'TPS Flamboyan',
    kapasitas: 45,
    status: 'AMAN',
    color: '#16a34a',
    lat: -7.2620,
    lng: 112.7480,
    alamat: 'Jl. Flamboyan No. 5, Sukamaju',
    tonaseHariIni: 2.9
  },
  {
    id: 'TPS-05',
    nama: 'TPS Cempaka',
    kapasitas: 77,
    status: 'HAMPIR PENUH',
    color: '#f59e0b',
    lat: -7.2850,
    lng: 112.7620,
    alamat: 'Jl. Cempaka No. 19, Sukamaju',
    tonaseHariIni: 5.2
  },
  {
    id: 'TPS-06',
    nama: 'TPS Dahlia',
    kapasitas: 31,
    status: 'AMAN',
    color: '#16a34a',
    lat: -7.2760,
    lng: 112.7420,
    alamat: 'Jl. Dahlia No. 3, Sukamaju',
    tonaseHariIni: 1.8
  }
];

// Circular progress component for capacity ring
function CircularProgressGauge({ percentage, size = 68, strokeWidth = 7, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const gaugeColor = color || (percentage > 90 ? '#ef4444' : percentage >= 75 ? '#f59e0b' : '#16a34a');

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size >= 64 ? '0.88rem' : '0.75rem',
        color: '#0f172a'
      }}>
        {percentage}%
      </div>
    </div>
  );
}

export default function PetugasTpsPanel({ onLogout, currentUser }) {
  // Navigation: 'dasbor' | 'peta' | 'kapasitas' | 'jadwal' | 'validasi'
  const [activeMenu, setActiveMenu] = useState('dasbor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Officer info
  const officerName = currentUser?.nama_lengkap || currentUser?.nama || 'Budi';
  const officerRole = 'Petugas Kelurahan';
  const kelurahanName = currentUser?.wilayah_kelurahan || currentUser?.kelurahan || 'Sukamaju';

  // Map state
  const [mapFilter, setMapFilter] = useState('Semua'); // 'Semua' | 'Aman' | 'Waspada' | 'Overload'
  const [selectedRouteTps, setSelectedRouteTps] = useState(null);

  // References for leaflet maps
  const dashMapRef = useRef(null);
  const dashMapInstance = useRef(null);
  const fullMapRef = useRef(null);
  const fullMapInstance = useRef(null);

  // Jadwal Truk state
  const [truckSchedules, setTruckSchedules] = useState([
    {
      id: 1,
      rute: 'Rute A – Jl. Mawar',
      plat: 'B 1234 XY',
      supir: 'Hendra',
      jam: '06:00–08:30',
      status: 'Selesai'
    },
    {
      id: 2,
      rute: 'Rute B – Jl. Melati',
      plat: 'B 5678 AB',
      supir: 'Wahyu',
      jam: '08:00–10:30',
      status: 'Berjalan'
    },
    {
      id: 3,
      rute: 'Rute C – Jl. Kenanga',
      plat: 'B 9012 CD',
      supir: 'Rizki',
      jam: '10:00–12:30',
      status: 'Menunggu'
    },
    {
      id: 4,
      rute: 'Rute D – Jl. Flamboyan',
      plat: 'B 3456 EF',
      supir: 'Agus',
      jam: '13:00–15:30',
      status: 'Menunggu'
    }
  ]);
  const [isAddTruckModalOpen, setIsAddTruckModalOpen] = useState(false);
  const [newTruckForm, setNewTruckForm] = useState({
    rute: '',
    plat: '',
    supir: '',
    jam: '08:00–10:30',
    status: 'Menunggu'
  });

  // Validasi Warga Reports state
  const [reports, setReports] = useState([
    {
      id: 1,
      refId: 'LAP-0081',
      warga: 'Pak Jaka Susanto',
      organik: '2.0 kg',
      anorganik: '1.0 kg',
      jam: '07:32 WIB',
      tagKualitas: 'BERSIH',
      status: 'Terverifikasi',
      foto: bankSampahImg,
      deteksiAi: 'Pemilahan sangat bersih dan sesuai standar.',
      skorAi: 96,
      poin: 45
    },
    {
      id: 2,
      refId: 'LAP-0082',
      warga: 'Ibu Sari Rahayu',
      organik: '1.5 kg',
      anorganik: '0.5 kg',
      jam: '08:15 WIB',
      tagKualitas: 'BERSIH',
      status: 'Terverifikasi',
      foto: kaliTebuImg,
      deteksiAi: 'Sampah dipisah dengan baik, residu minim.',
      skorAi: 92,
      poin: 30
    },
    {
      id: 3,
      refId: 'LAP-0083',
      warga: 'Pak Dedi Kurnia',
      organik: '3.0 kg',
      anorganik: '2.0 kg',
      jam: '09:01 WIB',
      tagKualitas: 'ADA CAMPURAN',
      status: 'Menunggu',
      foto: pandawaraImg,
      deteksiAi: 'Terlihat residu/jenis material lain. Perlu pemeriksaan manual sebelum poin diberikan.',
      skorAi: 78,
      poin: 60
    },
    {
      id: 4,
      refId: 'LAP-0084',
      warga: 'Ibu Wulan Sari',
      organik: '0.8 kg',
      anorganik: '1.2 kg',
      jam: '09:44 WIB',
      tagKualitas: 'BERSIH',
      status: 'Terverifikasi',
      foto: pilahAsnImg,
      deteksiAi: 'Pemilahan memenuhi kriteria penerimaan TPS.',
      skorAi: 88,
      poin: 25
    },
    {
      id: 5,
      refId: 'LAP-0085',
      warga: 'Pak Ari Wibowo',
      organik: '2.5 kg',
      anorganik: '0.0 kg',
      jam: '10:20 WIB',
      tagKualitas: 'CAMPURAN',
      status: 'Ditolak',
      foto: bankSampahImg,
      deteksiAi: 'Banyak tercampur bahan anorganik kotor.',
      skorAi: 42,
      poin: 0
    }
  ]);
  const [selectedReportId, setSelectedReportId] = useState(3);
  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch hash routing on menu change
  const handleNavClick = (menuKey) => {
    setActiveMenu(menuKey);
    setMobileMenuOpen(false);
    window.location.hash = `petugas-tps/${menuKey}`;
  };

  // Sync hash routing if present
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('peta')) setActiveMenu('peta');
    else if (hash.includes('kapasitas')) setActiveMenu('kapasitas');
    else if (hash.includes('jadwal')) setActiveMenu('jadwal');
    else if (hash.includes('validasi')) setActiveMenu('validasi');
  }, []);

  // Filtered TPS list for map
  const filteredTps = INITIAL_TPS_LIST.filter((tps) => {
    if (mapFilter === 'Aman') return tps.kapasitas <= 75;
    if (mapFilter === 'Waspada') return tps.kapasitas > 75 && tps.kapasitas <= 90;
    if (mapFilter === 'Overload') return tps.kapasitas > 90;
    return true;
  });

  // =========================================================================
  // DASHBOARD MAP INITIALIZATION
  // =========================================================================
  useEffect(() => {
    if (activeMenu !== 'dasbor' || !dashMapRef.current) return;

    if (dashMapInstance.current) {
      dashMapInstance.current.remove();
      dashMapInstance.current = null;
    }

    const map = L.map(dashMapRef.current, {
      center: SUKAMAJU_CENTER,
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });
    dashMapInstance.current = map;

    // Standard Clean OSM layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    // Add markers
    filteredTps.forEach((tps) => {
      const markerColor = tps.kapasitas > 90 ? '#dc2626' : tps.kapasitas >= 75 ? '#d97706' : '#15803d';
      const customIcon = L.divIcon({
        className: 'custom-tps-marker',
        html: `
          <div style="
            width: 22px; 
            height: 22px; 
            border-radius: 50%; 
            background-color: ${markerColor}; 
            border: 3px solid #ffffff; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([tps.lat, tps.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; padding: 4px;">
          <strong style="font-size: 14px; color: #0f172a;">${tps.nama}</strong><br/>
          <span style="color: #64748b;">${tps.alamat}</span><br/>
          <div style="margin-top: 6px; font-weight: 700; color: ${markerColor};">
            Kapasitas: ${tps.kapasitas}% (${tps.status})
          </div>
        </div>
      `);
    });

    // Draw dashed polyline for Automatic Reroute (TPS Kenanga 94% -> TPS Mawar 68%)
    const rerouteCoords = [
      [-7.2800, 112.7550], // TPS Kenanga
      [-7.2760, 112.7535],
      [-7.2720, 112.7520]  // TPS Mawar
    ];
    L.polyline(rerouteCoords, {
      color: '#15803d',
      weight: 3.5,
      dashArray: '6, 8',
      opacity: 0.9
    }).addTo(map);

    return () => {
      if (dashMapInstance.current) {
        dashMapInstance.current.remove();
        dashMapInstance.current = null;
      }
    };
  }, [activeMenu, mapFilter]);

  // =========================================================================
  // FULL PETA GIS INITIALIZATION
  // =========================================================================
  useEffect(() => {
    if (activeMenu !== 'peta' || !fullMapRef.current) return;

    if (fullMapInstance.current) {
      fullMapInstance.current.remove();
      fullMapInstance.current = null;
    }

    const map = L.map(fullMapRef.current, {
      center: SUKAMAJU_CENTER,
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });
    fullMapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    INITIAL_TPS_LIST.forEach((tps) => {
      const markerColor = tps.kapasitas > 90 ? '#dc2626' : tps.kapasitas >= 75 ? '#d97706' : '#15803d';
      const customIcon = L.divIcon({
        className: 'custom-tps-marker-large',
        html: `
          <div style="
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            background-color: ${markerColor}; 
            border: 3px solid #ffffff; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
          ">
            ${tps.kapasitas}%
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const m = L.marker([tps.lat, tps.lng], { icon: customIcon }).addTo(map);
      m.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; padding: 4px;">
          <strong style="font-size: 14px; color: #0f172a;">${tps.nama} (${tps.id})</strong><br/>
          <span style="color: #64748b;">${tps.alamat}</span><br/>
          <div style="margin-top: 6px; font-weight: 700; color: ${markerColor};">
            Kapasitas: ${tps.kapasitas}% (${tps.status})
          </div>
          <div style="margin-top: 4px; font-size: 12px; color: #334155;">
            Estimasi Tonase Masuk: <strong>${tps.tonaseHariIni} Ton</strong>
          </div>
        </div>
      `);
    });

    // Dashed reroute line
    L.polyline([
      [-7.2800, 112.7550],
      [-7.2760, 112.7535],
      [-7.2720, 112.7520]
    ], {
      color: '#15803d',
      weight: 4,
      dashArray: '8, 8'
    }).addTo(map);

    return () => {
      if (fullMapInstance.current) {
        fullMapInstance.current.remove();
        fullMapInstance.current = null;
      }
    };
  }, [activeMenu]);

  // Focus a TPS route on map
  const handleFocusTpsRoute = (tps) => {
    setSelectedRouteTps(tps);
    if (fullMapInstance.current) {
      fullMapInstance.current.flyTo([tps.lat, tps.lng], 16, { duration: 1.2 });
    }
  };

  // Add Truck Schedule
  const handleAddTruck = (e) => {
    e.preventDefault();
    if (!newTruckForm.rute || !newTruckForm.plat || !newTruckForm.supir) {
      alert('Mohon lengkapi data rute, plat nomor, dan nama pengemudi.');
      return;
    }
    const newItem = {
      id: Date.now(),
      ...newTruckForm
    };
    setTruckSchedules((prev) => [newItem, ...prev]);
    setIsAddTruckModalOpen(false);
    setNewTruckForm({
      rute: '',
      plat: '',
      supir: '',
      jam: '08:00–10:30',
      status: 'Menunggu'
    });
    showToast(`Jadwal truk baru untuk "${newItem.rute}" berhasil ditambahkan!`);
  };

  // Run AI Scan on Report Photo
  const handleScanReport = () => {
    setIsScanningAi(true);
    setTimeout(() => {
      setIsScanningAi(false);
      showToast(`Scan AI selesai: Terdeteksi campuran pada sampah sebesar 78%.`);
    }, 1200);
  };

  // Verify and approve reward
  const handleApproveReport = () => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === activeReport.id ? { ...r, status: 'Terverifikasi', tagKualitas: 'BERSIH' } : r
      )
    );
    showToast(`Setoran ${activeReport.warga} berhasil disetujui! Reward ${activeReport.poin} poin telah dikreditkan.`);
  };

  // Reject / Request Re-sort
  const handleRejectReport = () => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === activeReport.id ? { ...r, status: 'Ditolak' } : r
      )
    );
    showToast(`Setoran ${activeReport.warga} telah ditolak. Notifikasi perbaikan telah dikirim ke warga.`);
  };

  return (
    <div className="tps-page-container">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="tps-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* =========================================================================
          LEFT SIDEBAR (EXACT MATCH TO DESIGN)
          ========================================================================= */}
      <aside className={`tps-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div>
          {/* Logo Brand */}
          <div className="tps-sidebar-brand">
            <div className="tps-brand-badge">SI</div>
            <div className="tps-brand-texts">
              <span className="tps-brand-title">SI-PETASAN</span>
              <span className="tps-brand-subtitle">KELURAHAN {kelurahanName.toUpperCase()}</span>
            </div>
          </div>

          {/* Nav List */}
          <div className="tps-menu-section-label">MENU UTAMA</div>
          <nav className="tps-nav-list">
            {/* 1. Dasbor Utama */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'dasbor' ? 'active' : ''}`}
              onClick={() => handleNavClick('dasbor')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
              </svg>
              <span>Dasbor Utama</span>
            </button>

            {/* 2. Peta GIS */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'peta' ? 'active' : ''}`}
              onClick={() => handleNavClick('peta')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>Peta GIS</span>
            </button>

            {/* 3. Status Kapasitas TPS */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'kapasitas' ? 'active' : ''}`}
              onClick={() => handleNavClick('kapasitas')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>Status Kapasitas TPS</span>
            </button>

            {/* 4. Jadwal Truk */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'jadwal' ? 'active' : ''}`}
              onClick={() => handleNavClick('jadwal')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>Jadwal Truk</span>
            </button>

            {/* 5. Validasi Warga (Reward) */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'validasi' ? 'active' : ''}`}
              onClick={() => handleNavClick('validasi')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Validasi Warga (Reward)</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="tps-sidebar-bottom">
          <div className="tps-user-card">
            <div className="tps-user-avatar">
              {officerName.charAt(0).toUpperCase()}
            </div>
            <div className="tps-user-info">
              <span className="tps-user-name">{officerName}</span>
              <span className="tps-user-role">{officerRole}</span>
            </div>
          </div>

          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = 'beranda';
              if (onLogout) onLogout();
            }}
            className="tps-back-home-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA
          ========================================================================= */}
      <main className="tps-main-area">
        {/* Sticky Header Topbar */}
        <header className="tps-topbar">
          <div className="tps-topbar-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="tps-mobile-toggle-btn"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1 className="tps-topbar-title">
                {activeMenu === 'dasbor' && 'Dasbor Utama'}
                {activeMenu === 'peta' && 'Peta GIS'}
                {activeMenu === 'kapasitas' && 'Status Kapasitas TPS'}
                {activeMenu === 'jadwal' && 'Jadwal Truk'}
                {activeMenu === 'validasi' && 'Validasi Warga (Reward)'}
              </h1>
            </div>
            <span className="tps-topbar-subtitle">
              SI-PETASAN · Kelurahan {kelurahanName} · Rabu, 28 Oktober 2026
            </span>
          </div>

          <div className="tps-topbar-right">
            {/* Search Input */}
            <div className="tps-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Cari TPS, warga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="tps-icon-btn"
              title="Notifikasi"
              onClick={() => showToast('Tidak ada notifikasi kritis baru.')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="tps-badge-dot"></span>
            </button>

            {/* User Profile Badge */}
            <div className="tps-user-badge-header">
              <div className="tps-user-avatar">
                {officerName.charAt(0).toUpperCase()}
              </div>
              <div className="tps-user-info" style={{ display: 'none', minWidth: 0 }}>
                <span className="tps-user-name">{officerName}</span>
                <span className="tps-user-role">{officerRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease'
          }}>
            <span>🔔</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* =====================================================================
            TAB 1: DASBOR UTAMA
            ===================================================================== */}
        {activeMenu === 'dasbor' && (
          <div className="tps-content-body">
            {/* Top Amber Warning Banner */}
            <div className="tps-alert-banner">
              <div className="tps-alert-left">
                <svg className="tps-alert-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p className="tps-alert-text">
                  <strong className="tps-alert-strong">TPS Kenanga (94%)</strong> melampaui batas Overload. Pengalihan otomatis ke TPS Mawar (68%) sudah diaktifkan.
                </p>
              </div>
              <button
                type="button"
                className="tps-alert-link"
                onClick={() => handleNavClick('peta')}
              >
                <span>Lihat Rute</span>
                <span>→</span>
              </button>
            </div>

            {/* 4 Stat Cards */}
            <div className="tps-stats-grid">
              <div className="tps-stat-card">
                <span className="tps-stat-label">Total Sampah Hari Ini</span>
                <span className="tps-stat-value">109.1 <small style={{ fontSize: '1rem', fontWeight: 600 }}>ton</small></span>
                <span className="tps-stat-subtext trend-up">↑ 12% dari kemarin</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Sampah Terpilah</span>
                <span className="tps-stat-value">34.2 <small style={{ fontSize: '1rem', fontWeight: 600 }}>ton</small></span>
                <span className="tps-stat-subtext trend-muted">Tingkat pemilahan 31%</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">TPS Hampir Penuh</span>
                <span className="tps-stat-value" style={{ color: '#ea580c' }}>2 <small style={{ fontSize: '1rem', fontWeight: 600 }}>lokasi</small></span>
                <span className="tps-stat-subtext trend-warn">≥75% kapasitas</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Warga Aktif Reward</span>
                <span className="tps-stat-value" style={{ color: '#0284c7' }}>284 <small style={{ fontSize: '1rem', fontWeight: 600 }}>warga</small></span>
                <span className="tps-stat-subtext trend-info">Total poin: 58.400</span>
              </div>
            </div>

            {/* Middle Grid: Map (Left) & Capacity List (Right) */}
            <div className="tps-dash-split-grid">
              {/* Left Column: Peta GIS Interaktif */}
              <div className="tps-card">
                <div className="tps-card-header">
                  <div className="tps-card-title-group">
                    <h3 className="tps-card-title">Peta GIS Interaktif — TPS Wilayah</h3>
                    <span className="tps-card-subtitle">Real-time · 6 titik TPS terpantau</span>
                  </div>

                  {/* Filter Pills */}
                  <div className="tps-filter-pills">
                    {['Semua', 'Aman', 'Waspada', 'Overload'].map((filterName) => (
                      <button
                        key={filterName}
                        type="button"
                        className={`tps-pill-btn ${mapFilter === filterName ? 'active' : ''}`}
                        onClick={() => setMapFilter(filterName)}
                      >
                        {filterName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leaflet Map Container */}
                <div className="tps-map-viewport-wrapper">
                  <div ref={dashMapRef} style={{ width: '100%', height: '100%' }}></div>

                  {/* Live tag top right */}
                  <div className="tps-map-live-tag">
                    <span className="tps-live-pulse-dot"></span>
                    <span>LIVE · 5 mnt lalu</span>
                  </div>

                  {/* Legend bottom left */}
                  <div className="tps-map-legend-overlay">
                    <span className="tps-legend-title">LEGENDA TPS</span>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#16a34a' }}></span>
                      <span>Aman &lt; 75%</span>
                    </div>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#f59e0b' }}></span>
                      <span>Hampir Penuh ≥ 75%</span>
                    </div>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#ef4444' }}></span>
                      <span>Overload &gt; 90%</span>
                    </div>
                    <div className="tps-legend-item">
                      <span className="tps-legend-dashed-line"></span>
                      <span>Rute Pengalihan Otomatis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Status Kapasitas TPS List */}
              <div className="tps-card">
                <div className="tps-card-header">
                  <h3 className="tps-card-title">Status Kapasitas TPS</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>6 titik</span>
                </div>

                <div className="tps-capacity-list">
                  {INITIAL_TPS_LIST.map((tps) => (
                    <div key={tps.id} className="tps-capacity-item-card">
                      <div className="tps-capacity-item-top">
                        <div>
                          <span className="tps-id-code">{tps.id}</span>
                          <h4 className="tps-item-name">{tps.nama}</h4>
                        </div>
                        <span className={`tps-status-badge ${tps.kapasitas > 90 ? 'overload' : tps.kapasitas >= 75 ? 'hampir-penuh' : 'aman'}`}>
                          {tps.status}
                        </span>
                      </div>

                      <div className="tps-capacity-metric-row">
                        <CircularProgressGauge percentage={tps.kapasitas} size={62} />
                        <div className="tps-progress-bar-wrap">
                          <div className="tps-progress-bar-labels">
                            <span>Kapasitas terisi</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{tps.kapasitas}%</span>
                          </div>
                          <div className="tps-progress-track">
                            <div
                              className={`tps-progress-fill ${tps.kapasitas > 90 ? 'overload' : tps.kapasitas >= 75 ? 'hampir-penuh' : 'aman'}`}
                              style={{ width: `${tps.kapasitas}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Statistik Tonase Harian Combined Chart */}
            <div className="tps-card">
              <div className="tps-card-header">
                <div className="tps-card-title-group">
                  <h3 className="tps-card-title">Statistik Tonase Harian</h3>
                  <span className="tps-card-subtitle">Volume sampah masuk &amp; terpilah (ton) — 7 hari terakhir</span>
                </div>

                <div className="tps-chart-legend">
                  <div className="tps-chart-legend-item">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#15803d' }}></span>
                    <span>Masuk TPS</span>
                  </div>
                  <div className="tps-chart-legend-item">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                    <span>Terpilah</span>
                  </div>
                </div>
              </div>

              {/* Tonase SVG Chart */}
              <div className="tps-tonase-chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* Grid lines and Y labels (0, 6, 12, 18, 24) */}
                  {[
                    { label: '24', y: 20 },
                    { label: '18', y: 60 },
                    { label: '12', y: 100 },
                    { label: '6', y: 140 },
                    { label: '0', y: 180 }
                  ].map((grid, idx) => (
                    <g key={idx}>
                      <text x="10" y={grid.y + 4} fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
                        {grid.label}
                      </text>
                      <line x1="35" y1={grid.y} x2="790" y2={grid.y} stroke="#f1f5f9" strokeWidth="1" />
                    </g>
                  ))}

                  {/* Daily data: Sen (x=90), Sel (x=195), Rab (x=300), Kam (x=405), Jum (x=510), Sab (x=615), Min (x=720) */}
                  {[
                    { day: 'Sen', x: 90, barVal: 3.2, lineVal: 12.8 },
                    { day: 'Sel', x: 195, barVal: 4.8, lineVal: 15.4 },
                    { day: 'Rab', x: 300, barVal: 3.9, lineVal: 12.1 },
                    { day: 'Kam', x: 405, barVal: 5.6, lineVal: 17.5 },
                    { day: 'Jum', x: 510, barVal: 6.2, lineVal: 19.0 },
                    { day: 'Sab', x: 615, barVal: 7.5, lineVal: 22.3 },
                    { day: 'Min', x: 720, barVal: 3.1, lineVal: 10.2 }
                  ].map((pt, idx) => {
                    // Height calculation: 180 is zero, 20 is 24 ton (scale = 160 / 24 = 6.66 px/ton)
                    const barHeight = pt.barVal * 6.66;
                    const barY = 180 - barHeight;

                    return (
                      <g key={idx}>
                        {/* Amber Rounded Bar for Terpilah */}
                        <rect
                          x={pt.x - 22}
                          y={barY}
                          width="44"
                          height={barHeight}
                          rx="4"
                          fill="#facc15"
                          opacity="0.9"
                        />
                        {/* X-axis Day label */}
                        <text
                          x={pt.x}
                          y="196"
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="12"
                          fontWeight="600"
                          fontFamily="sans-serif"
                        >
                          {pt.day}
                        </text>
                      </g>
                    );
                  })}

                  {/* Line Chart path for Masuk TPS */}
                  <polyline
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="
                      90,94.7 
                      195,77.4 
                      300,99.4 
                      405,63.4 
                      510,53.4 
                      615,31.4 
                      720,112.0
                    "
                  />

                  {/* Line chart data points */}
                  {[
                    { cx: 90, cy: 94.7 },
                    { cx: 195, cy: 77.4 },
                    { cx: 300, cy: 99.4 },
                    { cx: 405, cy: 63.4 },
                    { cx: 510, cy: 53.4 },
                    { cx: 615, cy: 31.4 },
                    { cx: 720, cy: 112.0 }
                  ].map((dot, idx) => (
                    <circle
                      key={idx}
                      cx={dot.cx}
                      cy={dot.cy}
                      r="4.5"
                      fill="#15803d"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: PETA GIS
            ===================================================================== */}
        {activeMenu === 'peta' && (
          <div className="tps-content-body">
            <div className="tps-card">
              <div className="tps-card-header">
                <div className="tps-card-title-group">
                  <h3 className="tps-card-title">Peta Operasional TPS</h3>
                  <span className="tps-card-subtitle">Pantau kapasitas, lokasi, dan rute pengalihan secara langsung.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: '0.8rem', fontWeight: 800 }}>
                  <span className="tps-live-pulse-dot"></span>
                  <span>DATA LIVE</span>
                </div>
              </div>

              {/* Full Width GIS Map */}
              <div className="tps-map-viewport-large">
                <div ref={fullMapRef} style={{ width: '100%', height: '100%' }}></div>

                <div className="tps-map-live-tag">
                  <span className="tps-live-pulse-dot"></span>
                  <span>LIVE · 5 mnt lalu</span>
                </div>

                <div className="tps-map-legend-overlay">
                  <span className="tps-legend-title">LEGENDA TPS</span>
                  <div className="tps-legend-item">
                    <span className="tps-legend-bullet" style={{ backgroundColor: '#16a34a' }}></span>
                    <span>Aman &lt; 75%</span>
                  </div>
                  <div className="tps-legend-item">
                    <span className="tps-legend-bullet" style={{ backgroundColor: '#f59e0b' }}></span>
                    <span>Hampir Penuh ≥ 75%</span>
                  </div>
                  <div className="tps-legend-item">
                    <span className="tps-legend-bullet" style={{ backgroundColor: '#ef4444' }}></span>
                    <span>Overload &gt; 90%</span>
                  </div>
                  <div className="tps-legend-item">
                    <span className="tps-legend-dashed-line"></span>
                    <span>Rute Pengalihan Otomatis</span>
                  </div>
                </div>
              </div>

              {/* Bottom 3 TPS Route Quick Action Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                {INITIAL_TPS_LIST.slice(0, 3).map((tps) => (
                  <div
                    key={tps.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: tps.color,
                          flexShrink: 0
                        }}
                      ></span>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>{tps.nama}</h5>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{tps.id} · kapasitas {tps.kapasitas}%</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFocusTpsRoute(tps)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        cursor: 'pointer'
                      }}
                    >
                      Lihat rute
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: STATUS KAPASITAS TPS (GRID 6 CARDS)
            ===================================================================== */}
        {activeMenu === 'kapasitas' && (
          <div className="tps-content-body">
            {/* Top 3 Summaries */}
            <div className="tps-capacity-top-summaries">
              <div className="tps-summary-card aman">
                <span className="tps-summary-title">Kapasitas aman</span>
                <span className="tps-summary-value">3 <small style={{ fontSize: '1rem' }}>TPS</small></span>
                <span className="tps-summary-sub">Diperbarui 5 menit lalu</span>
              </div>

              <div className="tps-summary-card waspada">
                <span className="tps-summary-title">Perlu dijadwalkan</span>
                <span className="tps-summary-value" style={{ color: '#d97706' }}>2 <small style={{ fontSize: '1rem' }}>TPS</small></span>
                <span className="tps-summary-sub">Diperbarui 5 menit lalu</span>
              </div>

              <div className="tps-summary-card bahaya">
                <span className="tps-summary-title">Perlu tindakan segera</span>
                <span className="tps-summary-value" style={{ color: '#dc2626' }}>1 <small style={{ fontSize: '1rem' }}>TPS</small></span>
                <span className="tps-summary-sub">Diperbarui 5 menit lalu</span>
              </div>
            </div>

            {/* 6 Cards Grid (2 cols x 3 rows) */}
            <div className="tps-capacity-6grid">
              {INITIAL_TPS_LIST.map((tps) => {
                const isOverload = tps.kapasitas > 90;
                const isWarning = tps.kapasitas >= 75 && !isOverload;

                return (
                  <div key={tps.id} className="tps-detailed-card">
                    <div className="tps-detailed-card-header">
                      <div className="tps-card-title-col">
                        <span className="tps-id-code">{tps.id}</span>
                        <h4 className="tps-item-name" style={{ fontSize: '1.05rem' }}>{tps.nama}</h4>
                      </div>
                      <span className={`tps-status-badge ${isOverload ? 'overload' : isWarning ? 'hampir-penuh' : 'aman'}`}>
                        {tps.status}
                      </span>
                    </div>

                    <div className="tps-capacity-metric-row">
                      <CircularProgressGauge percentage={tps.kapasitas} size={76} />
                      <div className="tps-progress-bar-wrap">
                        <div className="tps-progress-bar-labels">
                          <span>Kapasitas terisi</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{tps.kapasitas}%</span>
                        </div>
                        <div className="tps-progress-track">
                          <div
                            className={`tps-progress-fill ${isOverload ? 'overload' : isWarning ? 'hampir-penuh' : 'aman'}`}
                            style={{ width: `${tps.kapasitas}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Action button if almost full or overload */}
                    {(isWarning || isOverload) && (
                      <button
                        type="button"
                        className={`tps-btn-outline-action ${isOverload ? 'red' : 'orange'}`}
                        onClick={() => {
                          showToast(`Rekomendasi pengalihan terdekat untuk ${tps.nama} dialihkan ke TPS Mawar (68% kapasitas).`);
                        }}
                      >
                        <span>Cari TPS Terdekat</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: JADWAL TRUK
            ===================================================================== */}
        {activeMenu === 'jadwal' && (
          <div className="tps-content-body">
            {/* 4 Top Horizontal Route Cards */}
            <div className="tps-truck-top-grid">
              {truckSchedules.slice(0, 4).map((item) => (
                <div key={item.id} className="tps-truck-route-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="tps-truck-icon-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                    </div>
                    <div>
                      <h4 className="tps-truck-route-name">{item.rute}</h4>
                      <p className="tps-truck-driver-plate">{item.plat} · {item.supir}</p>
                    </div>
                  </div>

                  <div className="tps-truck-card-bottom">
                    <span className="tps-truck-time-label">{item.jam}</span>
                    <span className={`tps-truck-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule List & Add Card */}
            <div className="tps-card">
              <div className="tps-card-header">
                <div className="tps-card-title-group">
                  <h3 className="tps-card-title">Jadwal Truk Pengangkut</h3>
                  <span className="tps-card-subtitle">Rabu, 28 Oktober</span>
                </div>

                <button
                  type="button"
                  className="tps-btn-add-green"
                  onClick={() => setIsAddTruckModalOpen(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Tambah</span>
                </button>
              </div>

              {/* Rows of Truck Schedules */}
              <div className="tps-schedule-rows-list">
                {truckSchedules.map((row) => (
                  <div key={row.id} className="tps-schedule-row-item">
                    <div className="tps-schedule-left-info">
                      <div className="tps-truck-icon-circle" style={{ width: 44, height: 44 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>{row.rute}</h4>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.plat} · {row.supir}</span>
                      </div>
                    </div>

                    <div className="tps-schedule-right-info">
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{row.jam}</span>
                      <span className={`tps-truck-badge ${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: VALIDASI WARGA (REWARD)
            ===================================================================== */}
        {activeMenu === 'validasi' && (
          <div className="tps-content-body">
            <div className="tps-validasi-split-layout">
              {/* Left Column: Queue list of submissions */}
              <div className="tps-card">
                <div className="tps-card-title-group" style={{ marginBottom: 16 }}>
                  <h3 className="tps-card-title">Antrean Laporan Setoran</h3>
                  <span className="tps-card-subtitle">Pilih laporan untuk memeriksa foto dan hasil pemilahan.</span>
                </div>

                <div className="tps-validation-queue-list">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className={`tps-queue-item ${rep.id === selectedReportId ? 'active' : ''}`}
                      onClick={() => setSelectedReportId(rep.id)}
                    >
                      <div className="tps-queue-item-left">
                        <img src={rep.foto} alt={rep.warga} className="tps-queue-thumb" />
                        <div className="tps-queue-info">
                          <span className="tps-queue-name">{rep.warga}</span>
                          <span className="tps-queue-desc">{rep.organik} organik · {rep.anorganik} anorganik · {rep.jam}</span>
                        </div>
                      </div>

                      <div className="tps-queue-tags">
                        <span className={`tps-tag-solid ${rep.tagKualitas === 'BERSIH' ? 'bersih' : 'campuran'}`}>
                          {rep.tagKualitas}
                        </span>
                        <span className={`tps-tag-soft ${rep.status.toLowerCase()}`}>
                          {rep.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Photo Inspection and AI Verification */}
              <div className="tps-inspection-photo-card">
                <div className="tps-card-header" style={{ marginBottom: 4 }}>
                  <div className="tps-card-title-group">
                    <h3 className="tps-card-title">Pemeriksaan Foto</h3>
                    <span className="tps-card-subtitle">{activeReport.warga}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>
                    {activeReport.refId}
                  </span>
                </div>

                {/* Photo Display */}
                <div className="tps-photo-preview-wrap">
                  <img
                    src={activeReport.foto}
                    alt="Pemeriksaan Sampah"
                    className="tps-photo-preview-img"
                  />
                  {isScanningAi && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(21, 128, 61, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 800,
                      gap: 12
                    }}>
                      <div className="tps-live-pulse-dot" style={{ width: 24, height: 24 }}></div>
                      <span>Sedang Memindai Sampah dengan AI...</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Unggah & Scan */}
                <div className="tps-inspection-actions-row">
                  <button
                    type="button"
                    className="tps-btn-photo-action outline"
                    onClick={() => showToast('Fitur unggah foto langsung dari kamera/file siap digunakan.')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>Unggah / Ambil Foto</span>
                  </button>

                  <button
                    type="button"
                    className="tps-btn-photo-action solid-green"
                    onClick={handleScanReport}
                    disabled={isScanningAi}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <span>{isScanningAi ? 'Memindai...' : 'Scan Foto Laporan'}</span>
                  </button>
                </div>

                {/* AI Detection Box */}
                <div className="tps-ai-detection-box">
                  <div className="tps-ai-text-col">
                    <h4 className="tps-ai-title">
                      {activeReport.skorAi >= 90 ? 'Pemilahan Terverifikasi Bersih' : 'Terdeteksi masih ada campuran'}
                    </h4>
                    <p className="tps-ai-desc">
                      {activeReport.deteksiAi}
                    </p>
                  </div>
                  <span className="tps-ai-score-large" style={{ color: activeReport.skorAi >= 90 ? '#16a34a' : '#ea580c' }}>
                    {activeReport.skorAi}%
                  </span>
                </div>

                {/* Decision Buttons */}
                <div className="tps-decision-buttons-row">
                  <button
                    type="button"
                    className="tps-btn-decision reject"
                    onClick={handleRejectReport}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Tolak / Minta Ulang</span>
                  </button>

                  <button
                    type="button"
                    className={`tps-btn-decision approve ${activeReport.status !== 'Terverifikasi' ? 'active-ready' : ''}`}
                    onClick={handleApproveReport}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{activeReport.status === 'Terverifikasi' ? 'Sudah Diberi Reward' : 'Setujui & Beri Reward'}</span>
                  </button>
                </div>

                <p className="tps-decision-caption">
                  Hasil scan membantu pemeriksaan. Keputusan akhir tetap dilakukan petugas.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: TAMBAH JADWAL TRUK
          ========================================================================= */}
      {isAddTruckModalOpen && (
        <div className="tps-modal-backdrop" onClick={() => setIsAddTruckModalOpen(false)}>
          <div className="tps-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="tps-modal-header">
              <h3>Tambah Jadwal Truk Baru</h3>
              <button
                type="button"
                className="tps-modal-close-btn"
                onClick={() => setIsAddTruckModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTruck}>
              <div className="tps-modal-body">
                <div className="tps-form-group">
                  <label>Nama Rute / Lokasi Pengambilan</label>
                  <input
                    type="text"
                    className="tps-form-input"
                    placeholder="Contoh: Rute E – Jl. Kertajaya"
                    value={newTruckForm.rute}
                    onChange={(e) => setNewTruckForm({ ...newTruckForm, rute: e.target.value })}
                    required
                  />
                </div>

                <div className="tps-form-group">
                  <label>Nomor Plat Armada</label>
                  <input
                    type="text"
                    className="tps-form-input"
                    placeholder="Contoh: L 9876 AB"
                    value={newTruckForm.plat}
                    onChange={(e) => setNewTruckForm({ ...newTruckForm, plat: e.target.value })}
                    required
                  />
                </div>

                <div className="tps-form-group">
                  <label>Nama Petugas Pengemudi</label>
                  <input
                    type="text"
                    className="tps-form-input"
                    placeholder="Contoh: Pak Bambang"
                    value={newTruckForm.supir}
                    onChange={(e) => setNewTruckForm({ ...newTruckForm, supir: e.target.value })}
                    required
                  />
                </div>

                <div className="tps-form-group">
                  <label>Slot Waktu Operasional</label>
                  <select
                    className="tps-form-select"
                    value={newTruckForm.jam}
                    onChange={(e) => setNewTruckForm({ ...newTruckForm, jam: e.target.value })}
                  >
                    <option value="06:00–08:30">06:00–08:30 (Pagi)</option>
                    <option value="08:00–10:30">08:00–10:30 (Pagi Menjelang Siang)</option>
                    <option value="10:00–12:30">10:00–12:30 (Siang)</option>
                    <option value="13:00–15:30">13:00–15:30 (Sore)</option>
                  </select>
                </div>
              </div>

              <div className="tps-modal-footer">
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsAddTruckModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tps-btn-add-green"
                  style={{ padding: '8px 18px' }}
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
