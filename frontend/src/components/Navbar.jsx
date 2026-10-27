import React, { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tentang', label: 'Tentang kami' },
  { id: 'fitur', label: 'Fitur' },
  { id: 'berita', label: 'Berita & Artikel' },
  { id: 'jenis-sampah', label: 'Jenis Sampah' },
];

export default function Navbar({
  onOpenLoginModal,
  onOpenTpsModal,
  onOpenRewardModal,
  currentUser,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // ScrollSpy: auto-detect which section is currently on screen
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      const sectionIds = ['beranda', 'tentang', 'fitur', 'berita', 'jenis-sampah'];

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top - 20) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, sectionId) => {
    if (e && e.preventDefault) e.preventDefault();
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    const el = document.getElementById(sectionId);
    if (el) {
      const navOffset = 90;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      window.history.pushState(null, '', `#${sectionId}`);
    } else {
      window.location.hash = `#${sectionId}`;
    }
  };

  const handleRolePortalClick = (roleHash) => {
    setMobileMenuOpen(false);
    window.location.hash = roleHash;
  };

  return (
    <>
      <header className="site-header">
        <div className="nav-container">
          {/* Left area: Hamburger Button (mobile only) + Brand Logo */}
          <div className="nav-left-group">
            <button
              type="button"
              className="mobile-hamburger-btn"
              aria-label="Buka navigasi menu"
              onClick={() => setMobileMenuOpen(true)}
              title="Menu Navigasi"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Brand Logo with SBY badge (YouTube style) */}
            <a
              href="#beranda"
              className="brand-logo"
              id="brand-logo"
              onClick={(e) => handleNavClick(e, 'beranda')}
            >
              <div className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93A10 10 0 0 0 12 2z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="brand-text-wrap">
                <span className="brand-title">SI-Petasan</span>
                <span className="brand-badge-country" title="Kota Surabaya">SBY</span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links (hidden on mobile) */}
          <nav className="desktop-nav">
            <ul className="nav-links">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="nav-actions">
            {/* Quick Search TPS Icon Button (YouTube style search) */}
            <button
              type="button"
              className="mobile-search-btn"
              onClick={() => onOpenTpsModal && onOpenTpsModal()}
              title="Cari TPS Terdekat"
              aria-label="Cari Titik TPS"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {currentUser ? (
              <button
                type="button"
                className="btn-user-avatar-mobile"
                onClick={() => {
                  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') window.location.hash = '#admin';
                  else if (currentUser.role === 'driver') window.location.hash = '#driver';
                  else if (currentUser.role === 'petugas') window.location.hash = '#petugas';
                  else window.location.hash = '#warga';
                }}
                title={currentUser.nama_lengkap || currentUser.nama || 'Profil Akun'}
              >
                <div className="user-avatar-circle">
                  {(currentUser.nama_lengkap || currentUser.nama || currentUser.email || 'A').charAt(0).toUpperCase()}
                </div>
                <span className="user-desktop-text">
                  {currentUser.role === 'admin' || currentUser.role === 'superadmin'
                    ? 'Admin Panel'
                    : currentUser.role === 'driver'
                    ? 'Portal Driver'
                    : currentUser.role === 'petugas'
                    ? 'Petugas TPS'
                    : 'Portal Warga'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="user-desktop-arrow">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="btn-pill-dark nav-btn-login"
                onClick={onOpenLoginModal}
                id="nav-signin-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* YouTube-style Horizontal Pill Chips Bar (Mobile Category Scroll) */}
        <div className="mobile-chip-bar" aria-label="Kategori navigasi cepat">
          <div className="chip-scroll-track">
            <button
              type="button"
              className={`mobile-filter-chip ${activeSection === 'beranda' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'beranda')}
            >
              Semua
            </button>
            <button
              type="button"
              className="mobile-filter-chip"
              onClick={() => onOpenTpsModal && onOpenTpsModal()}
            >
              📍 Peta TPS
            </button>
            <button
              type="button"
              className={`mobile-filter-chip ${activeSection === 'tentang' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'tentang')}
            >
              🌿 Tentang
            </button>
            <button
              type="button"
              className={`mobile-filter-chip ${activeSection === 'fitur' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'fitur')}
            >
              ⚡ Fitur
            </button>
            <button
              type="button"
              className={`mobile-filter-chip ${activeSection === 'berita' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'berita')}
            >
              📰 Berita
            </button>
            <button
              type="button"
              className={`mobile-filter-chip ${activeSection === 'jenis-sampah' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'jenis-sampah')}
            >
              ♻️ Jenis Sampah
            </button>
            <button
              type="button"
              className="mobile-filter-chip"
              onClick={() => onOpenRewardModal && onOpenRewardModal()}
            >
              🎁 Reward
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop Overlay for Left Drawer */}
      <div
        className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* YouTube-style Slide-over Left Drawer Menu */}
      <aside
        className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-label="Sidebar Menu Mobile"
      >
        {/* Drawer Header with Hamburger close & Logo */}
        <div className="drawer-header">
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <a
            href="#beranda"
            className="brand-logo drawer-brand-logo"
            onClick={(e) => handleNavClick(e, 'beranda')}
          >
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93A10 10 0 0 0 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">SI-Petasan</span>
              <span className="brand-badge-country">SBY</span>
            </div>
          </a>
        </div>

        {/* Drawer Scrollable Body (Structured like YouTube Image 2) */}
        <div className="drawer-content-scroll">
          {/* Section 1: Main Landing Navigation */}
          <nav className="drawer-section">
            <button
              type="button"
              className={`drawer-item ${activeSection === 'beranda' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'beranda')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill={activeSection === 'beranda' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </span>
              <span className="drawer-label">Beranda</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenTpsModal) onOpenTpsModal();
              }}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="drawer-label">Peta Titik TPS</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeSection === 'tentang' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'tentang')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </span>
              <span className="drawer-label">Tentang Kami</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeSection === 'fitur' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'fitur')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <span className="drawer-label">Fitur Unggulan</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeSection === 'berita' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'berita')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
                  <line x1="7" y1="9" x2="11" y2="9"/>
                  <line x1="7" y1="13" x2="11" y2="13"/>
                </svg>
              </span>
              <span className="drawer-label">Berita & Artikel</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeSection === 'jenis-sampah' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'jenis-sampah')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </span>
              <span className="drawer-label">Jenis Sampah</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenRewardModal) onOpenRewardModal();
              }}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"/>
                  <rect x="2" y="7" width="20" height="5"/>
                  <line x1="12" y1="22" x2="12" y2="7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </span>
              <span className="drawer-label">Kalkulator Reward</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => handleRolePortalClick('#warga')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span className="drawer-label">Portal Warga</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => handleRolePortalClick('#qr')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </span>
              <span className="drawer-label">QR Token &amp; Setoran</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => handleRolePortalClick('#warga')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <span className="drawer-label">Live Chat Admin</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => handleRolePortalClick('#petugas')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </span>
              <span className="drawer-label">Petugas TPS Lapangan</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => handleRolePortalClick('#admin')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l7-4 7 4v14"/>
                  <path d="M9 10v4"/>
                  <path d="M15 10v4"/>
                </svg>
              </span>
              <span className="drawer-label">Admin Kelurahan DLH</span>
            </button>

            <button
              type="button"
              className="drawer-item"
              onClick={() => handleRolePortalClick('#superadmin')}
            >
              <span className="drawer-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </span>
              <span className="drawer-label">Superadmin Kota SBY</span>
            </button>
          </nav>
        </div>

        {/* Drawer Bottom Actions: Login / Profile */}
        <div className="drawer-footer-actions">
          {currentUser ? (
            <div className="drawer-user-card">
              <div className="drawer-user-info">
                <div className="drawer-user-avatar">
                  {(currentUser.nama_lengkap || currentUser.nama || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="drawer-user-meta">
                  <div className="drawer-user-name">{currentUser.nama_lengkap || currentUser.nama || 'Pengguna'}</div>
                  <div className="drawer-user-role">{currentUser.role || 'warga'}</div>
                </div>
              </div>
              <button
                type="button"
                className="drawer-logout-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  sessionStorage.clear();
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('auth_user');
                  window.location.hash = 'beranda';
                  window.location.reload();
                }}
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="drawer-signin-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenLoginModal) onOpenLoginModal();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>Login ke Akun</span>
            </button>
          )}

          <div className="drawer-copyright">
            © 2026 Dinas Lingkungan Hidup Kota Surabaya · SI-PETASAN v2.4
          </div>
        </div>
      </aside>
    </>
  );
}
