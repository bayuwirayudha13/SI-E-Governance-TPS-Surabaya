import React, { useState } from 'react';

export default function AdminPanel({ onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard' | 'pengguna' | 'petugas' | 'tps' | 'pengaturan'
  const [filterRole, setFilterRole] = useState('Semua'); // 'Semua' | 'Warga' | 'Petugas' | 'Menunggu'

  // Users initial state from mockups
  const [users, setUsers] = useState([
    { id: 1, name: 'Pak Jaka Susanto', email: 'jaka@sukamaju.id', role: 'Warga', noKK: '3578821234567890', joined: '12 Jan 2025', status: 'Aktif', avatar: 'P' },
    { id: 2, name: 'Ibu Sari Rahayu', email: 'sari@sukamaju.id', role: 'Warga', noKK: '3578821234567891', joined: '15 Jan 2025', status: 'Aktif', avatar: 'I' },
    { id: 3, name: 'Pak Dedi Kurnia', email: 'dedi@sukamaju.id', role: 'Warga', noKK: '3578821234567892', joined: '20 Feb 2025', status: 'Menunggu', avatar: 'P' },
    { id: 4, name: 'Budi Santoso', email: 'budi@kelurahan.go.id', role: 'Petugas', noKK: '—', joined: '01 Jan 2025', status: 'Aktif', avatar: 'B' },
    { id: 5, name: 'Ibu Wulan Sari', email: 'wulan@sukamaju.id', role: 'Warga', noKK: '3578821234567893', joined: '03 Mar 2025', status: 'Aktif', avatar: 'I' },
    { id: 6, name: 'Rizki Pratama', email: 'rizki@kelurahan.go.id', role: 'Petugas', noKK: '—', joined: '01 Jan 2025', status: 'Aktif', avatar: 'R' },
  ]);

  // Petugas state (Image 1)
  const [petugasList, setPetugasList] = useState([
    { id: 1, name: 'Budi Santoso', email: 'budi@kelurahan.go.id', joined: '01 Jan 2025', status: 'Aktif', avatar: 'B' },
    { id: 2, name: 'Rizki Pratama', email: 'rizki@kelurahan.go.id', joined: '01 Jan 2025', status: 'Aktif', avatar: 'R' }
  ]);

  // TPS state (Image 4)
  const [tpsList, setTpsList] = useState([
    { id: 'TPS-01', name: 'TPS Mawar', kapasitas: 68, status: 'AMAN', statusColor: 'green', coord: '40°S, 38°E' },
    { id: 'TPS-02', name: 'TPS Melati', kapasitas: 82, status: 'HAMPIR PENUH', statusColor: 'yellow', coord: '28°S, 82°E' },
    { id: 'TPS-03', name: 'TPS Kenanga', kapasitas: 94, status: 'OVERLOAD', statusColor: 'red', coord: '58°S, 54°E' },
    { id: 'TPS-04', name: 'TPS Flamboyan', kapasitas: 45, status: 'AMAN', statusColor: 'green', coord: '72°S, 30°E' },
    { id: 'TPS-05', name: 'TPS Cempaka', kapasitas: 77, status: 'HAMPIR PENUH', statusColor: 'yellow', coord: '60°S, 72°E' },
    { id: 'TPS-06', name: 'TPS Dahlia', kapasitas: 31, status: 'AMAN', statusColor: 'green', coord: '20°S, 20°E' }
  ]);

  // System settings state (Image 5)
  const [settings, setSettings] = useState({
    appName: 'SampahPintar',
    kelurahan: 'Kelurahan Sukamaju',
    emailAdmin: 'admin123@gmail.com',
    version: 'v2.4.1'
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Modal tambah petugas
  const [showAddPetugasModal, setShowAddPetugasModal] = useState(false);
  const [newPetugasName, setNewPetugasName] = useState('');
  const [newPetugasEmail, setNewPetugasEmail] = useState('');

  // Count pending users
  const pendingCount = users.filter(u => u.status === 'Menunggu').length;
  const wargaCount = users.filter(u => u.role === 'Warga').length;
  const activePetugasCount = petugasList.length;

  const handleApproveUser = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'Aktif' } : u));
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleDeletePetugas = (petugasId) => {
    if (window.confirm('Yakin ingin menghapus akun petugas ini?')) {
      setPetugasList(petugasList.filter(p => p.id !== petugasId));
    }
  };

  const handleAddPetugas = (e) => {
    e.preventDefault();
    if (!newPetugasName || !newPetugasEmail) return;
    const newEntry = {
      id: Date.now(),
      name: newPetugasName,
      email: newPetugasEmail,
      joined: '23 Sep 2026',
      status: 'Aktif',
      avatar: newPetugasName.charAt(0).toUpperCase()
    };
    setPetugasList([...petugasList, newEntry]);
    setUsers([...users, { ...newEntry, role: 'Petugas', noKK: '—' }]);
    setNewPetugasName('');
    setNewPetugasEmail('');
    setShowAddPetugasModal(false);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Filtered users for "Kelola Pengguna"
  const filteredUsers = users.filter(user => {
    if (filterRole === 'Semua') return true;
    if (filterRole === 'Warga') return user.role === 'Warga';
    if (filterRole === 'Petugas') return user.role === 'Petugas';
    if (filterRole === 'Menunggu') return user.status === 'Menunggu';
    return true;
  });

  return (
    <div className="admin-container">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="admin-sidebar">
        {/* Top Header Logo */}
        <div className="admin-logo-badge">
          <div className="admin-logo-icon">A</div>
          <div>
            <div className="admin-brand-name">SI-PETASAN</div>
            <div className="admin-brand-tag">Admin Panel</div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="admin-nav-section">
          <div className="admin-nav-label">MENU ADMIN</div>
          <nav className="admin-nav-menu">
            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard Admin</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'pengguna' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pengguna')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Kelola Pengguna</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'petugas' ? 'active' : ''}`}
              onClick={() => setActiveMenu('petugas')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>Akun Petugas</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'tps' ? 'active' : ''}`}
              onClick={() => setActiveMenu('tps')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>Kelola TPS</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'pengaturan' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pengaturan')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Pengaturan Sistem</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="admin-bottom-profile">
          <div className="admin-profile-card">
            <div className="admin-profile-avatar">A</div>
            <div>
              <div className="admin-profile-name">Admin</div>
              <div className="admin-profile-email">admin123@gmail.com</div>
            </div>
          </div>
          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            &larr; Keluar
          </button>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="admin-main">
        {/* Top Header Bar */}
        <header className="admin-top-header">
          <div>
            <h1 className="admin-page-title">
              {activeMenu === 'dashboard' && 'Dashboard Admin'}
              {activeMenu === 'pengguna' && 'Kelola Pengguna'}
              {activeMenu === 'petugas' && 'Akun Petugas'}
              {activeMenu === 'tps' && 'Kelola TPS'}
              {activeMenu === 'pengaturan' && 'Pengaturan Sistem'}
            </h1>
            <div className="admin-page-date">Rabu, 23 September 2026</div>
          </div>

          {/* Pending Approval Badge */}
          {pendingCount > 0 && (
            <div 
              className="admin-pending-badge"
              onClick={() => { setActiveMenu('pengguna'); setFilterRole('Menunggu'); }}
              style={{ cursor: 'pointer' }}
              title="Klik untuk meninjau pengguna"
            >
              <span className="pending-dot"></span>
              <span>{pendingCount} akun menunggu persetujuan</span>
            </div>
          )}
        </header>

        {/* VIEW 1: DASHBOARD ADMIN */}
        {activeMenu === 'dashboard' && (
          <div className="admin-content-view">
            {/* Top 4 Stat Cards */}
            <div className="admin-stats-row">
              <div className="admin-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap icon-blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <span className="stat-badge-live">LIVE</span>
                </div>
                <div className="stat-card-number">{users.length}</div>
                <div className="stat-card-label">Total Pengguna</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap icon-orange">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <span className="stat-badge-live">LIVE</span>
                </div>
                <div className="stat-card-number">{wargaCount}</div>
                <div className="stat-card-label">Warga Terdaftar</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap icon-gold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="7" r="4"></circle>
                      <path d="M6 21v-2a6 6 0 0 1 12 0v2"></path>
                    </svg>
                  </div>
                  <span className="stat-badge-live">LIVE</span>
                </div>
                <div className="stat-card-number">{activePetugasCount}</div>
                <div className="stat-card-label">Petugas Aktif</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap icon-sand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 22h14"></path>
                      <path d="M5 2h14"></path>
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                    </svg>
                  </div>
                  <span className="stat-badge-live">LIVE</span>
                </div>
                <div className="stat-card-number">{pendingCount}</div>
                <div className="stat-card-label">Menunggu Verifikasi</div>
              </div>
            </div>

            {/* Bottom 2 Columns Grid */}
            <div className="admin-dashboard-grid">
              {/* Left Box: Pendaftar Terbaru */}
              <div className="admin-card">
                <h3 className="admin-card-title">Pendaftar Terbaru</h3>
                <div className="recent-users-list">
                  {users.slice(0, 4).map(user => (
                    <div key={user.id} className="recent-user-item">
                      <div className="recent-user-avatar">{user.avatar}</div>
                      <div className="recent-user-info">
                        <div className="recent-user-name">{user.name}</div>
                        <div className="recent-user-email">{user.email}</div>
                      </div>
                      <span className={`status-pill ${user.status === 'Aktif' ? 'status-aktif' : 'status-menunggu'}`}>
                        {user.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Box: Status TPS Real-time */}
              <div className="admin-card">
                <h3 className="admin-card-title">Status TPS Real-time</h3>
                <div className="tps-realtime-list">
                  {tpsList.map(tps => (
                    <div key={tps.id} className="tps-realtime-row">
                      <div className="tps-name-col">
                        <span className={`status-dot-sm ${tps.statusColor}`}></span>
                        <span>{tps.name}</span>
                      </div>
                      <div className="tps-bar-col">
                        <div className="tps-progress-bg">
                          <div 
                            className={`tps-progress-fill fill-${tps.statusColor}`} 
                            style={{ width: `${tps.kapasitas}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className={`tps-percent-col text-${tps.statusColor}`}>
                        {tps.kapasitas}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: KELOLA PENGGUNA */}
        {activeMenu === 'pengguna' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Daftar Pengguna</h3>
                {/* Filter Pills */}
                <div className="filter-pill-group">
                  {['Semua', 'Warga', 'Petugas', 'Menunggu'].map(f => (
                    <button
                      key={f}
                      type="button"
                      className={`filter-btn ${filterRole === f ? 'active' : ''}`}
                      onClick={() => setFilterRole(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>NO. KK</th>
                      <th>BERGABUNG</th>
                      <th>STATUS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="table-avatar">{user.avatar}</span>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{user.email}</td>
                        <td>
                          <span className={`role-pill role-${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="text-mono">{user.noKK}</td>
                        <td className="text-muted">{user.joined}</td>
                        <td>
                          <span className={`status-pill ${user.status === 'Aktif' ? 'status-aktif' : 'status-menunggu'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            {user.status === 'Menunggu' && (
                              <button
                                type="button"
                                className="btn-table-approve"
                                onClick={() => handleApproveUser(user.id)}
                              >
                                &check; Setujui
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-table-delete"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              &times; Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: AKUN PETUGAS */}
        {activeMenu === 'petugas' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Manajemen Akun Petugas</h3>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={() => setShowAddPetugasModal(true)}
                >
                  + Tambah Petugas
                </button>
              </div>

              {/* Petugas Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>BERGABUNG</th>
                      <th>STATUS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petugasList.map(petugas => (
                      <tr key={petugas.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="table-avatar">{petugas.avatar}</span>
                            <span>{petugas.name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{petugas.email}</td>
                        <td className="text-muted">{petugas.joined}</td>
                        <td>
                          <span className="status-pill status-aktif">
                            {petugas.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-table-delete"
                            onClick={() => handleDeletePetugas(petugas.id)}
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

        {/* VIEW 4: KELOLA TPS */}
        {activeMenu === 'tps' && (
          <div className="admin-content-view">
            <div className="tps-cards-grid">
              {tpsList.map(tps => (
                <div key={tps.id} className="tps-management-card">
                  <div className="tps-card-top">
                    <span className="tps-code">{tps.id}</span>
                    <span className={`tps-badge-status status-badge-${tps.statusColor}`}>
                      {tps.status}
                    </span>
                  </div>
                  <h4 className="tps-card-name">{tps.name}</h4>
                  
                  {/* Progress bar */}
                  <div className="tps-card-progress">
                    <div className="tps-progress-bg">
                      <div 
                        className={`tps-progress-fill fill-${tps.statusColor}`}
                        style={{ width: `${tps.kapasitas}%` }}
                      ></div>
                    </div>
                    <div className="tps-card-numbers">
                      <span>Kapasitas terisi</span>
                      <strong className={`text-${tps.statusColor}`}>{tps.kapasitas}%</strong>
                    </div>
                  </div>

                  <div className="tps-card-coord">
                    Koordinat: {tps.coord}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: PENGATURAN SISTEM */}
        {activeMenu === 'pengaturan' && (
          <div className="admin-content-view">
            <div className="admin-card settings-card">
              {settingsSaved && (
                <div className="settings-alert-success">
                  &check; Perubahan pengaturan sistem berhasil disimpan!
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="admin-settings-form">
                <div className="settings-field">
                  <label className="settings-label">Nama Aplikasi</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.appName}
                    onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Nama Kelurahan</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.kelurahan}
                    onChange={(e) => setSettings({ ...settings, kelurahan: e.target.value })}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Email Admin</label>
                  <input
                    type="email"
                    className="settings-input"
                    value={settings.emailAdmin}
                    onChange={(e) => setSettings({ ...settings, emailAdmin: e.target.value })}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Versi Sistem</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.version}
                    onChange={(e) => setSettings({ ...settings, version: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button type="submit" className="btn-save-settings">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Tambah Petugas */}
      {showAddPetugasModal && (
        <div className="modal-overlay" onClick={() => setShowAddPetugasModal(false)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ffffff' }}>Tambah Akun Petugas</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddPetugasModal(false)}
                style={{ background: '#1b2942', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddPetugas} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Nama Lengkap Petugas</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Agus Hermanto"
                  className="settings-input"
                  value={newPetugasName}
                  onChange={(e) => setNewPetugasName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Email Petugas (Kelurahan / DLH)</label>
                <input
                  type="email"
                  required
                  placeholder="agus@kelurahan.go.id"
                  className="settings-input"
                  value={newPetugasEmail}
                  onChange={(e) => setNewPetugasEmail(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddPetugasModal(false)}
                  style={{ padding: '10px 18px', background: '#1b2942', color: '#cbd5e1', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                >
                  Simpan Petugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
