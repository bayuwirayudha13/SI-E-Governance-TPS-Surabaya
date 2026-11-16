import React, { useState, useEffect, useRef } from 'react';
import './PetugasTpsPanel.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petugasTpsApi } from '../api/petugasTps';
import { api, API_BASE_URL } from '../api/client';
import pandawaraImg from '../assets/images/berita_pandawara.jpg';
import kaliTebuImg from '../assets/images/berita_kali_tebu.jpg';
import bankSampahImg from '../assets/images/bank_sampah.jpg';
import pilahAsnImg from '../assets/images/berita_pilah_asn.jpg';

const SURABAYA_CENTER = [-7.2575, 112.7521];
const getLocalDateTimeInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const getApiErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ');
  return error?.message || 'Terjadi kesalahan saat menghubungi server.';
};

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
  const [activeMenu, setActiveMenu] = useState('dasbor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [assignedTpsList, setAssignedTpsList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_tps: 0,
    total_monitoring: 0,
    pending_reports: 0,
    approved_reports: 0,
    rejected_reports: 0,
    last_monitoring: null
  });
  const [monitoringReports, setMonitoringReports] = useState([]);
  const [profileUser, setProfileUser] = useState(currentUser || null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Monitoring Report Form state
  const [monitoringForm, setMonitoringForm] = useState({
    tps_id: '',
    volume_aktual_m3: '',
    persentase_kapasitas: '',
    catatan_kondisi: '',
    foto: null,
    waktu_monitoring: getLocalDateTimeInput()
  });
  const [selectedTpsForReport, setSelectedTpsForReport] = useState(null);

  const officerName = profileUser?.nama_lengkap || profileUser?.nama || 'Petugas TPS';
  const officerRole = 'Petugas TPS';
  const kelurahanName = [
    profileUser?.wilayah_kelurahan || profileUser?.kelurahan,
    profileUser?.wilayah_kecamatan,
  ].filter(Boolean).join(', ') || 'Wilayah Tugas';

  const [mapFilter, setMapFilter] = useState('Semua');
  const dashMapRef = useRef(null);
  const dashMapInstance = useRef(null);
  const fullMapRef = useRef(null);
  const fullMapInstance = useRef(null);
  const photoInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadBackendData = async () => {
    setIsLoading(true);
    setLoadError('');
    const results = await Promise.allSettled([
      petugasTpsApi.getMyTps(),
      petugasTpsApi.getDashboardStats(),
      petugasTpsApi.getMyMonitoringReports(),
      api.get('/api/auth/me')
    ]);
    const errors = [];

    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
      const tpsData = results[0].value;
      setAssignedTpsList(tpsData);
      setMonitoringForm((prev) => ({ ...prev, tps_id: tpsData[0]?.id || '' }));
      setSelectedTpsForReport(tpsData[0] || null);
    } else {
      errors.push(`Daftar TPS: ${results[0].status === 'rejected' ? getApiErrorMessage(results[0].reason) : 'Format respons tidak valid.'}`);
    }

    if (results[1].status === 'fulfilled' && results[1].value && typeof results[1].value === 'object' && !Array.isArray(results[1].value)) {
      setDashboardStats(results[1].value);
    } else {
      errors.push(`Statistik: ${results[1].status === 'rejected' ? getApiErrorMessage(results[1].reason) : 'Format respons tidak valid.'}`);
    }

    if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
      setMonitoringReports(results[2].value);
    } else {
      errors.push(`Riwayat monitoring: ${results[2].status === 'rejected' ? getApiErrorMessage(results[2].reason) : 'Format respons tidak valid.'}`);
    }
    if (results[3].status === 'fulfilled' && results[3].value?.data?.role === 'petugas_tps') {
      setProfileUser(results[3].value.data);
    } else {
      errors.push(`Profil: ${results[3].status === 'rejected' ? getApiErrorMessage(results[3].reason) : 'Profil bukan Petugas TPS atau format tidak valid.'}`);
    }

    if (errors.length > 0) {
      const message = `Gagal memuat data backend. ${errors.join(' ')}`;
      setLoadError(message);
      showToast(message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  const handleNavClick = (menuKey) => {
    setActiveMenu(menuKey);
    setMobileMenuOpen(false);
    window.location.hash = `petugas-tps/${menuKey}`;
  };

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('peta')) setActiveMenu('peta');
    else if (hash.includes('kapasitas')) setActiveMenu('kapasitas');
    else if (hash.includes('jadwal')) setActiveMenu('jadwal');
    else if (hash.includes('validasi')) setActiveMenu('validasi');
  }, []);

  // Submit monitoring report
  const handleMonitoringSubmit = async (e) => {
    e.preventDefault();
    if (
      !monitoringForm.tps_id ||
      monitoringForm.volume_aktual_m3 === '' ||
      monitoringForm.persentase_kapasitas === ''
    ) {
      showToast("Mohon lengkapi TPS, volume aktual, dan persentase kapasitas.");
      return;
    }

    try {
      setIsLoading(true);
      await petugasTpsApi.createMonitoringReport({
        tps_id: Number(monitoringForm.tps_id),
        volume_aktual_m3: parseFloat(monitoringForm.volume_aktual_m3),
        persentase_kapasitas: parseFloat(monitoringForm.persentase_kapasitas),
        catatan_kondisi: monitoringForm.catatan_kondisi,
        foto: monitoringForm.foto,
        waktu_monitoring: monitoringForm.waktu_monitoring
      });

      setMonitoringForm({
        tps_id: assignedTpsList[0]?.id || '',
        volume_aktual_m3: '',
        persentase_kapasitas: '',
        catatan_kondisi: '',
        foto: null,
        waktu_monitoring: getLocalDateTimeInput()
      });
      if (photoInputRef.current) photoInputRef.current.value = '';
      showToast("Laporan monitoring berhasil dikirim dan menunggu verifikasi.");
      await loadBackendData();
    } catch (err) {
      console.error("Submit monitoring error:", err);
      showToast(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Map initialization
  useEffect(() => {
    if (activeMenu !== 'dasbor' || !dashMapRef.current) return;
    if (dashMapInstance.current) {
      dashMapInstance.current.remove();
      dashMapInstance.current = null;
    }

    const map = L.map(dashMapRef.current, {
      center: SURABAYA_CENTER,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });
    dashMapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    assignedTpsList.forEach((tps) => {
      if (!tps.latitude || !tps.longitude) return;
      const lat = parseFloat(tps.latitude);
      const lng = parseFloat(tps.longitude);
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<strong>${tps.nama}</strong><br/>Kecamatan: ${tps.kecamatan}`);
    });

    return () => {
      if (dashMapInstance.current) {
        dashMapInstance.current.remove();
        dashMapInstance.current = null;
      }
    };
  }, [activeMenu, assignedTpsList]);

  useEffect(() => {
    if (activeMenu !== 'peta' || !fullMapRef.current) return;
    if (fullMapInstance.current) {
      fullMapInstance.current.remove();
      fullMapInstance.current = null;
    }

    const tpsWithCoordinates = assignedTpsList.filter((tps) => tps.latitude && tps.longitude);
    const firstTps = tpsWithCoordinates[0];
    const center = firstTps
      ? [parseFloat(firstTps.latitude), parseFloat(firstTps.longitude)]
      : SURABAYA_CENTER;
    const map = L.map(fullMapRef.current, {
      center,
      zoom: firstTps ? 14 : 12,
      zoomControl: true,
      attributionControl: false
    });
    fullMapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    tpsWithCoordinates.forEach((tps) => {
      const marker = L.marker([parseFloat(tps.latitude), parseFloat(tps.longitude)]).addTo(map);
      const popup = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = tps.nama;
      const location = document.createElement('div');
      location.textContent = `${tps.lokasi || '-'} · ${tps.kecamatan || '-'}`;
      popup.append(name, location);
      marker.bindPopup(popup);
    });

    if (tpsWithCoordinates.length > 1) {
      map.fitBounds(tpsWithCoordinates.map((tps) => [
        parseFloat(tps.latitude),
        parseFloat(tps.longitude)
      ]), { padding: [32, 32] });
    }

    return () => {
      if (fullMapInstance.current) {
        fullMapInstance.current.remove();
        fullMapInstance.current = null;
      }
    };
  }, [activeMenu, assignedTpsList]);

  return (
    <div className="tps-page-container">
      {mobileMenuOpen && (
        <div className="tps-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`tps-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div>
          <div className="tps-sidebar-brand">
            <div className="tps-brand-badge">SI</div>
            <div className="tps-brand-texts">
              <span className="tps-brand-title">SI-PETASAN</span>
              <span className="tps-brand-subtitle">PETUGAS TPS</span>
            </div>
          </div>

          <div className="tps-menu-section-label">MENU UTAMA</div>
          <nav className="tps-nav-list">
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'dasbor' ? 'active' : ''}`}
              onClick={() => handleNavClick('dasbor')}
            >
              <span>Dasbor Utama</span>
            </button>
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'peta' ? 'active' : ''}`}
              onClick={() => handleNavClick('peta')}
            >
              <span>Peta GIS</span>
            </button>
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'kapasitas' ? 'active' : ''}`}
              onClick={() => handleNavClick('kapasitas')}
            >
              <span>Monitoring Kapasitas</span>
            </button>
            <button
              type="button"
              className={`tps-nav-item ${activeMenu === 'riwayat' ? 'active' : ''}`}
              onClick={() => handleNavClick('riwayat')}
            >
              <span>Riwayat Monitoring</span>
            </button>
          </nav>
        </div>

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
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="tps-main-area">
        <header className="tps-topbar">
          <div className="tps-topbar-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="tps-mobile-toggle-btn"
                onClick={() => setMobileMenuOpen(true)}
              >
                ☰
              </button>
              <h1 className="tps-topbar-title">
                {activeMenu === 'dasbor' && 'Dasbor Utama Petugas TPS'}
                {activeMenu === 'peta' && 'Peta GIS TPS Ditugaskan'}
                {activeMenu === 'kapasitas' && 'Monitoring Kapasitas TPS'}
                {activeMenu === 'riwayat' && 'Riwayat Monitoring'}
              </h1>
            </div>
            <span className="tps-topbar-subtitle">
              SI-PETASAN · Petugas TPS · {kelurahanName}
            </span>
          </div>
        </header>

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
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}>
            <span>{toastMessage}</span>
          </div>
        )}

        {loadError && (
          <div className="tps-content-body" style={{ paddingBottom: 0 }}>
            <div role="alert" className="tps-alert-banner">
              <p className="tps-alert-text">{loadError}</p>
              <button type="button" className="tps-alert-link" onClick={loadBackendData} disabled={isLoading}>
                {isLoading ? 'Memuat...' : 'Coba lagi'}
              </button>
            </div>
          </div>
        )}

        {isLoading && !loadError && (
          <p className="tps-content-body" role="status">Memuat data dari server...</p>
        )}

        {/* TAB 1: DASBOR UTAMA */}
        {activeMenu === 'dasbor' && (
          <div className="tps-content-body">
            <div className="tps-stats-grid">
              <div className="tps-stat-card">
                <span className="tps-stat-label">TPS Ditugaskan</span>
                <span className="tps-stat-value">{dashboardStats.total_tps || assignedTpsList.length}</span>
                <span className="tps-stat-subtext">Total TPS Tanggung Jawab</span>
              </div>
              <div className="tps-stat-card">
                <span className="tps-stat-label">Total Monitoring</span>
                <span className="tps-stat-value">{dashboardStats.total_monitoring || 0}</span>
                <span className="tps-stat-subtext">Laporan Terkirim</span>
              </div>
              <div className="tps-stat-card">
                <span className="tps-stat-label">Menunggu Verifikasi</span>
                <span className="tps-stat-value" style={{ color: '#d97706' }}>{dashboardStats.pending_reports || 0}</span>
                <span className="tps-stat-subtext">Belum disetujui admin</span>
              </div>
              <div className="tps-stat-card">
                <span className="tps-stat-label">Disetujui</span>
                <span className="tps-stat-value" style={{ color: '#16a34a' }}>{dashboardStats.approved_reports || 0}</span>
                <span className="tps-stat-subtext">Laporan valid</span>
              </div>
              <div className="tps-stat-card">
                <span className="tps-stat-label">Ditolak</span>
                <span className="tps-stat-value" style={{ color: '#dc2626' }}>{dashboardStats.rejected_reports || 0}</span>
                <span className="tps-stat-subtext">Perlu diperiksa kembali</span>
              </div>
            </div>
            <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Monitoring terakhir: {dashboardStats.last_monitoring
                ? new Date(dashboardStats.last_monitoring).toLocaleString('id-ID')
                : 'Belum ada laporan'}
            </p>

            <div className="tps-dash-split-grid" style={{ marginTop: 24 }}>
              <div className="tps-card">
                <div className="tps-card-header">
                  <h3 className="tps-card-title">Daftar TPS Tanggung Jawab</h3>
                </div>
                <div className="tps-capacity-list">
                  {assignedTpsList.length === 0 ? (
                    <p style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                      {isLoading ? 'Memuat daftar TPS...' : 'Belum ada TPS yang ditugaskan kepada Anda.'}
                    </p>
                  ) : (
                    assignedTpsList.map((tps) => (
                      <div key={tps.id} className="tps-capacity-item-card" style={{ padding: 16 }}>
                        <div className="tps-capacity-item-top">
                          <div>
                            <span className="tps-id-code">ID: {tps.id}</span>
                            <h4 className="tps-item-name">{tps.nama}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>{tps.lokasi || tps.kecamatan}</p>
                          </div>
                          <span className="tps-status-badge aman">{tps.status || 'Aktif'}</span>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: '0.85rem' }}>
                          <div>Daya Tampung: <strong>{tps.daya_tampung_m3 ?? '—'} m³</strong></div>
                          <div>Container: <strong>{tps.jumlah_container || '—'}</strong></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="tps-card">
                <div className="tps-card-header">
                  <h3 className="tps-card-title">Peta Lokasi TPS</h3>
                </div>
                <div className="tps-map-viewport-wrapper" style={{ height: 320 }}>
                  <div ref={dashMapRef} style={{ width: '100%', height: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'peta' && (
          <div className="tps-content-body">
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">Peta GIS TPS Ditugaskan</h3>
                <span className="tps-card-subtitle">{assignedTpsList.length} TPS</span>
              </div>
              <div ref={fullMapRef} className="tps-map-viewport-large" />
              {assignedTpsList.length > 0 && !assignedTpsList.some((tps) => tps.latitude && tps.longitude) && (
                <p style={{ marginTop: 12, color: '#64748b' }}>Koordinat lokasi belum tersedia untuk TPS yang ditugaskan.</p>
              )}
            </div>
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">TPS Tanggung Jawab</h3>
              </div>
              <div className="tps-capacity-list">
                {assignedTpsList.length === 0 ? (
                  <p style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                    {isLoading ? 'Memuat daftar TPS...' : 'Belum ada TPS yang ditugaskan kepada Anda.'}
                  </p>
                ) : assignedTpsList.map((tps) => (
                  <div key={tps.id} className="tps-capacity-item-card">
                    <div className="tps-capacity-item-top">
                      <div>
                        <span className="tps-id-code">ID: {tps.id}</span>
                        <h4 className="tps-item-name">{tps.nama}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
                          {tps.lokasi || tps.kecamatan || 'Lokasi belum tersedia'}
                        </p>
                      </div>
                      <span className="tps-status-badge aman">{tps.status || 'Aktif'}</span>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: '0.85rem' }}>
                      <div>Daya Tampung: <strong>{tps.daya_tampung_m3 ?? '—'} m³</strong></div>
                      <div>Container: <strong>{tps.jumlah_container || '—'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONITORING KAPASITAS */}
        {activeMenu === 'kapasitas' && (
          <div className="tps-content-body">
            <div className="tps-card" style={{ maxWidth: 800, margin: '0 auto' }}>
              <div className="tps-card-header">
                <h3 className="tps-card-title">Form Laporan Monitoring Kapasitas TPS</h3>
                <span className="tps-card-subtitle">Kirim laporan kondisi aktual TPS yang ditugaskan</span>
              </div>

              <form onSubmit={handleMonitoringSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!isLoading && !loadError && assignedTpsList.length === 0 && (
                  <p role="status" style={{ margin: 0, padding: 12, borderRadius: 8, background: '#fff7ed', color: '#9a3412' }}>
                    Belum ada TPS yang ditugaskan ke akun Anda. Hubungi Superadmin untuk menetapkan TPS tanggung jawab.
                  </p>
                )}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Pilih TPS Tanggung Jawab</label>
                  <select
                    className="settings-input"
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    value={monitoringForm.tps_id}
                    disabled={isLoading || assignedTpsList.length === 0}
                    onChange={(e) => {
                      const id = e.target.value;
                      const nextTps = assignedTpsList.find((t) => String(t.id) === String(id));
                      let percentage = monitoringForm.persentase_kapasitas;
                      if (monitoringForm.volume_aktual_m3 !== '' && nextTps?.daya_tampung_m3) {
                        const max = Number(nextTps.daya_tampung_m3);
                        if (max > 0) {
                          percentage = Math.min(
                            100,
                            Math.round((Number(monitoringForm.volume_aktual_m3) / max) * 100),
                          );
                        }
                      }
                      setMonitoringForm({ ...monitoringForm, tps_id: id, persentase_kapasitas: percentage });
                      setSelectedTpsForReport(nextTps);
                    }}
                    required
                  >
                    <option value="">— Pilih TPS —</option>
                    {assignedTpsList.map((tps) => (
                      <option key={tps.id} value={tps.id}>
                        {tps.nama} ({tps.kecamatan}) {tps.daya_tampung_m3 != null ? `- Max: ${tps.daya_tampung_m3} m³` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTpsForReport && selectedTpsForReport.daya_tampung_m3 && (
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <div>Daya Tampung Maksimum TPS: <strong>{selectedTpsForReport.daya_tampung_m3} m³</strong></div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Volume Sampah Aktual (m³)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="settings-input"
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    placeholder="Contoh: 12.5"
                    value={monitoringForm.volume_aktual_m3}
                    onChange={(e) => {
                      const vol = e.target.value;
                      let pct = monitoringForm.persentase_kapasitas;
                      if (vol === '') {
                        pct = '';
                      } else if (selectedTpsForReport && selectedTpsForReport.daya_tampung_m3) {
                        const max = parseFloat(selectedTpsForReport.daya_tampung_m3);
                        if (max > 0) {
                          const volume = Number(vol);
                          pct = Number.isFinite(volume)
                            ? Math.min(100, Math.round((volume / max) * 100))
                            : '';
                        }
                      }
                      setMonitoringForm({ ...monitoringForm, volume_aktual_m3: vol, persentase_kapasitas: pct });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Persentase Kapasitas Terisi (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="settings-input"
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    placeholder="Contoh: 85"
                    value={monitoringForm.persentase_kapasitas}
                    onChange={(e) => setMonitoringForm({ ...monitoringForm, persentase_kapasitas: e.target.value })}
                    required
                  />
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', fontSize: '0.85rem' }}>
                  <strong>Pratinjau laporan (belum menjadi kapasitas resmi)</strong>
                  <div style={{ marginTop: 6 }}>
                    Terisi: {monitoringForm.persentase_kapasitas === ''
                      ? '—'
                      : `${monitoringForm.persentase_kapasitas}%`}
                    {' · '}
                    Tersisa: {monitoringForm.persentase_kapasitas === ''
                      ? '—'
                      : `${Math.max(0, 100 - Number(monitoringForm.persentase_kapasitas))}%`}
                    {' · '}
                    Volume aktual: {monitoringForm.volume_aktual_m3 === ''
                      ? '—'
                      : `${monitoringForm.volume_aktual_m3} m³`}
                  </div>
                  <div style={{ marginTop: 4, color: '#475569' }}>
                    Daya tampung maksimum tidak diubah oleh laporan monitoring.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Waktu Monitoring</label>
                  <input
                    type="datetime-local"
                    className="settings-input"
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    value={monitoringForm.waktu_monitoring}
                    onChange={(e) => setMonitoringForm({ ...monitoringForm, waktu_monitoring: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Foto Kondisi TPS</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={photoInputRef}
                    onChange={(e) => setMonitoringForm({ ...monitoringForm, foto: e.target.files?.[0] || null })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Catatan Kondisi / Keterangan</label>
                  <textarea
                    className="settings-input"
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', minHeight: 80 }}
                    placeholder="Tuliskan catatan kondisi TPS, misal: kontainer penuh, perlu pengangkutan segera..."
                    value={monitoringForm.catatan_kondisi}
                    onChange={(e) => setMonitoringForm({ ...monitoringForm, catatan_kondisi: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="tps-btn-add-green"
                  style={{ padding: '12px', justifyContent: 'center', marginTop: 8 }}
                  disabled={isLoading || assignedTpsList.length === 0}
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Laporan Monitoring'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT MONITORING */}
        {activeMenu === 'riwayat' && (
          <div className="tps-content-body">
            <div className="tps-card">
              <div className="tps-card-header">
                <h3 className="tps-card-title">Riwayat Laporan Monitoring Anda</h3>
                <span className="tps-card-subtitle">{monitoringReports.length} laporan tercatat</span>
              </div>

              <div style={{ padding: 20 }}>
                {monitoringReports.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
                    {isLoading ? 'Memuat riwayat monitoring...' : 'Belum ada riwayat laporan monitoring yang dikirim.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {monitoringReports.map((rep) => (
                      <div key={rep.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          {rep.foto_url && (
                            <img src={`${API_BASE_URL}${rep.foto_url}`} alt="TPS" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                          )}
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{rep.tps_nama || `TPS ID: ${rep.tps_id}`}</h4>
                            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#334155' }}>
                              Volume: <strong>{rep.volume_aktual_m3} m³</strong> · Kapasitas: <strong>{rep.persentase_kapasitas}%</strong>
                            </p>
                            {rep.catatan_kondisi && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Catatan: {rep.catatan_kondisi}</p>}
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Waktu: {rep.waktu_monitoring}</span>
                          </div>
                        </div>
                        <div>
                          <span className={`tps-status-badge ${rep.status_verifikasi === 'Disetujui' ? 'aman' : rep.status_verifikasi === 'Ditolak' ? 'overload' : 'hampir-penuh'}`}>
                            {rep.status_verifikasi}
                          </span>
                          {rep.alasan_penolakan && (
                            <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: '4px 0 0 0' }}>Alasan: {rep.alasan_penolakan}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}