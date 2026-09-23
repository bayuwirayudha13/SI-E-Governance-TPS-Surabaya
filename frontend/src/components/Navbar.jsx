import React, { useState } from 'react';

export default function Navbar({ onOpenLoginModal, onOpenTpsModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={`site-header ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      <div className="nav-container">
        {/* Brand Logo */}
        <a href="#beranda" className="brand-logo" id="brand-logo">
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
            <li><a href="#beranda" className="nav-link active">Beranda</a></li>
            <li><a href="#tentang" className="nav-link">Tentang kami</a></li>
            <li><a href="#fitur" className="nav-link">Fitur</a></li>
            <li><a href="#berita" className="nav-link">Berita &amp; Artikel</a></li>
            <li><a href="#jenis-sampah" className="nav-link">Jenis Sampah</a></li>
          </ul>
        </nav>

        {/* Action Button: Sign In (As in the original mockup) */}
        <div className="nav-actions">
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
