import React, { useState, useEffect } from 'react';
import './WargaPanel.css';

const API_BASE = 'http://localhost:8000';

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

// Schedule data for Jadwal Pengambilan
const SCHEDULE_ITEMS = [
  { day: 'Senin', isToday: true, area: 'RT 01–03 Jl. Mawar', time: '06:00–08:00', officer: 'Hendra', type: 'Rutin' },
  { day: 'Selasa', isToday: false, area: 'RT 04–06 Jl. Melati', time: '07:00–09:00', officer: 'Wahyu', type: 'Rutin' },
  { day: 'Rabu', isToday: false, area: 'RT 07–09 Jl. Kenanga', time: '06:30–08:30', officer: 'Rizki', type: 'Rutin' },
  { day: 'Kamis', isToday: false, area: 'RT 10–12 Jl. Flamboyan', time: '07:00–09:30', officer: 'Agus', type: 'Rutin' },
  { day: 'Jumat', isToday: false, area: 'RT 01–06 Semua Zona', time: '06:00–10:00', officer: 'Tim Gabungan', type: 'Besar' },
  { day: 'Sabtu', isToday: false, area: 'RT 07–12 Semua Zona', time: '07:00–11:00', officer: 'Tim Gabungan', type: 'Besar' },
  { day: 'Minggu', isToday: false, area: 'Libur — tidak ada pengambilan', time: '—', officer: '—', type: 'Libur' }
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

export default function WargaPanel({ onLogout, wargaId = 12 }) {
  // Navigation: 'dashboard' | 'jadwal' | 'setor' | 'panduan' | 'tracking'
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Warga stats state
  const [points, setPoints] = useState(0);
  const [totalSetoran, setTotalSetoran] = useState(0);
  const [totalKg, setTotalKg] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Setor & Reward interactive state
  const [selectedPlastic, setSelectedPlastic] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');

  // Tracking TPS state
  const [selectedTpsId, setSelectedTpsId] = useState('mawar');
  const [tpsList, setTpsList] = useState(TPS_LIST);

  const selectedTps = tpsList.find((t) => t.id === selectedTpsId) || tpsList[0];

  // Load data on mount
  useEffect(() => {
    loadWargaData();
    loadSetoranData();
  }, [wargaId]);

  const loadWargaData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPoints(data.total_poin || 0);
      }
    } catch (err) {
      console.error('Load warga data error:', err);
    }
  };

  const loadSetoranData = async () => {
    try {
      const storedUserId = localStorage.getItem('user_id');
      const actualWargaId = storedUserId || wargaId;
      
      const response = await fetch(`${API_BASE}/api/setoran/?warga_id=${actualWargaId}`);
      if (response.ok) {
        const data = await response.json();
        setTotalSetoran(data.length);
        const totalBerat = data.reduce((sum, s) => sum + (parseFloat(s.perkiraan_berat_kg) || 0), 0);
        setTotalKg(parseFloat(totalBerat.toFixed(1)));
      }
    } catch (err) {
      console.error('Load setoran data error:', err);
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

      const response = await fetch(`${API_BASE}/api/setoran/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warga_id: parseInt(actualWargaId),
          jenis_sampah: selectedPlastic.code,
          perkiraan_berat_kg: parseFloat(weightInput),
          metode_setor: 'Diantar Langsung',
          tps_id: tpsList.length > 0 ? tpsList[0].id : null
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal setor sampah');
      }

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
              <div className="warga-profile-name">Warga</div>
              <div className="warga-profile-sub">Kelurahan Sukamaju</div>
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
              {activeMenu === 'panduan' && 'Panduan Pemilahan'}
              {activeMenu === 'tracking' && 'Tracking TPS'}
            </h2>
            <div className="warga-page-date">
              Kelurahan Sukamaju - Senin, 28 September 2026
            </div>
          </div>

          <div className="warga-header-points">
            <div className="warga-points-meta">
              <span className="warga-points-label">Total Poin Kamu</span>
              <span className="warga-points-val">{points.toLocaleString('id-ID')} pts</span>
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
                    {SCHEDULE_ITEMS.map((item, idx) => (
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
    </div>
  );
}
