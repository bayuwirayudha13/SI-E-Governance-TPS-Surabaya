import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function SuperadminPanel({ onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [petugasList, setPetugasList] = useState([]);
  const [tpsList, setTpsList] = useState([]);
  const [jadwals, setJadwals] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [showAddTpsModal, setShowAddTpsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newUser, setNewUser] = useState({ nama_lengkap: '', email: '', password: '', role: 'warga' });
  const [newJadwal, setNewJadwal] = useState({ hari: '', waktu_mulai: '', waktu_selesai: '', area: '', petugas: '', tipe: 'Rutin' });
  const [newTps, setNewTps] = useState({ nama: '', kecamatan: '', status: 'AMAN' });

  // Load current user
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_role');
    if (token) {
      setCurrentUser({
        role: userData,
        email: localStorage.getItem('user_email') || 'superadmin@sipetasan.com',
        nama: 'Super Admin'
      });
    }
  }, []);

  // Load users & jadwals
  useEffect(() => {
    loadUsers();
    loadJadwals();
    loadTps();
  }, []);

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

  const token = localStorage.getItem('access_token');

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setPetugasList(data.filter(u => u.role === 'petugas' || u.role === 'admin'));
      }
    } catch (err) {
      console.error('Load users error:', err);
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

  const loadTps = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tps/`);
      if (response.ok) {
        const data = await response.json();
        setTpsList(data);
      }
    } catch (err) {
      console.error('Load TPS error:', err);
    }
  };

  const handleAddTps = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/tps/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTps)
      });
      if (!response.ok) throw new Error('Gagal menambah TPS');
      setSuccess('TPS berhasil ditambahkan');
      setNewTps({ nama: '', kecamatan: '', status: 'AMAN' });
      setShowAddTpsModal(false);
      loadTps();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTps = async (tpsId) => {
    if (!window.confirm('Yakin ingin menghapus TPS ini?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/tps/${tpsId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Gagal menghapus TPS');
      setSuccess('TPS berhasil dihapus');
      loadTps();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_lengkap: newUser.nama_lengkap,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          username: newUser.email.split('@')[0]
        })
      });
      if (!response.ok) throw new Error('Gagal menambah user');
      setSuccess('User berhasil ditambahkan');
      setNewUser({ nama_lengkap: '', email: '', password: '', role: 'petugas' });
      setShowAddUserModal(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal menghapus user');
      setSuccess('User berhasil dihapus');
      loadUsers();
    } catch (err) {
      setError(err.message);
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

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-logo-badge">
          <div className="admin-logo-icon">SA</div>
          <div>
            <div className="admin-brand-name">SI-PETASAN</div>
            <div className="admin-brand-tag">Superadmin Panel</div>
          </div>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-label">MENU UTAMA</div>
          <nav className="admin-nav-menu">
            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'pengguna' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pengguna')}
            >
              <span>Data Pengguna & Warga</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'petugas' ? 'active' : ''}`}
              onClick={() => setActiveMenu('petugas')}
            >
              <span>Kelola Petugas / Admin</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'tps' ? 'active' : ''}`}
              onClick={() => setActiveMenu('tps')}
            >
              <span>Kelola TPS</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'jadwal' ? 'active' : ''}`}
              onClick={() => setActiveMenu('jadwal')}
            >
              <span>Jadwal Pengambilan</span>
            </button>
          </nav>
        </div>

        {/* Bottom profile */}
        <div className="admin-bottom-profile">
          <div className="admin-profile-card">
            <div className="admin-profile-avatar">SA</div>
            <div>
              <div className="admin-profile-name">{currentUser?.nama || 'Superadmin'}</div>
              <div className="admin-profile-email">{currentUser?.email || 'superadmin@sipetasan.com'}</div>
            </div>
          </div>
          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            &larr; Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-top-header">
          <div>
            <h1 className="admin-page-title">
              {activeMenu === 'dashboard' && 'Dashboard Superadmin'}
              {activeMenu === 'pengguna' && 'Data Pengguna & Warga'}
              {activeMenu === 'petugas' && 'Kelola Petugas & Admin'}
              {activeMenu === 'tps' && 'Kelola TPS'}
              {activeMenu === 'jadwal' && 'Jadwal Pengambilan Sampah'}
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
                <div className="stat-card-number">{users.length}</div>
                <div className="stat-card-label">Total Pengguna Sistem</div>
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
                <h3 className="admin-card-title">Pengguna Terbaru</h3>
                <div className="recent-users-list">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="recent-user-item">
                      <div className="recent-user-avatar">{user.nama_lengkap?.charAt(0) || 'U'}</div>
                      <div className="recent-user-info">
                        <div className="recent-user-name">{user.nama_lengkap}</div>
                        <div className="recent-user-email">{user.email}</div>
                      </div>
                      <span className={`status-pill role-${user.role}`}>{user.role}</span>
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

        {/* PENGGUNA */}
        {activeMenu === 'pengguna' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Daftar Seluruh Pengguna</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.nama_lengkap}</strong></td>
                        <td className="text-muted">{u.email}</td>
                        <td><span className={`role-pill role-${u.role}`}>{u.role}</span></td>
                        <td><span className="status-pill status-aktif">Aktif</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PETUGAS & ADMIN CRUD */}
        {activeMenu === 'petugas' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Kelola Akun Petugas & Admin</h3>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={() => setShowAddUserModal(true)}
                >
                  + Tambah Akun
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petugasList.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.nama_lengkap}</strong></td>
                        <td className="text-muted">{p.email}</td>
                        <td><span className={`role-pill role-${p.role}`}>{p.role}</span></td>
                        <td>
                          <button
                            type="button"
                            className="btn-table-delete"
                            onClick={() => handleDeleteUser(p.id)}
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

        {/* TPS */}
        {activeMenu === 'tps' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Data TPS</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA TPS</th>
                      <th>KECAMATAN</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpsList.map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.nama}</strong></td>
                        <td>{t.kecamatan}</td>
                        <td><span className="status-pill status-aktif">{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* JADWAL CRUD */}
        {activeMenu === 'jadwal' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">CRUD Jadwal Pengambilan Sampah</h3>
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
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jadwals.map(j => (
                      <tr key={j.id}>
                        <td><strong>{j.hari}</strong></td>
                        <td>{j.area}</td>
                        <td>{j.waktu_mulai} - {j.waktu_selesai}</td>
                        <td>{j.petugas}</td>
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
      </main>

      {/* MODAL: Tambah User */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Akun Petugas / Admin</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddUserModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddUser} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="settings-input"
                  value={newUser.nama_lengkap}
                  onChange={(e) => setNewUser({ ...newUser, nama_lengkap: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email (@sipetasan.com)</label>
                <input
                  type="email"
                  required
                  className="settings-input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="settings-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="settings-input"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="petugas">Petugas</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-add-primary" disabled={isLoading}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Jadwal */}
      {showAddJadwalModal && (
        <div className="modal-overlay" onClick={() => setShowAddJadwalModal(false)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Jadwal Pengambilan</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddJadwalModal(false)}>&times;</button>
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
                <label className="form-label">Area / Zona</label>
                <input
                  type="text"
                  required
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
                  className="settings-input"
                  value={newJadwal.petugas}
                  onChange={(e) => setNewJadwal({ ...newJadwal, petugas: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddJadwalModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-add-primary" disabled={isLoading}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
