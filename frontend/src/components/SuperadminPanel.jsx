import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SuperadminPanel({ onLogout, currentUser: userFromProp }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(userFromProp);
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

  // Form states — dropdown kecamatan/kelurahan seperti register warga
  const KEC_DEFAULT = [
    'Asemrowo','Benowo','Bubutan','Bulak','Dukuh Pakis','Gayungan','Genteng','Gubeng','Gunung Anyar','Jambangan','Karang Pilang','Kenjeran','Krembangan','Lakarsantri','Mulyorejo','Pabean Cantian','Pakal','Rungkut','Sambikerep','Sawahan','Semampir','Simokerto','Sukolilo','Sukomanunggal','Tambaksari','Tandes','Tegalsari','Tenggilis Mejoyo','Wiyung','Wonocolo','Wonokromo'
  ];
  const [newUser, setNewUser] = useState({ nama_lengkap: '', email: '', password: '', role: 'petugas', wilayah_kecamatan: '', wilayah_kelurahan: '', foto_url: '' });
  const [editUser, setEditUser] = useState(null); // {id, ...} saat klik Edit (hijau) / View (merah)
  const [viewUser, setViewUser] = useState(null);
  const [kecamatanOptions, setKecamatanOptions] = useState(KEC_DEFAULT);
  const [kelurahanOptions, setKelurahanOptions] = useState([]);
  const [newUserFotoFile, setNewUserFotoFile] = useState(null);
  const [newUserFotoPreview, setNewUserFotoPreview] = useState('');
  const [editFotoFile, setEditFotoFile] = useState(null);
  const [editFotoPreview, setEditFotoPreview] = useState('');
  const [newJadwal, setNewJadwal] = useState({ hari: '', waktu_mulai: '', waktu_selesai: '', area: '', petugas: '', tipe: 'Rutin' });
  const [newTps, setNewTps] = useState({
    nama: '',
    kecamatan: '',
    wilayah_kota: 'Surabaya Pusat',
    lokasi: '',
    jenis_tps: 'TPS Resmi',
    latitude: '',
    longitude: '',
    jumlah_container: '',
    daya_tampung_m3: '',
    status: 'Aktif'
  });
  const [editingTpsId, setEditingTpsId] = useState(null);
  const [settings, setSettings] = useState({ website_name: 'SI-PETASAN', website_email: 'admin@sipetasan.com', current_password: '', new_password: '' });

  // Load current user
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
          email: sessionStorage.getItem('user_email') || 'superadmin@sipetasan.com',
          nama_lengkap: 'Super Admin'
        });
      }
    }
  }, []);

  // Load users & jadwals + kecamatan dari backend (dropdown seperti register warga)
  useEffect(() => {
    loadUsers();
    loadJadwals();
    loadTps();
    loadSettings();
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/wilayah/kecamatan`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d) && d.length) setKecamatanOptions(d.map(x => x.nama || x));
        }
      } catch {}
    })();
  }, []);

  // load kelurahan saat kecamatan newUser / editUser berubah (dropdown tingkat 2)
  useEffect(() => {
    const kec = editUser ? editUser.wilayah_kecamatan : newUser.wilayah_kecamatan;
    if (!kec) { setKelurahanOptions([]); return; }
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/wilayah/kelurahan?kecamatan=${encodeURIComponent(kec)}`);
        if (r.ok) { const d = await r.json(); setKelurahanOptions((d||[]).map(x=>x.nama||x)); }
      } catch { setKelurahanOptions([]); }
    })();
  }, [newUser.wilayah_kecamatan, editUser?.wilayah_kecamatan]);

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

  const getToken = () => sessionStorage.getItem('access_token');

  const loadUsers = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setPetugasList(data.filter(u => u.role === 'petugas' || u.role === 'admin' || u.role === 'superadmin' || u.role === 'driver'));
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
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/tps/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setTpsList(data);
      } else {
        const txt = await response.text();
        console.error('Load TPS failed:', response.status, txt);
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
      const token = getToken();
      if (!token) throw new Error('Token tidak ditemukan, login ulang sebagai superadmin');
      
      const payload = {
        ...newTps,
        latitude: newTps.latitude ? parseFloat(newTps.latitude) : null,
        longitude: newTps.longitude ? parseFloat(newTps.longitude) : null,
        daya_tampung_m3: newTps.daya_tampung_m3 ? parseFloat(newTps.daya_tampung_m3) : null
      };

      const url = editingTpsId ? `${API_BASE}/api/tps/${editingTpsId}` : `${API_BASE}/api/tps/`;
      const method = editingTpsId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      let resText = await response.text();
      if (!response.ok) {
        let msg = resText;
        try { const j = JSON.parse(resText); msg = j.detail || resText; } catch {}
        throw new Error(msg || (editingTpsId ? 'Gagal mengupdate TPS' : 'Gagal menambah TPS'));
      }
      setSuccess(editingTpsId ? 'TPS berhasil diupdate' : 'TPS berhasil ditambahkan');
      setNewTps({
        nama: '',
        kecamatan: '',
        wilayah_kota: 'Surabaya Pusat',
        lokasi: '',
        jenis_tps: 'TPS Resmi',
        latitude: '',
        longitude: '',
        jumlah_container: '',
        daya_tampung_m3: '',
        status: 'Aktif'
      });
      setEditingTpsId(null);
      setShowAddTpsModal(false);
      loadTps();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTps = (tps) => {
    setEditingTpsId(tps.id);
    setNewTps({
      nama: tps.nama || '',
      kecamatan: tps.kecamatan || '',
      wilayah_kota: tps.wilayah_kota || 'Surabaya Pusat',
      lokasi: tps.lokasi || '',
      jenis_tps: tps.jenis_tps || 'TPS Resmi',
      latitude: tps.latitude !== null && tps.latitude !== undefined ? tps.latitude : '',
      longitude: tps.longitude !== null && tps.longitude !== undefined ? tps.longitude : '',
      jumlah_container: tps.jumlah_container || '',
      daya_tampung_m3: tps.daya_tampung_m3 !== null && tps.daya_tampung_m3 !== undefined ? tps.daya_tampung_m3 : '',
      status: tps.status || 'Aktif'
    });
    setShowAddTpsModal(true);
  };

  const handleDeleteTps = async (tpsId) => {
    if (!window.confirm('Yakin ingin menghapus TPS ini?')) return;
    setError('');
    setSuccess('');
    try {
      const token = getToken();
      if (!token) throw new Error('Token tidak ditemukan, login ulang sebagai superadmin');
      const response = await fetch(`${API_BASE}/api/tps/${tpsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let body = '';
      try { body = await response.text(); } catch {}
      if (!response.ok) {
        let msg = body;
        try { const j = JSON.parse(body); msg = j.detail || body; } catch {}
        throw new Error(msg || `Gagal menghapus TPS (${response.status})`);
      }
      setSuccess('TPS berhasil dihapus');
      loadTps();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Gagal terhubung ke server (http://localhost:8000). Pastikan backend nyala.');
      } else {
        setError(err.message);
      }
    }
  };

  const uploadPetugasFoto = async (userId, file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append('foto', file);
    const r = await fetch(`${API_BASE}/api/admin/users/${userId}/foto`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: fd
    });
    if (!r.ok) throw new Error((await r.text()) || 'Gagal upload foto');
    const j = await r.json();
    return j.foto_url;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const token = getToken();
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
          username: newUser.email.split('@')[0],
          wilayah_kecamatan: newUser.wilayah_kecamatan || null,
          wilayah_kelurahan: newUser.wilayah_kelurahan || null,
          wilayah_kota: 'Surabaya',
        })
      });
      let txt = await response.text();
      if (!response.ok) {
        let msg = txt; try { msg = JSON.parse(txt).detail || txt; } catch {}
        throw new Error(msg || 'Gagal menambah user');
      }
      let created = null; try { created = JSON.parse(txt); } catch {}
      const uid = created?.id;
      if (uid && newUserFotoFile) {
        try { await uploadPetugasFoto(uid, newUserFotoFile); } catch (fe) { console.warn(fe); }
      }
      setSuccess('User berhasil ditambahkan');
      setNewUser({ nama_lengkap: '', email: '', password: '', role: 'petugas', wilayah_kecamatan: '', wilayah_kelurahan: '', foto_url: '' });
      setNewUserFotoFile(null); setNewUserFotoPreview('');
      setShowAddUserModal(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditUser = (u) => {
    setEditUser({ id: u.id, nama_lengkap: u.nama_lengkap, email: u.email, role: u.role, wilayah_kecamatan: u.wilayah_kecamatan || '', wilayah_kelurahan: u.wilayah_kelurahan || '', foto_url: u.foto_url || '' });
    setEditFotoFile(null); setEditFotoPreview(u.foto_url ? `${API_BASE}${u.foto_url}` : '');
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setIsLoading(true); setError('');
    try {
      const token = getToken();
      // upload foto dulu jika ada file baru
      let fotoUrl = editUser.foto_url;
      if (editFotoFile) fotoUrl = await uploadPetugasFoto(editUser.id, editFotoFile);
      const r = await fetch(`${API_BASE}/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nama_lengkap: editUser.nama_lengkap, role: editUser.role, wilayah_kecamatan: editUser.wilayah_kecamatan || '', wilayah_kelurahan: editUser.wilayah_kelurahan || '', wilayah_kota: 'Surabaya', foto_url: fotoUrl })
      });
      let txt = await r.text();
      if (!r.ok) { let m=txt; try{m=JSON.parse(txt).detail||txt;}catch{} throw new Error(m); }
      setSuccess('Petugas berhasil diperbarui');
      setEditUser(null); setEditFotoFile(null); setEditFotoPreview('');
      loadUsers();
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };
  const openViewUser = async (u) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${u.id}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (r.ok) setViewUser(await r.json()); else setViewUser(u);
    } catch { setViewUser(u); }
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
      const token = getToken();
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

  const loadSettings = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({ 
          website_name: data.website_name, 
          website_email: data.website_email,
          current_password: '',
          new_password: ''
        });
      }
    } catch (err) {
      console.error('Load settings error:', err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const token = getToken();
      const updateData = {
        website_name: settings.website_name,
        website_email: settings.website_email
      };
      if (settings.new_password) {
        if (!settings.current_password) {
          throw new Error('Password saat ini wajib diisi untuk mengganti password');
        }
        updateData.current_password = settings.current_password;
        updateData.new_password = settings.new_password;
      }
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal mengupdate pengaturan');
      }
      setSuccess('Pengaturan berhasil diperbarui');
      setSettings({ ...settings, current_password: '', new_password: '' });
      loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-logo-badge">
          <div className="admin-logo-left">
            <div className="admin-logo-icon" title="SI-PETASAN">SA</div>
            {!isSidebarCollapsed && (
              <div className="admin-brand-info">
                <div className="admin-brand-name">SI-PETASAN</div>
                <div className="admin-brand-tag">Superadmin Panel</div>
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
          {!isSidebarCollapsed && <div className="admin-nav-label">MENU UTAMA</div>}
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
              className={`admin-nav-item ${activeMenu === 'pengguna' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pengguna')}
              title="Data Pengguna & Warga"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {!isSidebarCollapsed && <span>Data Pengguna & Warga</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'petugas' ? 'active' : ''}`}
              onClick={() => setActiveMenu('petugas')}
              title="Kelola Petugas / Admin"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <polyline points="16 11 18 13 22 9"/>
              </svg>
              {!isSidebarCollapsed && <span>Kelola Petugas / Admin</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === 'tps' ? 'active' : ''}`}
              onClick={() => setActiveMenu('tps')}
              title="Kelola TPS"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {!isSidebarCollapsed && <span>Kelola TPS</span>}
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
              className={`admin-nav-item ${activeMenu === 'pengaturan' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pengaturan')}
              title="Pengaturan"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              {!isSidebarCollapsed && <span>Pengaturan</span>}
            </button>
          </nav>
        </div>

        {/* Bottom profile */}
        <div className="admin-bottom-profile">
          <div className="admin-profile-card" title={`${currentUser?.nama_lengkap || currentUser?.nama || 'Superadmin'} (${currentUser?.role || 'Super Admin'})`}>
            <div className="admin-profile-avatar">
              {(currentUser?.nama_lengkap || currentUser?.nama || 'SA').charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-profile-info">
                <div className="admin-profile-name">{currentUser?.nama_lengkap || currentUser?.nama || 'Superadmin'}</div>
                <div className="admin-profile-role" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                  {currentUser?.role || 'Super Admin'}
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
              {activeMenu === 'dashboard' && 'Dashboard Superadmin'}
              {activeMenu === 'pengguna' && 'Data Pengguna & Warga'}
              {activeMenu === 'petugas' && 'Kelola Petugas & Admin'}
              {activeMenu === 'tps' && 'Kelola TPS'}
              {activeMenu === 'jadwal' && 'Jadwal Pengambilan Sampah'}
              {activeMenu === 'pengaturan' && 'Pengaturan Website'}
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
                      <th>FOTO</th>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>WILAYAH TUGAS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petugasList.map(p => (
                      <tr key={p.id}>
                        <td>{p.foto_url ? <img src={`${API_BASE}${p.foto_url}`} alt={p.nama_lengkap} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'1px solid #e2e8f0'}} /> : <span style={{width:36,height:36,borderRadius:'50%',background:'#e2e8f0',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,color:'#64748b'}}>{p.nama_lengkap?.charAt(0)?.toUpperCase()||'P'}</span>}</td>
                        <td><strong>{p.nama_lengkap}</strong></td>
                        <td className="text-muted">{p.email}</td>
                        <td><span className={`role-pill role-${p.role}`}>{p.role}</span></td>
                        <td className="text-muted" style={{fontSize:'0.82rem'}}>{[p.wilayah_kecamatan,p.wilayah_kelurahan].filter(Boolean).join(' — ') || <span style={{color:'#94a3b8'}}>Belum diatur</span>}</td>
                        <td>
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            <button type="button" title="Lihat (merah)" onClick={() => openViewUser(p)} style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid #fecaca',background:'#fef2f2',color:'#b91c1c',cursor:'pointer',fontWeight:600,fontSize:'0.78rem'}}>👁 View</button>
                            <button type="button" title="Edit (hijau)" onClick={() => openEditUser(p)} style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid #bbf7d0',background:'#f0fdf4',color:'#166534',cursor:'pointer',fontWeight:600,fontSize:'0.78rem'}}>✎ Edit</button>
                            <button type="button" className="btn-table-delete" onClick={() => handleDeleteUser(p.id)}>× Hapus</button>
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

        {/* TPS CRUD */}
        {activeMenu === 'tps' && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Kelola Data TPS</h3>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={() => {
                    setEditingTpsId(null);
                    setNewTps({ nama: '', kecamatan: '', wilayah_kota: 'Surabaya Pusat', lokasi: '', jenis_tps: 'TPS Resmi', latitude: '', longitude: '', jumlah_container: '', daya_tampung_m3: '', status: 'Aktif' });
                    setShowAddTpsModal(true);
                  }}
                >
                  + Tambah TPS
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA TPS</th>
                      <th>KECAMATAN</th>
                      <th>WILAYAH</th>
                      <th>LOKASI</th>
                      <th>LAT/LNG</th>
                      <th>CONTAINER</th>
                      <th>DAYA (m³)</th>
                      <th>STATUS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpsList.map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.nama}</strong></td>
                        <td>{t.kecamatan}</td>
                        <td>{t.wilayah_kota}</td>
                        <td className="text-muted">{t.lokasi || '—'}</td>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>{t.latitude && t.longitude ? `${t.latitude}, ${t.longitude}` : '—'}</td>
                        <td>{t.jumlah_container || '—'}</td>
                        <td>{t.daya_tampung_m3 ?? '—'}</td>
                        <td><span className={`status-pill ${t.status === 'Aktif' ? 'status-aktif' : ''}`}>{t.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn-table-edit"
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => handleEditTps(t)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-table-delete"
                              onClick={() => handleDeleteTps(t.id)}
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

        {/* PENGATURAN */}
        {activeMenu === 'pengaturan' && (
          <div className="admin-content-view">
            <div className="admin-card">
              <h3 className="admin-card-title">Pengaturan Website</h3>
              <form onSubmit={handleUpdateSettings} style={{ marginTop: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Website</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.website_name}
                    onChange={(e) => setSettings({ ...settings, website_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Website</label>
                  <input
                    type="email"
                    className="settings-input"
                    value={settings.website_email}
                    onChange={(e) => setSettings({ ...settings, website_email: e.target.value })}
                  />
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>Ganti Password Superadmin</h4>

                  <div className="form-group">
                    <label className="form-label">Password Saat Ini</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="Masukkan password saat ini"
                      value={settings.current_password}
                      onChange={(e) => setSettings({ ...settings, current_password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password Baru</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="Masukkan password baru (kosongkan jika tidak ingin mengubah)"
                      value={settings.new_password}
                      onChange={(e) => setSettings({ ...settings, new_password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="submit"
                    className="btn-add-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Tambah User + foto + dropdown kecamatan/kelurahan seperti register warga */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Akun Petugas / Admin</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddUserModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddUser} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Foto Petugas</label>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  {newUserFotoPreview ? <img src={newUserFotoPreview} alt="preview" style={{width:56,height:56,borderRadius:'50%',objectFit:'cover'}} /> : <span style={{width:56,height:56,borderRadius:'50%',background:'#e2e8f0',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'#64748b',fontWeight:700}}>📷</span>}
                  <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(!f)return; setNewUserFotoFile(f); setNewUserFotoPreview(URL.createObjectURL(f));}} />
                </div>
              </div>
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
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value, wilayah_kecamatan: '', wilayah_kelurahan: '' })}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="petugas">Petugas</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              {(newUser.role === 'petugas' || newUser.role === 'driver') && (
              <>
              <div className="form-group">
                <label className="form-label">Kecamatan Tugas</label>
                <select className="settings-input" value={newUser.wilayah_kecamatan} onChange={(e)=>setNewUser({...newUser, wilayah_kecamatan:e.target.value, wilayah_kelurahan:''})}>
                  <option value="">— Pilih Kecamatan —</option>
                  {kecamatanOptions.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kelurahan Tugas</label>
                <select className="settings-input" value={newUser.wilayah_kelurahan} onChange={(e)=>setNewUser({...newUser, wilayah_kelurahan:e.target.value})}>
                  <option value="">— Pilih Kelurahan —</option>
                  {kelurahanOptions.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-add-primary" disabled={isLoading}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL Edit (hijau): form sama kayak tambah + ganti foto + dropdown wilayah */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Petugas / Admin</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditUser(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateUser} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Foto Petugas</label>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  {editFotoPreview ? <img src={editFotoPreview} alt="preview" style={{width:56,height:56,borderRadius:'50%',objectFit:'cover'}} /> : <span style={{width:56,height:56,borderRadius:'50%',background:'#e2e8f0',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'#64748b',fontWeight:700}}>📷</span>}
                  <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(!f)return; setEditFotoFile(f); setEditFotoPreview(URL.createObjectURL(f));}} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input type="text" required className="settings-input" value={editUser.nama_lengkap} onChange={(e)=>setEditUser({...editUser, nama_lengkap:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" disabled className="settings-input" value={editUser.email} style={{opacity:.6}} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="settings-input" value={editUser.role} onChange={(e)=>setEditUser({...editUser, role:e.target.value, wilayah_kecamatan: '', wilayah_kelurahan: ''})}>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="petugas">Petugas</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              {(editUser.role === 'petugas' || editUser.role === 'driver') && (
              <>
              <div className="form-group">
                <label className="form-label">Kecamatan Tugas</label>
                <select className="settings-input" value={editUser.wilayah_kecamatan} onChange={(e)=>setEditUser({...editUser, wilayah_kecamatan:e.target.value, wilayah_kelurahan:''})}>
                  <option value="">— Pilih Kecamatan —</option>
                  {kecamatanOptions.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kelurahan Tugas</label>
                <select className="settings-input" value={editUser.wilayah_kelurahan} onChange={(e)=>setEditUser({...editUser, wilayah_kelurahan:e.target.value})}>
                  <option value="">— Pilih Kelurahan —</option>
                  {kelurahanOptions.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setEditUser(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-add-primary" disabled={isLoading}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL View (merah): lihat data + foto */}
      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detail Petugas</h3>
              <button type="button" className="modal-close-btn" onClick={() => setViewUser(null)}>&times;</button>
            </div>
            <div style={{ padding: '24px', display:'flex', gap:'16px' }}>
              {viewUser.foto_url ? <img src={`${API_BASE}${viewUser.foto_url}`} alt={viewUser.nama_lengkap} style={{width:96,height:96,borderRadius:'12px',objectFit:'cover',border:'1px solid #e2e8f0'}} /> : <span style={{width:96,height:96,borderRadius:'12px',background:'#e2e8f0',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',fontWeight:800,color:'#64748b'}}>{viewUser.nama_lengkap?.charAt(0)?.toUpperCase()}</span>}
              <div style={{fontSize:'0.88rem',lineHeight:1.7}}>
                <div><b>Nama:</b> {viewUser.nama_lengkap}</div>
                <div><b>Email:</b> {viewUser.email}</div>
                <div><b>Role:</b> {viewUser.role}</div>
                <div><b>Tugas:</b> {[viewUser.wilayah_kecamatan,viewUser.wilayah_kelurahan].filter(Boolean).join(' — ') || 'Belum diatur'}</div>
                <div><b>Status:</b> {viewUser.is_active ? 'Aktif' : 'Nonaktif'}</div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',padding:'0 24px 24px'}}>
              <button type="button" onClick={() => { setViewUser(null); openEditUser(viewUser); }} style={{padding:'8px 16px',borderRadius:'6px',border:'none',background:'#166534',color:'#fff',cursor:'pointer',fontWeight:700}}>Edit</button>
            </div>
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

      {/* MODAL: Tambah / Edit TPS */}
      {showAddTpsModal && (
        <div className="modal-overlay" onClick={() => { setShowAddTpsModal(false); setEditingTpsId(null); }}>
          <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTpsId ? 'Edit TPS' : 'Tambah TPS Baru'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => { setShowAddTpsModal(false); setEditingTpsId(null); }}>&times;</button>
            </div>
            <form onSubmit={handleAddTps} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Nama TPS *</label>
                <input
                  type="text"
                  required
                  placeholder="TPS Keputih"
                  className="settings-input"
                  value={newTps.nama}
                  onChange={(e) => setNewTps({ ...newTps, nama: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kecamatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Sukolilo"
                  className="settings-input"
                  value={newTps.kecamatan}
                  onChange={(e) => setNewTps({ ...newTps, kecamatan: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wilayah Kota *</label>
                <select
                  required
                  className="settings-input"
                  value={newTps.wilayah_kota}
                  onChange={(e) => setNewTps({ ...newTps, wilayah_kota: e.target.value })}
                >
                  <option value="Surabaya Pusat">Surabaya Pusat</option>
                  <option value="Surabaya Utara">Surabaya Utara</option>
                  <option value="Surabaya Selatan">Surabaya Selatan</option>
                  <option value="Surabaya Barat">Surabaya Barat</option>
                  <option value="Surabaya Timur">Surabaya Timur</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi / Alamat</label>
                <input
                  type="text"
                  placeholder="Jl. Keputih No. 10"
                  className="settings-input"
                  value={newTps.lokasi}
                  onChange={(e) => setNewTps({ ...newTps, lokasi: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis TPS</label>
                <select
                  className="settings-input"
                  value={newTps.jenis_tps}
                  onChange={(e) => setNewTps({ ...newTps, jenis_tps: e.target.value })}
                >
                  <option value="TPS Resmi">TPS Resmi</option>
                  <option value="TPS Liar">TPS Liar</option>
                  <option value="TPS Sementara">TPS Sementara</option>
                  <option value="Depo">Depo</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-7.2575"
                    className="settings-input"
                    value={newTps.latitude}
                    onChange={(e) => setNewTps({ ...newTps, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="112.7521"
                    className="settings-input"
                    value={newTps.longitude}
                    onChange={(e) => setNewTps({ ...newTps, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Jumlah Container</label>
                  <input
                    type="text"
                    placeholder="2 (contoh: 50)"
                    className="settings-input"
                    value={newTps.jumlah_container}
                    onChange={(e) => setNewTps({ ...newTps, jumlah_container: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Daya Tampung (m³)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="28.00"
                    className="settings-input"
                    value={newTps.daya_tampung_m3}
                    onChange={(e) => setNewTps({ ...newTps, daya_tampung_m3: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="settings-input"
                  value={newTps.status}
                  onChange={(e) => setNewTps({ ...newTps, status: e.target.value })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowAddTpsModal(false); setEditingTpsId(null); }} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-add-primary" disabled={isLoading}>{isLoading ? 'Menyimpan...' : (editingTpsId ? 'Update' : 'Simpan')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
