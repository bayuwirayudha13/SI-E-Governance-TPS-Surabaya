import React, { useState, useEffect } from 'react';
import AdminChat from './AdminChat';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminPanel({ onLogout, currentUser: userFromProp }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(userFromProp);
  const [wargas, setWargas] = useState([]);
  const [jadwals, setJadwals] = useState([]);
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
    if (activeMenu === 'pengambilan') {
      loadRiwayat();
    }
  }, [activeMenu]);

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

        {/* DASHBOARD */}
        {activeMenu === 'dashboard' && (
          <div className="admin-content-view">
            <div className="admin-stats-row">
              <div className="admin-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap icon-blue">👥</div>
                  <span className="stat-badge-live">LIVE</span>
                </div>
                <div className="stat-card-number">{wargas.length}</div>
                <div className="stat-card-label">Total Warga Terdaftar</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap icon-orange">📅</div>
                  <span className="stat-badge-live">LIVE</span>
                </div>
                <div className="stat-card-number">{jadwals.length}</div>
                <div className="stat-card-label">Jadwal Aktif</div>
              </div>
            </div>

            <div className="admin-dashboard-grid">
              <div className="admin-card">
                <h3 className="admin-card-title">Warga Terbaru</h3>
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
                <h3 className="admin-card-title">Jadwal Minggu Ini</h3>
                <div className="tps-realtime-list">
                  {jadwals.slice(0, 5).map(j => (
                    <div key={j.id} className="tps-realtime-row">
                      <div className="tps-name-col">
                        <span>{j.hari}</span>
                      </div>
                      <div style={{ flex: 1, fontSize: '0.85rem', color: '#64748b' }}>
                        {j.area} • {j.waktu_mulai}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
