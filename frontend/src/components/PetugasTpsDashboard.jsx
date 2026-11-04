import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api, authService, API_BASE_URL } from '../api/client';
import './PetugasTpsDashboard.css';

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

export default function PetugasTpsDashboard({ onLogout, currentUser }) {
  // Navigation: 'dashboard' | 'monitoring' | 'riwayat' | 'lokasi' | 'profil'
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Officer info
  const officerName = currentUser?.nama_lengkap || currentUser?.nama || 'Petugas TPS';
  const officerRole = 'Petugas TPS';
  const kelurahanName = currentUser?.wilayah_kelurahan || currentUser?.kelurahan || '-';

  // Data state
  const [assignedTpsList, setAssignedTpsList] = useState([]);
  const [selectedTpsId, setSelectedTpsId] = useState(null);
  const [monitoringForm, setMonitoringForm] = useState({
    tps_id: '',
    volume_aktual_m3: '',
    persentase_kapasitas: '',
    catatan_kondisi: '',
    waktu_monitoring: '',
  });
  const [monitoringReports, setMonitoringReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_tps: 0,
    total_monitoring: 0,
    pending_reports: 0,
    approved_reports: 0,
    rejected_reports: 0,
    last_monitoring: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // Leaflet map refs
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Fetch assigned TPS list
  const fetchAssignedTps = async () => {
    try {
      const response = await api.get('/api/petugas-tps/my-tps');
      if (response.data.length > 0) {
        setAssignedTpsList(response.data);
        if (!selectedTpsId) {
          setSelectedTpsId(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch assigned TPS:', err);
      setError('Gagal memuat daftar TPS');
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/petugas-tps/dashboard-stats');
      setDashboardStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  // Fetch monitoring reports for current petugas
  const fetchMonitoringReports = async () => {
    try {
      const response = await api.get('/api/petugas-tps/monitoring-reports');
      setMonitoringReports(response.data);
    } catch (err) {
      console.error('Failed to fetch monitoring reports:', err);
    }
  };

  // Load all data on mount
  useEffect(() => {
    fetchAssignedTps();
    fetchDashboardStats();
    fetchMonitoringReports();
  }, []);

  // Initialize leaflet map for Lokasi TPS
  useEffect(() => {
    if (activeMenu !== 'lokasi' || !mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Use first TPS with coordinates as center, or default to Surabaya
    const tpsWithCoords = assignedTpsList.filter(tps => tps.latitude && tps.longitude);
    const center = tpsWithCoords.length > 0
      ? [parseFloat(tpsWithCoords[0].latitude), parseFloat(tpsWithCoords[0].longitude)]
      : [-7.2575, 112.7521];

    const map = L.map(mapRef.current, {
      center,
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    // Add markers for assigned TPS
    assignedTpsList.forEach((tps) => {
      if (!tps.latitude || !tps.longitude) return;

      const capacity = tps.day_a_tampung_m3 ? parseFloat(tps.day_a_tampung_m3) : 0;
      // Estimate percentage - we'll use a color based on capacity
      const markerColor = capacity > 100 ? '#dc2626' : capacity >= 50 ? '#d97706' : '#15803d';
      const customIcon = L.divIcon({
        className: 'custom-tps-marker',
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
            ${capacity > 0 ? Math.min(100, Math.round(capacity * 0.7)) + '%' : '?'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([parseFloat(tps.latitude), parseFloat(tps.longitude)], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; padding: 4px;">
          <strong style="font-size: 14px; color: #0f172a;">${tps.nama}</strong><br/>
          <span style="color: #64748b;">${tps.lokasi || '-'}</span><br/>
          <span style="color: #64748b;">Kecamatan: ${tps.kecamatan}</span><br/>
          <div style="margin-top: 6px; font-weight: 700; color: ${markerColor};">
            Daya Tampung: ${tps.day_a_tampung_m3 || '-'} m³
          </div>
        </div>
      `);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [activeMenu, assignedTpsList]);

  // Handle TPS selection change
  const handleTpsChange = (e) => {
    const tpsId = Number(e.target.value);
    setSelectedTpsId(tpsId);
    setMonitoringForm(prev => ({ ...prev, tps_id: tpsId }));
  };

  // Handle monitoring form input
  const handleMonitoringChange = (e) => {
    const { name, value } = e.target;
    setMonitoringForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle photo upload
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit monitoring report
  const handleSubmitMonitoring = async (e) => {
    e.preventDefault();
    if (!monitoringForm.tps_id || !monitoringForm.volume_aktual_m3 || !monitoringForm.persentase_kapasitas) {
      setError('Mohon lengkapi semua field wajib');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('tps_id', monitoringForm.tps_id);
      formData.append('volume_aktual_m3', monitoringForm.volume_aktual_m3);
      formData.append('persentase_kapasitas', monitoringForm.persentase_kapasitas);
      if (monitoringForm.catatan_kondisi) {
        formData.append('catatan_kondisi', monitoringForm.catatan_kondisi);
      }
      if (monitoringForm.waktu_monitoring) {
        formData.append('waktu_monitoring', monitoringForm.waktu_monitoring);
      }
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      const response = await api.post('/api/petugas-tps/monitoring-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Laporan monitoring berhasil dikirim!');
      setMonitoringForm({
        tps_id: '',
        volume_aktual_m3: '',
        persentase_kapasitas: '',
        catatan_kondisi: '',
        waktu_monitoring: '',
      });
      setFotoFile(null);
      setFotoPreview(null);
      fetchMonitoringReports();
      fetchDashboardStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengirim laporan monitoring');
    } finally {
      setLoading(false);
    }
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
    if (hash.includes('monitoring')) setActiveMenu('monitoring');
    else if (hash.includes('riwayat')) setActiveMenu('riwayat');
    else if (hash.includes('lokasi')) setActiveMenu('lokasi');
    else if (hash.includes('profil')) setActiveMenu('profil');
    else setActiveMenu('dashboard');
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Menunggu Verifikasi': return '#f59e0b';
      case 'Disetujui': return '#16a34a';
      case 'Ditolak': return '#ef4444';
      default: return '#64748b';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="tps-dashboard-container">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="tps-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`tps-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div>
          {/* Logo Brand */}
          <div className="tps-sidebar-brand">
            <div className="tps-brand-badge">SI</div>
            <div className="tps-brand-texts">
              <span className="tps-brand-title">SI-PETASAN</span>
              <span className="tps-brand-subtitle">PETUGAS TPS</span>
            </div>
          </div>

          {/* Nav List */}
          <div className="tps-menu-section-label">MENU UTAMA</div>
          <nav className="tps-nav-list">
            {/* 1. Dashboard */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
              </svg>
              <span>Dashboard</span>
            </button>

            {/* 2. Monitoring Kapasitas TPS */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'monitoring' ? 'active' : ''}`}
              onClick={() => handleNavClick('monitoring')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>Monitoring Kapasitas</span>
            </button>

            {/* 3. Riwayat Monitoring */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'riwayat' ? 'active' : ''}`}
              onClick={() => handleNavClick('riwayat')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Riwayat Monitoring</span>
            </button>

            {/* 4. Lokasi TPS */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'lokasi' ? 'active' : ''}`}
              onClick={() => handleNavClick('lokasi')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>Lokasi TPS</span>
            </button>

            {/* 5. Profil Saya */}
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'profil' ? 'active' : ''}`}
              onClick={() => handleNavClick('profil')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profil Saya</span>
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

      {/* MAIN CONTENT AREA */}
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
                {activeMenu === 'dashboard' && 'Dashboard'}
                {activeMenu === 'monitoring' && 'Monitoring Kapasitas TPS'}
                {activeMenu === 'riwayat' && 'Riwayat Monitoring'}
                {activeMenu === 'lokasi' && 'Lokasi TPS'}
                {activeMenu === 'profil' && 'Profil Saya'}
              </h1>
            </div>
            <span className="tps-topbar-subtitle">
              SI-PETASAN · Petugas TPS · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="tps-topbar-right">
            {/* User Profile Badge */}
            <div className="tps-user-badge-header">
              <div className="tps-user-avatar">
                {officerName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Global Messages */}
        {error && (
          <div className="tps-alert tps-alert-error" style={{ margin: '16px 24px', padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="tps-alert tps-alert-success" style={{ margin: '16px 24px', padding: '12px 16px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
            {success}
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeMenu === 'dashboard' && (
          <div className="tps-content-body">
            {/* 4 Stat Cards */}
            <div className="tps-stats-grid">
              <div className="tps-stat-card">
                <span className="tps-stat-label">TPS Ditugaskan</span>
                <span className="tps-stat-value">{dashboardStats.total_tps} <small style={{ fontSize: '1rem', fontWeight: 600 }}>TPS</small></span>
                <span className="tps-stat-subtext trend-muted">Total TPS tanggung jawab</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Total Monitoring</span>
                <span className="tps-stat-value">{dashboardStats.total_monitoring} <small style={{ fontSize: '1rem', fontWeight: 600 }}>laporan</small></span>
                <span className="tps-stat-subtext trend-muted">Semua laporan Anda</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Menunggu Verifikasi</span>
                <span className="tps-stat-value" style={{ color: '#ea580c' }}>{dashboardStats.pending_reports} <small style={{ fontSize: '1rem', fontWeight: 600 }}>laporan</small></span>
                <span className="tps-stat-subtext trend-warn">Belum diverifikasi admin</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Disetujui</span>
                <span className="tps-stat-value" style={{ color: '#0284c7' }}>{dashboardStats.approved_reports} <small style={{ fontSize: '1rem', fontWeight: 600 }}>laporan</small></span>
                <span className="tps-stat-subtext trend-info">Sudah diverifikasi</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Ditolak</span>
                <span className="tps-stat-value" style={{ color: '#ef4444' }}>{dashboardStats.rejected_reports} <small style={{ fontSize: '1rem', fontWeight: 600 }}>laporan</small></span>
                <span className="tps-stat-subtext trend-warn">Perlu perbaikan</span>
              </div>

              <div className="tps-stat-card">
                <span className="tps-stat-label">Monitoring Terakhir</span>
                <span className="tps-stat-value" style={{ fontSize: '1.1rem' }}>
                  {dashboardStats.last_monitoring ? formatDate(dashboardStats.last_monitoring) : 'Belum ada'}
                </span>
                <span className="tps-stat-subtext trend-muted">Waktu pemantauan terakhir</span>
              </div>
            </div>

            {/* TPS Capacity Overview */}
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">Ringkasan Kapasitas TPS Ditugaskan</h3>
              </div>

              {assignedTpsList.length === 0 ? (
                <div className="tps-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  <h4>Belum Ada TPS Ditugaskan</h4>
                  <p>Hubungi Superadmin untuk menetapkan TPS yang menjadi tanggung jawab Anda.</p>
                </div>
              ) : (
                <div className="tps-capacity-list">
                  {assignedTpsList.map((tps) => (
                    <div key={tps.id} className="tps-capacity-item-card">
                      <div className="tps-capacity-item-top">
                        <div>
                          <span className="tps-id-code">{tps.id}</span>
                          <h4 className="tps-item-name">{tps.nama}</h4>
                        </div>
                        <span className="tps-status-badge aman">{tps.status}</span>
                      </div>

                      <div className="tps-capacity-metric-row">
                        <CircularProgressGauge percentage={tps.day_a_tampung_m3 ? Math.min(100, Math.round(parseFloat(tps.day_a_tampung_m3) * 0.7)) : 0} size={62} />
                        <div className="tps-progress-bar-wrap">
                          <div className="tps-progress-bar-labels">
                            <span>Daya Tampung (est.)</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{tps.day_a_tampung_m3 || '-'} m³</span>
                          </div>
                          <div className="tps-progress-track">
                            <div
                              className="tps-progress-fill aman"
                              style={{ width: `${tps.day_a_tampung_m3 ? Math.min(100, parseFloat(tps.day_a_tampung_m3) * 0.7) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MONITORING KAPASITAS TPS */}
        {activeMenu === 'monitoring' && (
          <div className="tps-content-body">
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">Form Monitoring Kapasitas TPS</h3>
                <span className="tps-card-subtitle">Isi data pemantauan untuk TPS yang ditugaskan kepada Anda</span>
              </div>

              <form onSubmit={handleSubmitMonitoring} style={{ padding: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Pilih TPS <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    className="settings-input"
                    name="tps_id"
                    value={monitoringForm.tps_id || ''}
                    onChange={handleTpsChange}
                    required
                  >
                    <option value="">— Pilih TPS —</option>
                    {assignedTpsList.map((tps) => (
                      <option key={tps.id} value={tps.id}>
                        {tps.nama} ({tps.kecamatan})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Volume Sampah Aktual (m³) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      className="settings-input"
                      name="volume_aktual_m3"
                      value={monitoringForm.volume_aktual_m3}
                      onChange={handleMonitoringChange}
                      placeholder="Contoh: 4.5"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Persentase Kapasitas Terisi (%) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      className="settings-input"
                      name="persentase_kapasitas"
                      value={monitoringForm.persentase_kapasitas}
                      onChange={handleMonitoringChange}
                      placeholder="Contoh: 75"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Kondisi TPS</label>
                  <textarea
                    className="settings-input"
                    name="catatan_kondisi"
                    value={monitoringForm.catatan_kondisi}
                    onChange={handleMonitoringChange}
                    placeholder="Tulis kondisi TPS, catatan khusus, atau observasi..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Waktu Pemantauan</label>
                  <input
                    type="datetime-local"
                    className="settings-input"
                    name="waktu_monitoring"
                    value={monitoringForm.waktu_monitoring}
                    onChange={handleMonitoringChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Foto Kondisi TPS</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      style={{ display: 'none' }}
                      id="foto-upload"
                    />
                    <label htmlFor="foto-upload" style={{ cursor: 'pointer', padding: '12px', border: '2px dashed #cbd5e1', borderRadius: 8, textAlign: 'center', backgroundColor: '#f8fafc' }}>
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: 8 }} />
                      ) : (
                        <span>Klik atau tarik file foto di sini (JPG, PNG, WebP)</span>
                      )}
                    </label>
                    {fotoPreview && (
                      <button type="button" onClick={() => { setFotoFile(null); setFotoPreview(null); }} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMonitoringForm({ tps_id: '', volume_aktual_m3: '', persentase_kapasitas: '', catatan_kondisi: '', waktu_monitoring: '' });
                      setFotoFile(null);
                      setFotoPreview(null);
                    }}
                    style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-add-primary"
                    disabled={loading}
                  >
                    {loading ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: RIWAYAT MONITORING */}
        {activeMenu === 'riwayat' && (
          <div className="tps-content-body">
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">Riwayat Monitoring Saya</h3>
                <span className="tps-card-subtitle">Semua laporan monitoring yang telah Anda kirim</span>
              </div>

              {monitoringReports.length === 0 ? (
                <div className="tps-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <h4>Belum Ada Riwayat Monitoring</h4>
                  <p>Kirim laporan monitoring pertama Anda melalui menu Monitoring Kapasitas.</p>
                </div>
              ) : (
                <div className="tps-table-wrapper">
                  <table className="tps-table">
                    <thead>
                      <tr>
                        <th>TPS</th>
                        <th>Volume (m³)</th>
                        <th>% Kapasitas</th>
                        <th>Waktu Monitoring</th>
                        <th>Foto</th>
                        <th>Status Verifikasi</th>
                        <th>Alasan Penolakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoringReports.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <div>
                              <strong>{report.tps?.nama || `TPS #${report.tps_id}`}</strong>
                              <br />
                              <small style={{ color: '#64748b' }}>{report.tps?.kecamatan || ''}</small>
                            </div>
                          </td>
                          <td>{report.volume_aktual_m3}</td>
                          <td>{report.persentase_kapasitas}%</td>
                          <td>{formatDate(report.waktu_monitoring)}</td>
                          <td>
                            {report.foto_url && (
                              <a href={`${API_BASE_URL}${report.foto_url}`} target="_blank" rel="noopener noreferrer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" style={{ verticalAlign: 'middle' }}>
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              </a>
                            )}
                          </td>
                          <td>
                            <span className="tps-status-badge" style={{ backgroundColor: getStatusColor(report.status_verifikasi) + '20', color: getStatusColor(report.status_verifikasi) }}>
                              {report.status_verifikasi}
                            </span>
                          </td>
                          <td style={{ color: report.alasan_penolakan ? '#ef4444' : '#94a3b8' }}>
                            {report.alasan_penolakan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LOKASI TPS */}
        {activeMenu === 'lokasi' && (
          <div className="tps-content-body">
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">Peta Lokasi TPS Ditugaskan</h3>
                <span className="tps-card-subtitle">Lihat posisi geografis TPS yang menjadi tanggung jawab Anda</span>
              </div>

              {assignedTpsList.length === 0 ? (
                <div className="tps-empty-state" style={{ minHeight: '400px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                  </svg>
                  <h4>Belum Ada TPS Ditugaskan</h4>
                  <p>Tidak ada TPS yang ditampilkan di peta.</p>
                </div>
              ) : (
                <div className="tps-map-viewport-wrapper">
                  <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                  <div className="tps-map-legend-overlay">
                    <span className="tps-legend-title">LEGENDA TPS</span>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#16a34a' }}></span>
                      <span>Aman (Kapasitas < 75%)</span>
                    </div>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#f59e0b' }}></span>
                      <span>Hampir Penuh (≥ 75%)</span>
                    </div>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#ef4444' }}></span>
                      <span>Overload (> 90%)</span>
                    </div>
                    <div className="tps-legend-item">
                      <span className="tps-legend-bullet" style={{ backgroundColor: '#64748b' }}></span>
                      <span>Tanpa Koordinat</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TPS List below map */}
              <div className="tps-card" style={{ marginTop: '20px' }}>
                <div className="tps-card-header">
                  <h3 className="tps-card-title">Daftar TPS Ditugaskan</h3>
                  <span className="tps-card-subtitle">{assignedTpsList.length} TPS</span>
                </div>
                <div className="tps-capacity-list">
                  {assignedTpsList.map((tps) => (
                    <div key={tps.id} className="tps-capacity-item-card">
                      <div className="tps-capacity-item-top">
                        <div>
                          <span className="tps-id-code">{tps.id}</span>
                          <h4 className="tps-item-name">{tps.nama}</h4>
                        </div>
                        <span className="tps-status-badge aman">{tps.status}</span>
                      </div>
                      <div className="tps-capacity-metric-row">
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#64748b' }}>
                            📍 {tps.lokasi || '-'}
                          </p>
                          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#64748b' }}>
                            🏛️ Kecamatan: {tps.kecamatan}
                          </p>
                          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#64748b' }}>
                            📦 Daya Tampung: {tps.day_a_tampung_m3 || '-'} m³
                          </p>
                          {tps.latitude && tps.longitude && (
                            <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#0284c7' }}>
                              📌 Koordinat: {parseFloat(tps.latitude).toFixed(6)}, {parseFloat(tps.longitude).toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFIL SAYA */}
        {activeMenu === 'profil' && (
          <div className="tps-content-body">
            <div className="tps-card" style={{ maxWidth: '600px' }}>
              <div className="tps-card-header">
                <h3 className="tps-card-title">Profil Saya</h3>
                <span className="tps-card-subtitle">Informasi akun Petugas TPS</span>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: 12 }}>
                  <div className="tps-user-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                    {officerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                      {officerName}
                    </h3>
                    <span className="tps-user-role">{officerRole}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{currentUser?.email || '-'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{currentUser?.username || '-'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{currentUser?.id || '-'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>petugas_tps</p>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wilayah Kecamatan</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{currentUser?.wilayah_kecamatan || '-'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wilayah Kelurahan</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{currentUser?.wilayah_kelurahan || '-'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wilayah Kota</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{currentUser?.wilayah_kota || 'Surabaya'}</p>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TPS Ditugaskan</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>
                      {assignedTpsList.length > 0
                        ? assignedTpsList.map(tps => tps.nama).join(', ')
                        : 'Belum ditetapkan'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}