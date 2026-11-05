import React, { useState, useEffect, useRef } from 'react';
import './PetugasTpsPanel.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petugasTpsApi } from '../api/petugasTps';
import pandawaraImg from '../assets/images/berita_pandawara.jpg';
import kaliTebuImg from '../assets/images/berita_kali_tebu.jpg';
import bankSampahImg from '../assets/images/bank_sampah.jpg';
import pilahAsnImg from '../assets/images/berita_pilah_asn.jpg';

const SURABAYA_CENTER = [-7.2575, 112.7521];

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
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Monitoring Report Form state
  const [monitoringForm, setMonitoringForm] = useState({
    tps_id: '',
    volume_aktual_m3: '',
    persentase_kapasitas: '',
    catatan_kondisi: '',
    foto: null
  });
  const [selectedTpsForReport, setSelectedTpsForReport] = useState(null);

  const officerName = currentUser?.nama_lengkap || currentUser?.nama || 'Petugas TPS';
  const officerRole = 'Petugas TPS';
  const kelurahanName = currentUser?.wilayah_kelurahan || currentUser?.kelurahan || 'Wilayah Tugas';

  const [mapFilter, setMapFilter] = useState('Semua');
  const dashMapRef = useRef(null);
  const dashMapInstance = useRef(null);
  const fullMapRef = useRef(null);
  const fullMapInstance = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load data from backend
  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    setIsLoading(true);
    try {
      const [tpsData, statsData, reportsData] = await Promise.all([
        petugasTpsApi.getMyTps().catch(() => []),
        petugasTpsApi.getDashboardStats().catch(() => ({})),
        petugasTpsApi.getMyMonitoringReports().catch(() => [])
      ]);

      setAssignedTpsList(tpsData || []);
      setDashboardStats(statsData || {});
      setMonitoringReports(reportsData || []);

      if (tpsData && tpsData.length > 0) {
        setMonitoringForm(prev => ({ ...prev, tps_id: tpsData[0].id }));
        setSelectedTpsForReport(tpsData[0]);
      }
    } catch (err) {
      console.error("Failed to load backend data for Petugas TPS:", err);
      showToast("Gagal memuat data dari server.");
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!monitoringForm.tps_id || !monitoringForm.volume_aktual_m3 || !monitoringForm.persentase_kapasitas) {
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
        foto: monitoringForm.foto
      });

      showToast("Laporan monitoring berhasil dikirim dan menunggu verifikasi.");
      setMonitoringForm({
        tps_id: assignedTpsList[0]?.id || '',
        volume_aktual_m3: '',
        persentase_kapasitas: '',
        catatan_kondisi: '',
        foto: null
      });
      loadBackendData();
    } catch (err) {
      console.error("Submit monitoring error:", err);
      showToast(err.response?.data?.detail || "Gagal mengirim laporan monitoring.");
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
            </div>

            <div className="tps-dash-split-grid" style={{ marginTop: 24 }}>
              <div className="tps-card">
                <div className="tps-card-header">
                  <h3 className="tps-card-title">Daftar TPS Tanggung Jawab</h3>
                </div>
                <div className="tps-capacity-list">
                  {assignedTpsList.length === 0 ? (
                    <p style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Belum ada TPS yang ditugaskan kepada Anda.</p>
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
                          <div>Daya Tampung: <strong>{tps.daya_tampung_m3 || '—'} m³</strong></div>
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

        {/* TAB 3: MONITORING KAPASITAS */}
        {activeMenu === 'kapasitas' && (
          <div className="tps-content-body">
            <div className="tps-card" style={{ maxWidth: 800, margin: '0 auto' }}>
              <div className="tps-card-header">
                <h3 className="tps-card-title">Form Laporan Monitoring Kapasitas TPS</h3>
                <span className="tps-card-subtitle">Kirim laporan kondisi aktual TPS yang ditugaskan</span>
              </div>

              <form onSubmit={handleMonitoringSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Pilih TPS Tanggung Jawab</label>
                  <select
                    className="settings-input"
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    value={monitoringForm.tps_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setMonitoringForm({ ...monitoringForm, tps_id: id });
                      setSelectedTpsForReport(assignedTpsList.find(t => String(t.id) === String(id)));
                    }}
                    required
                  >
                    <option value="">— Pilih TPS —</option>
                    {assignedTpsList.map((tps) => (
                      <option key={tps.id} value={tps.id}>
                        {tps.nama} ({tps.kecamatan}) {tps.daya_tampung_m3 ? `- Max: ${tps.daya_tampung_m3} m³` : ''}
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
                      if (selectedTpsForReport && selectedTpsForReport.daya_tampung_m3) {
                        const max = parseFloat(selectedTpsForReport.daya_tampung_m3);
                        if (max > 0) {
                          pct = Math.min(100, Math.round((parseFloat(vol) / max) * 100));
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

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Foto Kondisi TPS</label>
                  <input
                    type="file"
                    accept="image/*"
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
                  disabled={isLoading}
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
                  <p style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Belum ada riwayat laporan monitoring yang dikirim.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {monitoringReports.map((rep) => (
                      <div key={rep.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          {rep.foto_url && (
                            <img src={`${API_BASE_URL}${rep.foto_url}`} alt="TPS" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                          )}
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>TPS ID: {rep.tps_id}</h4>
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