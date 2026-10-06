import React, { useState, useRef, useEffect } from 'react';
import './PetugasPanel.css';
import { api } from '../api/client';

export default function PetugasPanel({ onLogout, officerName = 'Hendra', officerRole = 'Petugas Pengangkut' }) {
  // Navigation: 'tugas' | 'scan' | 'riwayat'
  const [activeMenu, setActiveMenu] = useState('scan'); // Default or according to hash

  // Listen to hash changes if needed
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#tugas' || hash === '#tugas-hari-ini') {
        setActiveMenu('tugas');
      } else if (hash === '#scan' || hash === '#scan-qr') {
        setActiveMenu('scan');
      } else if (hash === '#riwayat' || hash === '#riwayat-pengambilan') {
        setActiveMenu('riwayat');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Stats in "Tugas Hari Ini" (matching Image 2)
  const [stats, setStats] = useState({
    targetPengambilan: 18,
    sudahDiambil: 7,
    persentaseSelesai: 39,
    totalMuatanKg: 128.5,
    kapasitasTruk: 32
  });

  // Next pickups queue in "Tugas Hari Ini" (matching Image 2)
  const [queueList, setQueueList] = useState([
    {
      id: 8,
      number: '08',
      name: 'Warga Sukamaju',
      address: 'RT 03 · Jl. Mawar',
      status: 'ready',
      statusText: 'Siap diambil',
      isActive: true,
      category: 'Botol Plastik (PET) & Kertas',
      estimatedKg: 2.5
    },
    {
      id: 9,
      number: '09',
      name: 'Ibu Sari Rahayu',
      address: 'RT 03 · Jl. Mawar No. 18',
      status: 'next',
      statusText: 'Berikutnya',
      isActive: false,
      category: 'Kardus & Plastik Campur',
      estimatedKg: 2.0
    },
    {
      id: 10,
      number: '10',
      name: 'Pak Jaka Susanto',
      address: 'RT 03 · Jl. Mawar No. 24',
      status: 'next',
      statusText: 'Berikutnya',
      isActive: false,
      category: 'Botol Plastik & Galon',
      estimatedKg: 3.0
    }
  ]);

  // Pickup History Table (matching Image 3)
  const [historyList, setHistoryList] = useState([
    {
      id: 1,
      waktu: '07.12',
      warga: 'Pak Jaka Susanto',
      berat: '3,0 kg',
      kondisi: 'Bersih',
      status: 'Selesai'
    },
    {
      id: 2,
      waktu: '07.28',
      warga: 'Ibu Sari Rahayu',
      berat: '2,0 kg',
      kondisi: 'Bersih',
      status: 'Selesai'
    },
    {
      id: 3,
      waktu: '08.15',
      warga: 'Warga Sukamaju',
      berat: '—',
      kondisi: 'Menunggu',
      status: 'Menunggu pengambilan'
    }
  ]);

  // Scan & Camera State (matching Image 1)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedWarga, setScannedWarga] = useState(null);
  const [weightInput, setWeightInput] = useState('2.5');
  const [selectedCondition, setSelectedCondition] = useState('Bersih');
  const [officerNote, setOfficerNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Start real or simulated camera
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch {
      // If permission is denied or running in environment without webcam,
      // the interactive animated viewfinder stays active gracefully.
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Trigger Demo Scan (as shown in button "Gunakan Kode Setoran Aktif untuk Demo")
  const handleTriggerDemo = () => {
    const currentActive = queueList[0] || {
      id: 8,
      number: '08',
      name: 'Warga Sukamaju',
      address: 'RT 03 · Jl. Mawar',
      category: 'Botol Plastik (PET)',
      estimatedKg: 2.5
    };

    setScannedWarga(currentActive);
    setWeightInput(String(currentActive.estimatedKg || 2.5));
    setSelectedCondition('Bersih');
    showToast(`QR Code ${currentActive.name} berhasil terdeteksi!`);
  };

  // Confirm Pickup action
  const handleConfirmPickup = () => {
    if (!scannedWarga) return;

    const beratVal = parseFloat(weightInput) || 2.5;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Update stats
    setStats((prev) => {
      const newTaken = prev.sudahDiambil + 1;
      const newMuatan = parseFloat((prev.totalMuatanKg + beratVal).toFixed(1));
      const newPercent = Math.min(100, Math.round((newTaken / prev.targetPengambilan) * 100));
      return {
        ...prev,
        sudahDiambil: newTaken,
        totalMuatanKg: newMuatan,
        persentaseSelesai: newPercent,
        kapasitasTruk: Math.min(100, Math.round((newMuatan / 400) * 100))
      };
    });

    // 2. Update history table
    setHistoryList((prev) => {
      // Check if this warga was already in history with status 'Menunggu pengambilan'
      const existingIdx = prev.findIndex((h) => h.warga.toLowerCase() === scannedWarga.name.toLowerCase());
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          waktu: timeStr,
          berat: `${beratVal.toFixed(1).replace('.', ',')} kg`,
          kondisi: selectedCondition,
          status: 'Selesai'
        };
        return updated;
      }
      return [
        {
          id: Date.now(),
          waktu: timeStr,
          warga: scannedWarga.name,
          berat: `${beratVal.toFixed(1).replace('.', ',')} kg`,
          kondisi: selectedCondition,
          status: 'Selesai'
        },
        ...prev
      ];
    });

    // 3. Update queue
    setQueueList((prev) => {
      const remaining = prev.filter((item) => item.id !== scannedWarga.id);
      if (remaining.length > 0) {
        remaining[0] = { ...remaining[0], isActive: true, status: 'ready', statusText: 'Siap diambil' };
      }
      return remaining;
    });

    // Try sending to backend if available (fire-and-forget)
    try {
      api.patch('/setoran/1/status', {
        status: 'Sudah Divalidasi',
        berat_aktual_kg: beratVal,
        catatan_petugas: officerNote
      }).catch(() => {});
    } catch {
      // ignore
    }

    showToast(`Pengambilan dari ${scannedWarga.name} berhasil disimpan!`);
    setScannedWarga(null);
    setOfficerNote('');
    stopCamera();
  };

  const handleCancelScan = () => {
    setScannedWarga(null);
  };

  // Helper title & subtitle for the top bar
  const getHeaderInfo = () => {
    switch (activeMenu) {
      case 'tugas':
        return {
          title: 'Tugas Hari Ini',
          sub: 'Rute A · B 1234 XY · Kelurahan Sukamaju'
        };
      case 'scan':
        return {
          title: 'Scan QR Warga',
          sub: 'Rute A · B 1234 XY · Kelurahan Sukamaju'
        };
      case 'riwayat':
        return {
          title: 'Riwayat Pengambilan',
          sub: 'Rute A · B 1234 XY · Kelurahan Sukamaju'
        };
      default:
        return {
          title: 'Tugas Hari Ini',
          sub: 'Rute A · B 1234 XY · Kelurahan Sukamaju'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="petugas-container">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="petugas-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          SIDEBAR
          ========================================================= */}
      <aside className="petugas-sidebar">
        <div>
          {/* Brand Logo & Title */}
          <div className="petugas-logo-badge" onClick={() => setActiveMenu('tugas')}>
            <div className="petugas-logo-icon">
              {/* Truck SVG Icon matching the mockups */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <div className="petugas-brand-name">SI-PETASAN</div>
              <div className="petugas-brand-tag">PETUGAS PENGANGKUT</div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="petugas-nav-section">
            <div className="petugas-nav-label">MENU LAPANGAN</div>
            <nav className="petugas-nav-menu">
              {/* 1. Tugas Hari Ini */}
              <button
                type="button"
                className={`petugas-nav-item ${activeMenu === 'tugas' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('tugas');
                  window.location.hash = 'tugas';
                }}
              >
                <div className="petugas-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <span>Tugas Hari Ini</span>
              </button>

              {/* 2. Scan QR Warga */}
              <button
                type="button"
                className={`petugas-nav-item ${activeMenu === 'scan' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('scan');
                  window.location.hash = 'scan';
                }}
              >
                <div className="petugas-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="3" height="3" />
                    <rect x="14" y="7" width="3" height="3" />
                    <rect x="7" y="14" width="3" height="3" />
                    <rect x="14" y="14" width="3" height="3" />
                  </svg>
                </div>
                <span>Scan QR Warga</span>
              </button>

              {/* 3. Riwayat Pengambilan */}
              <button
                type="button"
                className={`petugas-nav-item ${activeMenu === 'riwayat' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('riwayat');
                  window.location.hash = 'riwayat';
                }}
              >
                <div className="petugas-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <span>Riwayat Pengambilan</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Profile Card */}
        <div className="petugas-profile-container">
          <div className="petugas-profile-card">
            <div className="petugas-avatar-circle">
              {officerName ? officerName.charAt(0).toUpperCase() : 'H'}
            </div>
            <div className="petugas-profile-info">
              <span className="petugas-profile-name">{officerName}</span>
              <span className="petugas-profile-role">{officerRole}</span>
            </div>
          </div>
          <button
            type="button"
            className="petugas-logout-btn"
            onClick={onLogout}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
          ========================================================= */}
      <main className="petugas-main">
        {/* Top Header Bar */}
        <header className="petugas-top-header">
          <div>
            <h1 className="petugas-header-title">{headerInfo.title}</h1>
            <p className="petugas-header-sub">{headerInfo.sub}</p>
          </div>
          <div className="petugas-status-pill">
            <span className="petugas-pulse-dot" />
            <span>Sedang Bertugas</span>
          </div>
        </header>

        {/* =========================================================
            TAB 1: TUGAS HARI INI (MATCHING IMAGE 2)
            ========================================================= */}
        {activeMenu === 'tugas' && (
          <div>
            {/* 3 Metric Cards */}
            <div className="petugas-stats-grid">
              {/* Card 1: Target pengambilan */}
              <div className="petugas-stat-card">
                <span className="petugas-stat-label">Target pengambilan</span>
                <div className="petugas-stat-value-group">
                  <span className="petugas-stat-number">{stats.targetPengambilan}</span>
                  <span className="petugas-stat-unit">lokasi</span>
                </div>
                <span className="petugas-stat-subtext">Rute A · RT 01-03</span>
              </div>

              {/* Card 2: Sudah diambil */}
              <div className="petugas-stat-card">
                <span className="petugas-stat-label">Sudah diambil</span>
                <div className="petugas-stat-value-group">
                  <span className="petugas-stat-number">{stats.sudahDiambil}</span>
                  <span className="petugas-stat-unit">lokasi</span>
                </div>
                <span className="petugas-stat-subtext">{stats.persentaseSelesai}% tugas selesai</span>
              </div>

              {/* Card 3: Total muatan */}
              <div className="petugas-stat-card">
                <span className="petugas-stat-label">Total muatan</span>
                <div className="petugas-stat-value-group">
                  <span className="petugas-stat-number orange">{stats.totalMuatanKg.toFixed(1).replace('.', ',')}</span>
                  <span className="petugas-stat-unit">kg</span>
                </div>
                <span className="petugas-stat-subtext">Kapasitas truk {stats.kapasitasTruk}%</span>
              </div>
            </div>

            {/* Two Column Layout: Pengambilan Berikutnya + Ringkasan Rute */}
            <div className="petugas-columns-layout">
              {/* Left Column: Pengambilan Berikutnya */}
              <div className="petugas-card">
                <div className="petugas-card-header">
                  <div>
                    <h2 className="petugas-card-title">Pengambilan Berikutnya</h2>
                    <p className="petugas-card-desc">Urutan berdasarkan rute paling dekat.</p>
                  </div>
                  <button
                    type="button"
                    className="petugas-btn-scan-action"
                    onClick={() => {
                      setActiveMenu('scan');
                      window.location.hash = 'scan';
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="3" height="3" />
                      <rect x="14" y="7" width="3" height="3" />
                      <rect x="7" y="14" width="3" height="3" />
                      <rect x="14" y="14" width="3" height="3" />
                    </svg>
                    <span>Scan QR</span>
                  </button>
                </div>
                <div className="petugas-card-body">
                  <div className="petugas-queue-list">
                    {queueList.map((item) => (
                      <div
                        key={item.id}
                        className={`petugas-queue-item ${item.isActive ? 'active' : ''}`}
                      >
                        <div className="petugas-queue-left">
                          <div className="petugas-stop-badge">{item.number}</div>
                          <div className="petugas-stop-info">
                            <span className="petugas-stop-name">{item.name}</span>
                            <span className="petugas-stop-address">{item.address}</span>
                          </div>
                        </div>
                        <span className={`petugas-status-tag ${item.status}`}>
                          {item.statusText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Ringkasan Rute with Interactive Stylized Map */}
              <div className="petugas-card">
                <div className="petugas-card-header">
                  <div>
                    <h2 className="petugas-card-title">Ringkasan Rute</h2>
                  </div>
                </div>
                <div className="petugas-card-body">
                  <div className="petugas-route-container">
                    {/* Stylized Route Map Canvas */}
                    <div className="petugas-map-canvas">
                      <svg className="petugas-map-svg" viewBox="0 0 450 240" preserveAspectRatio="none">
                        <defs>
                          <pattern id="street-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2ece2" strokeWidth="1" />
                          </pattern>
                        </defs>
                        {/* Map Background */}
                        <rect width="450" height="240" fill="#eaf2ea" />
                        <rect width="450" height="240" fill="url(#street-grid)" />

                        {/* Lake / Park graphic */}
                        <path d="M 390,160 Q 420,170 430,200 Q 400,225 360,205 Q 350,175 390,160 Z" fill="#bfdbfe" opacity="0.75" />
                        <ellipse cx="380" cy="80" rx="30" ry="12" fill="#c7ebd2" opacity="0.6" />

                        {/* Major Road Lines */}
                        <line x1="0" y1="130" x2="450" y2="100" stroke="#d5e4d7" strokeWidth="10" />
                        <line x1="160" y1="0" x2="220" y2="240" stroke="#d5e4d7" strokeWidth="9" />
                        <line x1="330" y1="0" x2="380" y2="240" stroke="#d5e4d7" strokeWidth="8" />

                        {/* Traversal Route - Green Dashed Line */}
                        <path
                          d="M 50,140 Q 140,110 190,90 T 260,115 T 320,135 T 410,120"
                          fill="none"
                          stroke="#15803d"
                          strokeWidth="2.5"
                          strokeDasharray="6,4"
                        />

                        {/* Nodes along route */}
                        {/* Node 1: Green Aman */}
                        <circle cx="140" cy="95" r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 2: Green Aman */}
                        <circle cx="215" cy="120" r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 3: Overload Red */}
                        <circle cx="285" cy="148" r="14" fill="rgba(220, 38, 38, 0.18)" />
                        <circle cx="285" cy="148" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 4: Yellow Hampir Penuh */}
                        <circle cx="340" cy="100" r="7" fill="#eab308" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 5: Yellow Hampir Penuh */}
                        <circle cx="395" cy="150" r="7" fill="#eab308" stroke="#ffffff" strokeWidth="2.5" />
                      </svg>

                      {/* Map Live Indicator */}
                      <div className="petugas-map-live-badge">
                        <span className="petugas-map-live-dot" />
                        <span>LIVE · 5 mnt lalu</span>
                      </div>

                      {/* Legend Overlay Card */}
                      <div className="petugas-legend-card">
                        <span className="petugas-legend-title">LEGENDA TPS</span>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-dot green" />
                          <span>Aman &lt; 75%</span>
                        </div>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-dot yellow" />
                          <span>Hampir Penuh ≥ 75%</span>
                        </div>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-dot red" />
                          <span>Overload &gt; 90%</span>
                        </div>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-line" />
                          <span>Rute Pengalihan Otomatis</span>
                        </div>
                      </div>
                    </div>

                    {/* Route Footer text */}
                    <div className="petugas-route-footer">
                      Estimasi selesai 08.30 WIB · 11 lokasi tersisa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: SCAN QR WARGA (MATCHING IMAGE 1)
            ========================================================= */}
        {activeMenu === 'scan' && (
          <div className="petugas-scan-layout">
            {/* Left Card: Scan QR Saat Pengambilan */}
            <div className="petugas-card">
              <div className="petugas-card-header">
                <div>
                  <h2 className="petugas-card-title">Scan QR Saat Pengambilan</h2>
                  <p className="petugas-card-desc">Pindai QR warga agar laporan terbuka otomatis tanpa mencari nama.</p>
                </div>
              </div>
              <div className="petugas-card-body">
                {/* Viewfinder Screen */}
                <div className="petugas-camera-screen">
                  {/* Real video if camera active */}
                  {isCameraActive && (
                    <video ref={videoRef} className="petugas-camera-video" playsInline muted />
                  )}

                  {/* Animated laser line */}
                  {isCameraActive && <div className="petugas-scan-laser" />}

                  {/* Viewfinder Graphics & Instructions */}
                  <div className="petugas-camera-overlay">
                    <div className="petugas-scan-frame-icon">
                      {/* Viewfinder QR outline */}
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                        <rect x="8" y="8" width="8" height="8" rx="1" />
                      </svg>
                    </div>
                    <div className="petugas-camera-heading">Arahkan kamera ke QR warga</div>
                    <p className="petugas-camera-sub">Data setoran akan muncul otomatis tanpa pencarian.</p>
                  </div>
                </div>

                {/* Scan Action Buttons */}
                <div className="petugas-scan-actions">
                  <button
                    type="button"
                    className="petugas-btn-primary"
                    onClick={isCameraActive ? stopCamera : startCamera}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{isCameraActive ? 'Hentikan Kamera' : 'Mulai Scan Kamera'}</span>
                  </button>

                  <button
                    type="button"
                    className="petugas-btn-secondary"
                    onClick={handleTriggerDemo}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Gunakan Kode Setoran Aktif untuk Demo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Card: Konfirmasi Pengambilan */}
            <div className="petugas-card">
              <div className="petugas-card-header">
                <div>
                  <h2 className="petugas-card-title">Konfirmasi Pengambilan</h2>
                  <p className="petugas-card-desc">Isi kondisi aktual di lokasi warga.</p>
                </div>
              </div>
              <div className="petugas-card-body">
                {!scannedWarga ? (
                  /* Empty state (matching Image 1) */
                  <div className="petugas-empty-state">
                    <div className="petugas-empty-icon">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <circle cx="12" cy="12" r="1.5" />
                      </svg>
                    </div>
                    <span className="petugas-empty-text">Belum ada QR dipindai</span>
                  </div>
                ) : (
                  /* Confirmation Form when QR has been scanned */
                  <div className="petugas-confirm-form">
                    <div className="petugas-warga-summary">
                      <div className="petugas-warga-left">
                        <span className="petugas-warga-name">{scannedWarga.name}</span>
                        <span className="petugas-warga-addr">{scannedWarga.address}</span>
                      </div>
                      <span className="petugas-status-tag ready">Siap Diproses</span>
                    </div>

                    {/* Weight Input */}
                    <div className="petugas-form-group">
                      <label className="petugas-form-label">Berat Aktual Timbangan</label>
                      <div className="petugas-input-weight">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          placeholder="0.0"
                        />
                        <span>kg</span>
                      </div>
                    </div>

                    {/* Waste Condition Selection */}
                    <div className="petugas-form-group">
                      <label className="petugas-form-label">Kondisi Sampah</label>
                      <div className="petugas-condition-options">
                        {['Bersih', 'Perlu Pemilahan', 'Campuran'].map((cond) => (
                          <button
                            key={cond}
                            type="button"
                            className={`petugas-condition-btn ${selectedCondition === cond ? 'selected' : ''}`}
                            onClick={() => setSelectedCondition(cond)}
                          >
                            {cond}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Estimated Citizen Reward Points */}
                    <div className="petugas-points-reward-box">
                      <span>Estimasi Reward Poin Warga:</span>
                      <span className="petugas-points-value">
                        +{Math.round((parseFloat(weightInput) || 0) * 45)} Poin
                      </span>
                    </div>

                    {/* Action buttons */}
                    <button
                      type="button"
                      className="petugas-btn-primary"
                      onClick={handleConfirmPickup}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Konfirmasi Pengambilan</span>
                    </button>

                    <button
                      type="button"
                      className="petugas-btn-cancel"
                      onClick={handleCancelScan}
                    >
                      Batal / Pindai Ulang
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: RIWAYAT PENGAMBILAN (MATCHING IMAGE 3)
            ========================================================= */}
        {activeMenu === 'riwayat' && (
          <div className="petugas-table-card">
            <h2 className="petugas-table-header-title">Riwayat Pengambilan Hari Ini</h2>
            <div className="petugas-table-container">
              <table className="petugas-table">
                <thead>
                  <tr>
                    <th>WAKTU</th>
                    <th>WARGA</th>
                    <th>BERAT</th>
                    <th>KONDISI</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.waktu}</td>
                      <td className="petugas-warga-cell">{row.warga}</td>
                      <td>{row.berat}</td>
                      <td>{row.kondisi}</td>
                      <td>
                        <span
                          className={`petugas-table-badge ${
                            row.status === 'Selesai' ? 'completed' : 'pending'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
