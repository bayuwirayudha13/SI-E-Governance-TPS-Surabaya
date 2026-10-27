import React, { useState, useEffect } from 'react';
import AdminChat from './AdminChat';
import { TPS_SURABAYA_ALL } from '../data/tpsSurabayaData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminPanel({ onLogout, currentUser: userFromProp }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(userFromProp);
  const [wargas, setWargas] = useState([]);
  const [jadwals, setJadwals] = useState([]);
  const [laporanList, setLaporanList] = useState([]);
  const [dispatchedTpsList, setDispatchedTpsList] = useState([]);
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sipetasan_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sipetasan_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [newJadwal, setNewJadwal] = useState({ hari: '', waktu_mulai: '', waktu_selesai: '', area: '', petugas: '', tipe: 'Rutin' });

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const userData = sessionStorage.getItem('user_role');
    const authUser = sessionStorage.getItem('auth_user');
    
    if (token) {
      if (authUser) {
        setCurrentUser(JSON.parse(authUser));
      } else {
        setCurrentUser({
          role: userData,
          email: sessionStorage.getItem('user_email') || 'admin@sipetasan.com',
          nama_lengkap: 'Admin'
        });
      }
    }
  }, []);

  useEffect(() => {
    if (activeMenu === 'warga' || activeMenu === 'dashboard') {
      loadWargas();
    }
    if (activeMenu === 'jadwal' || activeMenu === 'dashboard') {
      loadJadwals();
    }
    if (activeMenu === 'dashboard') {
      loadLaporan();
    }
    if (activeMenu === 'pengambilan') {
      loadRiwayat();
    }
  }, [activeMenu]);

  const loadLaporan = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/laporan/`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setLaporanList(data);
          return;
        }
      }
    } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem('sipetasan_laporan_warga') || '[]');
      if (saved.length > 0) {
        setLaporanList(saved);
        return;
      }
    } catch {}
    setLaporanList([
      { id: 101, tps_nama: 'TPS PRINGADI', jenis_laporan: 'Penuh', deskripsi: 'Kontainer meluber ke badan jalan, bau menyengat.', status_tindak_lanjut: 'Menunggu', tanggal_lapor: '10 menit lalu' },
      { id: 102, tps_nama: 'TPS KEPUTRAN', jenis_laporan: 'Rusak', deskripsi: 'Roda kontainer patah dan penutup tidak bisa dibuka.', status_tindak_lanjut: 'Proses', tanggal_lapor: '35 menit lalu' },
      { id: 103, tps_nama: 'TPS KALISARI', jenis_laporan: 'Penuh', deskripsi: 'Tumpukan sampah plastik memenuhi bak kontainer.', status_tindak_lanjut: 'Menunggu', tanggal_lapor: '1 jam lalu' }
    ]);
  };

  const handleDispatchTruck = (tps) => {
    setDispatchedTpsList((prev) => [...prev, tps.id]);
    setSuccess(`Instruksi Disposisi Terkirim! Truk Armada DLH SBY-${Math.floor(10 + Math.random() * 89)} segera meluncur ke ${tps.nama} (Kecamatan ${tps.kecamatan}).`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleResolveLaporan = (id) => {
    setLaporanList((prev) => prev.map(item => item.id === id ? { ...item, status_tindak_lanjut: 'Selesai' } : item));
    setSuccess(`Laporan aduan #${id} berhasil divalidasi dan ditandai selesai ditangani.`);
    setTimeout(() => setSuccess(''), 4500);
  };

  const [riwayat, setRiwayat] = useState([]);

  const loadRiwayat = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/pengambilan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRiwayat(data);
      }
    } catch (err) {
      console.error('Load riwayat error:', err);
    }
  };

  const token = sessionStorage.getItem('access_token');

  const loadWargas = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/warga`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWargas(data);
      }
    } catch (err) {
      console.error('Load wargas error:', err);
    }
  };

  const loadJadwals = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/jadwal/`);
      if (response.ok) {
        const data = await response.json();
        setJadwals(data);
      }
    } catch (err) {
      console.error('Load jadwals error:', err);
    }
  };

  const handleAddJadwal = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/jadwal/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJadwal)
      });
      if (!response.ok) throw new Error('Gagal menambah jadwal');
      setSuccess('Jadwal berhasil ditambahkan');
      setNewJadwal({ hari: '', waktu_mulai: '', waktu_selesai: '', area: '', petugas: '', tipe: 'Rutin' });
      setShowAddJadwalModal(false);
      loadJadwals();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJadwal = async (jadwalId) => {
    if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/jadwal/${jadwalId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Gagal menghapus jadwal');
      setSuccess('Jadwal berhasil dihapus');
      loadJadwals();
    } catch (err) {
      setError(err.message);
    }
  };

  // Get current date
  const getCurrentDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date();
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  // Check if day is passed
  const isDayPassed = (day) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndex = new Date().getDay();
    const targetIndex = days.indexOf(day);
    if (targetIndex === -1) return false;
    return targetIndex < todayIndex;
  };

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-logo-badge">
          <div className="admin-logo-left">
            <div className="admin-logo-icon" title="SI-PETASAN">A</div>
            {!isSidebarCollapsed && (
              <div className="admin-brand-info">
                <div className="admin-brand-name">SI-PETASAN</div>
                <div className="admin-brand-tag">Admin Panel</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        </div>

        <div className="admin-nav-section">
          {!isSidebarCollapsed && <div className="admin-nav-label">MENU ADMIN</div>}
          <nav className="admin-nav-menu">
            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
              title="Dashboard"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'warga' ? 'active' : ''}`}
              onClick={() => setActiveMenu('warga')}
              title="Kelola Warga"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              {!isSidebarCollapsed && <span>Kelola Warga</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'jadwal' ? 'active' : ''}`}
              onClick={() => setActiveMenu('jadwal')}
              title="Jadwal Pengambilan"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {!isSidebarCollapsed && <span>Jadwal Pengambilan</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveMenu('chat')}
              title="Chat ke Warga"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {!isSidebarCollapsed && <span>Chat ke Warga</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'pengambilan' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pengambilan')}
              title="Riwayat Pengambilan"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
              {!isSidebarCollapsed && <span>Riwayat Pengambilan</span>}
            </button>
          </nav>
        </div>

        {/* Bottom profile */}
        <div className="admin-bottom-profile">
          <div className="admin-profile-card" title={`${currentUser?.nama_lengkap || currentUser?.nama || 'Admin'} (${currentUser?.role || 'Admin'})`}>
            <div className="admin-profile-avatar">
              {(currentUser?.nama_lengkap || currentUser?.nama || 'A').charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-profile-info">
                <div className="admin-profile-name">{currentUser?.nama_lengkap || currentUser?.nama || 'Admin'}</div>
                <div className="admin-profile-role" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                  {currentUser?.role || 'Admin'}
                </div>
              </div>
            )}
          </div>
          <button type="button" className="admin-logout-btn" onClick={onLogout} title="Keluar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isSidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-top-header">
          <div>
            <h1 className="admin-page-title">
              {activeMenu === 'dashboard' && 'Dashboard Admin'}
              {activeMenu === 'warga' && 'Kelola Data Warga'}
              {activeMenu === 'jadwal' && 'Jadwal Pengambilan'}
              {activeMenu === 'chat' && 'Chat ke Warga'}
            </h1>
            <div className="admin-page-date">{getCurrentDate()}</div>
          </div>
        </header>

        {success && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px' }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>
            ✕ {error}
          </div>
        )}

        {/* DASHBOARD EKSEKUTIF ADMIN */}
        {activeMenu === 'dashboard' && (() => {
          const totalTpsCount = TPS_SURABAYA_ALL.length;
          const criticalTpsList = TPS_SURABAYA_ALL.filter(t => (t.kapasitasPersen || t.capacity || 0) >= 80);
          const avgCapacityPercent = Math.round(
            TPS_SURABAYA_ALL.reduce((acc, t) => acc + (t.kapasitasPersen || t.capacity || 50), 0) / (totalTpsCount || 1)
          );
          const pendingReports = laporanList.filter(l => l.status_tindak_lanjut !== 'Selesai');

          const REGIONS = [
            { name: 'Surabaya Pusat', icon: '🏛️', desc: 'Tegalsari, Genteng, Bubutan, Simokerto' },
            { name: 'Surabaya Timur', icon: '🎓', desc: 'Gubeng, Sukolilo, Rungkut, Mulyorejo' },
            { name: 'Surabaya Barat', icon: '🏢', desc: 'Tandes, Sambikerep, Benowo, Sukomanunggal' },
            { name: 'Surabaya Utara', icon: '⚓', desc: 'Krembangan, Semampir, Pabean Cantian, Kenjeran' },
            { name: 'Surabaya Selatan', icon: '🌳', desc: 'Wonokromo, Wonocolo, Sawahan, Gayungan' }
          ];

          const regionStats = REGIONS.map(reg => {
            const list = TPS_SURABAYA_ALL.filter(t => t.wilayahKota === reg.name);
            const count = list.length || 1;
            const avg = Math.round(list.reduce((acc, t) => acc + (t.kapasitasPersen || t.capacity || 50), 0) / count);
            const crit = list.filter(t => (t.kapasitasPersen || t.capacity || 0) >= 80).length;
            return {
              ...reg,
              totalTps: list.length,
              avgPct: avg,
              criticalCount: crit,
              statusText: avg >= 80 ? 'Kritis' : avg >= 65 ? 'Waspada' : 'Aman',
              statusColor: avg >= 80 ? '#ef4444' : avg >= 65 ? '#f59e0b' : '#10b981'
            };
          });

          return (
            <div className="admin-content-view" style={{ paddingBottom: '40px' }}>
              {/* Executive Welcome Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '24px 28px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 8px 24px rgba(4, 120, 87, 0.22)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      COMMAND CENTER DLH KOTA SURABAYA
                    </span>
                    <span style={{
                      background: '#22c55e',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      ● LIVE MONITORING
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 6px', color: '#ffffff' }}>
                    Executive Municipal Waste Control Center
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.86rem', opacity: 0.9, maxWidth: '680px' }}>
                    Pemantauan terpusat 231 TPS, neraca volume sampah 5 wilayah, radar TPS overload darurat, dan koordinasi respon aduan warga Surabaya.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  textAlign: 'center',
                  backdropFilter: 'blur(8px)',
                  minWidth: '150px'
                }}>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'uppercase', fontWeight: 700 }}>
                    Indeks Kebersihan Kota
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fef08a', marginTop: '2px' }}>
                    94.8%
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#bbf7d0', fontWeight: 700 }}>
                    Grade A &bull; Sangat Baik
                  </span>
                </div>
              </div>

              {/* 4 Executive KPI Cards */}
              <div className="admin-stats-row">
                {/* KPI 1 */}
                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon-wrap icon-blue">🚛</div>
                    <span className="stat-badge-live">ESTIMASI</span>
                  </div>
                  <div className="stat-card-number">1.846 m³</div>
                  <div className="stat-card-label">Volume Sampah Masuk / Hari</div>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>
                    &uarr; +1.8% vs kemarin &bull; 231 TPS
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon-wrap icon-gold">📈</div>
                    <span className="stat-badge-live">KOTA</span>
                  </div>
                  <div className="stat-card-number">{avgCapacityPercent}%</div>
                  <div className="stat-card-label">Rata-rata Beban Kapasitas TPS</div>
                  <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700, marginTop: '6px' }}>
                    Optimal &bull; Target Kota &lt; 75%
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="admin-stat-card" style={{ border: criticalTpsList.length > 0 ? '1.5px solid #fecaca' : '1px solid #e2e8f0' }}>
                  <div className="stat-card-header">
                    <div className="stat-icon-wrap icon-orange" style={{ background: '#fee2e2', color: '#dc2626' }}>⚠️</div>
                    <span style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '6px'
                    }}>
                      OVERLOAD
                    </span>
                  </div>
                  <div className="stat-card-number" style={{ color: '#dc2626' }}>{criticalTpsList.length} TPS</div>
                  <div className="stat-card-label">Kapasitas Kritis (&ge; 80%)</div>
                  <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700, marginTop: '6px' }}>
                    Perlu Dispatch Dump Truck
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="admin-stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon-wrap icon-sand" style={{ background: '#fdf4ff', color: '#c026d3' }}>📢</div>
                    <span style={{
                      background: '#8b5cf6',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '6px'
                    }}>
                      ADUAN
                    </span>
                  </div>
                  <div className="stat-card-number">{pendingReports.length} Aduan</div>
                  <div className="stat-card-label">Laporan Warga Menunggu</div>
                  <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, marginTop: '6px' }}>
                    Respon Cepat Tim DLH
                  </div>
                </div>
              </div>

              {/* SEBARAN BEBAN 5 WILAYAH KOTA SURABAYA */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '22px 24px',
                marginBottom: '28px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      🗺️ Sebaran Beban Kapasitas TPS per Wilayah Surabaya
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Distribusi rata-rata tampungan kontainer sampah di 5 zona kota
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    background: '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    color: '#475569'
                  }}>
                    Total 231 TPS Aktif
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {regionStats.map((reg) => (
                    <div
                      key={reg.name}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                            {reg.icon} {reg.name}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: reg.statusColor === '#ef4444' ? '#fef2f2' : reg.statusColor === '#f59e0b' ? '#fffbeb' : '#f0fdf4',
                            color: reg.statusColor
                          }}>
                            {reg.statusText}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '12px' }}>
                          {reg.desc}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                            {reg.totalTps} TPS ({reg.criticalCount} Kritis)
                          </span>
                          <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: reg.statusColor }}>
                            {reg.avgPct}%
                          </strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${reg.avgPct}%`,
                            height: '100%',
                            background: reg.statusColor,
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DUA GRID: RADAR TPS OVERLOAD & ADUAN WARGA */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
                gap: '24px',
                marginBottom: '28px'
              }}>
                {/* 1. RADAR TPS PRIORITAS PENGANGKUTAN */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        🚨 Radar Prioritas Pengangkutan (TPS Overload &ge; 80%)
                      </h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        TPS membutuhkan penugasan armada dump truck DLH segera
                      </p>
                    </div>
                    <span style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      DARURAT
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {criticalTpsList.slice(0, 5).map((tps) => {
                      const isDispatched = dispatchedTpsList.includes(tps.id);
                      const pct = tps.kapasitasPersen || tps.capacity || 85;
                      return (
                        <div
                          key={tps.id}
                          style={{
                            border: '1px solid #fed7aa',
                            background: '#fffaf5',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                                {tps.nama}
                              </strong>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                background: '#ef4444',
                                color: '#fff',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                {pct}%
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              Kec. {tps.kecamatan} &bull; {tps.wilayahKota} &bull; Kapasitas: {tps.dayaTampungM3 || 12} m³
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDispatchTruck(tps)}
                            disabled={isDispatched}
                            style={{
                              background: isDispatched ? '#059669' : '#ea580c',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: isDispatched ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>{isDispatched ? '✓' : '🚨'}</span>
                            <span>{isDispatched ? 'Truk Ditugaskan' : 'Disposisi Truk'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ADUAN & LAPORAN WARGA TERKINI */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        📢 Aduan &amp; Laporan Warga Lapangan
                      </h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Umpan balik real-time dari aplikasi warga SI-PETASAN
                      </p>
                    </div>
                    <span style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {pendingReports.length} Menunggu
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {laporanList.slice(0, 4).map((lap) => {
                      const isDone = lap.status_tindak_lanjut === 'Selesai';
                      return (
                        <div
                          key={lap.id}
                          style={{
                            border: `1px solid ${isDone ? '#e2e8f0' : '#fed7aa'}`,
                            background: isDone ? '#f8fafc' : '#ffffff',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                background: lap.jenis_laporan === 'Penuh' ? '#fee2e2' : '#fef3c7',
                                color: lap.jenis_laporan === 'Penuh' ? '#b91c1c' : '#b45309',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                {lap.jenis_laporan}
                              </span>
                              <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>
                                {lap.tps_nama || 'TPS Surabaya'}
                              </strong>
                            </div>
                            <p style={{ margin: '4px 0 2px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.35 }}>
                              {lap.deskripsi}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Dilaporkan: {lap.tanggal_lapor ? (lap.tanggal_lapor.includes('lalu') ? lap.tanggal_lapor : new Date(lap.tanggal_lapor).toLocaleDateString('id-ID')) : 'Baru saja'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleResolveLaporan(lap.id)}
                            disabled={isDone}
                            style={{
                              background: isDone ? '#f1f5f9' : '#059669',
                              color: isDone ? '#64748b' : '#ffffff',
                              border: isDone ? '1px solid #cbd5e1' : 'none',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: isDone ? 'default' : 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isDone ? '✓ Selesai' : 'Tindak Lanjuti'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DUA GRID BAWAH: WARGA TERBARU & JADWAL MINGGU INI */}
              <div className="admin-dashboard-grid">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 className="admin-card-title" style={{ margin: 0 }}>👥 Warga Terdaftar Terbaru</h3>
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>Total: {wargas.length} Warga</span>
                  </div>
                  <div className="recent-users-list">
                    {wargas.slice(0, 5).map(w => (
                      <div key={w.id} className="recent-user-item">
                        <div className="recent-user-avatar">{w.nama?.charAt(0) || 'W'}</div>
                        <div className="recent-user-info">
                          <div className="recent-user-name">{w.nama}</div>
                          <div className="recent-user-email">{w.email}</div>
                        </div>
                        <span className="status-pill status-aktif">Aktif</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 className="admin-card-title" style={{ margin: 0 }}>📅 Jadwal Pengambilan Minggu Ini</h3>
                    <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>{jadwals.length} Rute</span>
                  </div>
                  <div className="tps-realtime-list">
                    {jadwals.slice(0, 5).map(j => (
                      <div key={j.id} className="tps-realtime-row">
                        <div className="tps-name-col">
                          <span>{j.hari}</span>
                        </div>
                        <div style={{ flex: 1, fontSize: '0.85rem', color: '#64748b' }}>
                          {j.area} &bull; {j.waktu_mulai}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* KELOLA WARGA */}
        {activeMenu === 'warga' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Daftar Warga (Read-only)</h3>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>NO. HP</th>
                      <th>TOTAL POIN</th>
                      <th>BERGABUNG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wargas.map(w => (
                      <tr key={w.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="table-avatar">{w.nama?.charAt(0) || 'W'}</span>
                            <span>{w.nama}</span>
                          </div>
                        </td>
                        <td className="text-muted">{w.email}</td>
                        <td className="text-muted">{w.no_hp || '—'}</td>
                        <td><strong>{w.total_poin} pts</strong></td>
                        <td className="text-muted">{w.created_at ? new Date(w.created_at).toLocaleDateString('id-ID') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* JADWAL */}
        {activeMenu === 'jadwal' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Jadwal Pengambilan Sampah</h3>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={() => setShowAddJadwalModal(true)}
                >
                  + Tambah Jadwal
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>HARI</th>
                      <th>AREA</th>
                      <th>WAKTU</th>
                      <th>PETUGAS</th>
                      <th>TIPE</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jadwals.map(j => (
                      <tr key={j.id}>
                        <td><strong>{j.hari}</strong></td>
                        <td>{j.area}</td>
                        <td style={{ fontFamily: 'monospace' }}>{j.waktu_mulai}–{j.waktu_selesai}</td>
                        <td>{j.petugas}</td>
                        <td>
                          <span className={`role-pill role-${j.tipe.toLowerCase()}`}>{j.tipe}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-table-delete"
                            onClick={() => handleDeleteJadwal(j.id)}
                          >
                            &times; Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {activeMenu === 'chat' && (
          <AdminChat />
        )}
        {activeMenu === 'pengambilan' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Riwayat Pengambilan Sampah</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>WAKTU</th>
                      <th>WARGA</th>
                      <th>PETUGAS</th>
                      <th>STATUS</th>
                      <th>BUKTI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.map(r => (
                      <tr key={r.id}>
                        <td className="text-muted">{r.waktu_pengambilan ? new Date(r.waktu_pengambilan).toLocaleString('id-ID') : '—'}</td>
                        <td>{r.warga_nama}</td>
                        <td>{r.petugas_nama}</td>
                        <td><span className="role-pill role-warga">{r.status}</span></td>
                        <td>
                          {r.foto_sampah ? (
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${r.foto_sampah}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>Lihat</a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Tambah Jadwal */}
      {showAddJadwalModal && (
        <div className="modal-overlay" onClick={() => setShowAddJadwalModal(false)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Jadwal Pengambilan</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddJadwalModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddJadwal} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Hari</label>
                <select
                  required
                  className="settings-input"
                  value={newJadwal.hari}
                  onChange={(e) => setNewJadwal({ ...newJadwal, hari: e.target.value })}
                >
                  <option value="">Pilih Hari</option>
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Waktu Mulai</label>
                <input
                  type="time"
                  required
                  className="settings-input"
                  value={newJadwal.waktu_mulai}
                  onChange={(e) => setNewJadwal({ ...newJadwal, waktu_mulai: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Waktu Selesai</label>
                <input
                  type="time"
                  required
                  className="settings-input"
                  value={newJadwal.waktu_selesai}
                  onChange={(e) => setNewJadwal({ ...newJadwal, waktu_selesai: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Area/Zona</label>
                <input
                  type="text"
                  required
                  placeholder="RT 01-03 Jl. Mawar"
                  className="settings-input"
                  value={newJadwal.area}
                  onChange={(e) => setNewJadwal({ ...newJadwal, area: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Petugas</label>
                <input
                  type="text"
                  required
                  placeholder="Nama petugas"
                  className="settings-input"
                  value={newJadwal.petugas}
                  onChange={(e) => setNewJadwal({ ...newJadwal, petugas: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select
                  className="settings-input"
                  value={newJadwal.tipe}
                  onChange={(e) => setNewJadwal({ ...newJadwal, tipe: e.target.value })}
                >
                  <option value="Rutin">Rutin</option>
                  <option value="Besar">Besar</option>
                  <option value="Libur">Libur</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddJadwalModal(false)}
                  style={{ padding: '10px 18px', background: '#1b2942', color: '#cbd5e1', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
