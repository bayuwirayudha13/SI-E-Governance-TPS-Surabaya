import React, { useState, useEffect } from 'react';
import './WargaPanel.css';

const PLASTIC_TYPES = [
  { id: 'pete', code: 'PETE', name: 'PET / PETE', sub: 'Botol air minum, botol minuman', rate: 50, color: '#0284c7' },
  { id: 'hdpe', code: 'HDPE', name: 'HDPE', sub: 'Galon, jerigen, botol deterjen', rate: 45, color: '#16a34a' },
  { id: 'pvc', code: 'PVC', name: 'PVC', sub: 'Pipa, selang, kemasan bening', rate: 30, color: '#9333ea' },
  { id: 'ldpe', code: 'LDPE', name: 'LDPE', sub: 'Kantong kresek, plastik wrap', rate: 25, color: '#ea580c' },
  { id: 'pp', code: 'PP', name: 'PP', sub: 'Tutup botol, sedotan, ember', rate: 40, color: '#dc2626' },
  { id: 'ps', code: 'PS', name: 'PS / Styrofoam', sub: 'Gelas plastik, kotak styrofoam', rate: 15, color: '#854d0e' },
  { id: 'other', code: 'OTHER', name: 'Lainnya (ABS, PC, dll)', sub: 'Casing elektronik, helm, galon PC', rate: 20, color: '#334155' }
];

export default function WargaPanelAPI({ onLogout, wargaId = 12 }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [points, setPoints] = useState(0);
  const [totalSetoran, setTotalSetoran] = useState(0);
  const [totalKg, setTotalKg] = useState(0);
  const [selectedPlastic, setSelectedPlastic] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tpsList, setTpsList] = useState([]);
  const [setoranList, setSetoranList] = useState([]);

  // Load warga data on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const actualWargaId = storedUserId || wargaId;
    
    loadWargaData();
    loadTPSList();
    loadSetoranList(actualWargaId);
  }, [wargaId]);

  const loadWargaData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/auth/me', {
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

  const loadTPSList = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tps/');
      if (response.ok) {
        const data = await response.json();
        setTpsList(data);
      }
    } catch (err) {
      console.error('Load TPS list error:', err);
    }
  };

  const loadSetoranList = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/setoran/?warga_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setSetoranList(data);
        setTotalSetoran(data.length);
        const totalBerat = data.reduce((sum, s) => sum + (parseFloat(s.perkiraan_berat_kg) || 0), 0);
        setTotalKg(parseFloat(totalBerat.toFixed(1)));
      }
    } catch (err) {
      console.error('Load setoran list error:', err);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlastic || !weightInput || parseFloat(weightInput) <= 0) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:8000/api/setoran/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warga_id: wargaId,
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

      setPoints(prev => prev + addedPoints);
      setTotalSetoran(prev => prev + 1);
      setTotalKg(prev => parseFloat((prev + kg).toFixed(1)));
      setDepositSuccessMsg(`Berhasil setor ${kg} kg ${selectedPlastic.name}! Mendapatkan +${addedPoints} pts.`);
      setWeightInput('');
      setSelectedPlastic(null);

      setTimeout(() => setDepositSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Deposit error:', err);
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
              <div className="warga-brand-sub">KELURAHAN SUKAMAJU</div>
            </div>
          </div>

          <div className="warga-menu-section">
            <div className="warga-menu-label">MENU WARGA</div>
            <nav className="warga-nav-list">
              {[
                { id: 'dashboard', icon: 'rect', label: 'Dashboard' },
                { id: 'setor', icon: 'star', label: 'Setor & Reward' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`warga-nav-btn ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => setActiveMenu(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

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

      <main className="warga-main-content">
        <header className="warga-top-header">
          <div>
            <h2 className="warga-page-title">
              {activeMenu === 'dashboard' && 'Dashboard'}
              {activeMenu === 'setor' && 'Setor & Reward'}
            </h2>
            <div className="warga-page-date">Kelurahan Sukamaju - {new Date().toLocaleDateString('id-ID')}</div>
          </div>
          <div className="warga-header-points">
            <div className="warga-points-meta">
              <span className="warga-points-label">Total Poin Kamu</span>
              <span className="warga-points-val">{points.toLocaleString('id-ID')} pts</span>
            </div>
            <div className="warga-avatar-lg">W</div>
          </div>
        </header>

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

        {activeMenu === 'dashboard' && (
          <div className="warga-content-body">
            <div className="warga-stats-grid">
              <div className="warga-stat-card">
                <span className="warga-stat-icon gold">⭐</span>
                <span className="warga-stat-number">{points.toLocaleString('id-ID')}</span>
                <span className="warga-stat-label">Poin Saya</span>
              </div>
              <div className="warga-stat-card">
                <span className="warga-stat-icon green">♻️</span>
                <span className="warga-stat-number">{totalSetoran}</span>
                <span className="warga-stat-label">Total Setoran</span>
              </div>
              <div className="warga-stat-card">
                <span className="warga-stat-icon gray">🗑️</span>
                <span className="warga-stat-number">{totalKg}</span>
                <span className="warga-stat-label">Sampah (kg)</span>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'setor' && (
          <div className="warga-content-body">
            <div className="warga-panel-card">
              <h3 className="warga-card-title">Setor Sampah Plastik</h3>
              <form onSubmit={handleDepositSubmit} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Pilih Jenis Plastik</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {PLASTIC_TYPES.map(pt => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setSelectedPlastic(pt)}
                        style={{
                          padding: '10px',
                          border: selectedPlastic?.id === pt.id ? `3px solid ${pt.color}` : '1px solid #ccc',
                          borderRadius: '8px',
                          background: selectedPlastic?.id === pt.id ? `${pt.color}20` : '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: pt.color }}>{pt.code}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{pt.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPlastic && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Berat (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                      Estimasi poin: {weightInput ? Math.round(parseFloat(weightInput) * selectedPlastic.rate) : 0} pts
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedPlastic || !weightInput || isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#136c43',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    opacity: (!selectedPlastic || !weightInput || isLoading) ? 0.6 : 1
                  }}
                >
                  {isLoading ? 'Mengirim...' : 'Setor Sampah'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
