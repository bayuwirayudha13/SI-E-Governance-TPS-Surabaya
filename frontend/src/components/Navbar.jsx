import React, { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tentang', label: 'Tentang kami' },
  { id: 'fitur', label: 'Fitur' },
  { id: 'berita', label: 'Berita & Artikel' },
  { id: 'jenis-sampah', label: 'Jenis Sampah' },
];

export default function Navbar({ onOpenLoginModal, onOpenTpsModal: _onOpenTpsModal, currentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // ScrollSpy: auto-detect which section is currently on screen
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
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
    e.preventDefault();
    setActiveSection(sectionId);
    setMobileMenuOpen(false);

    const el = document.getElementById(sectionId);
    if (el) {
      const navOffset = 72;
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

  return (
    <header className={`site-header ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      <div className="nav-container">
        {/* Brand Logo - Aligned to far left */}
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
          <span>SI-Petasan</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav>
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

        {/* Action Button: Sign In or Dashboard Link */}
        <div className="nav-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn-pill-dark"
                onClick={() => {
                  if (currentUser.role === 'admin') window.location.hash = '#admin';
                  else if (currentUser.role === 'petugas') window.location.hash = '#petugas';
                  else window.location.hash = '#warga';
                }}
                id="nav-dashboard-btn"
                style={{ padding: '8px 18px', background: '#0a5c36' }}
              >
                <span>
                  {currentUser.role === 'admin'
                    ? 'Admin Panel'
                    : currentUser.role === 'petugas'
                    ? 'Portal Petugas'
                    : 'Portal Warga'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn-pill-dark"
              onClick={onOpenLoginModal}
              id="nav-signin-btn"
            >
              <span>Sign in</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            type="button" 
            className="menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
