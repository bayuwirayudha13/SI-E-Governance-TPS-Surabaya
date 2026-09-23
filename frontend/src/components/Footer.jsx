import React from 'react';

export default function Footer({ onOpenTpsModal, onOpenRewardModal }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top-grid">
          {/* Column 1: Brand & DLH Surabaya */}
          <div className="footer-brand">
            <a href="#beranda" className="brand-logo" style={{ display: 'inline-flex' }}>
              <div className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93A10 10 0 0 0 12 2z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <span>SI-Petasan</span>
            </a>
            <p className="footer-tagline">
              Sistem Informasi Pemetaan Kapasitas Tempat Penampungan Sementara (SIPK-TPS) Kota Surabaya.
            </p>
            <div className="dlh-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Dinas Lingkungan Hidup Kota Surabaya</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="footer-col-title">Navigasi</h4>
            <ul className="footer-links">
              <li><a href="#beranda" className="footer-link">Beranda</a></li>
              <li><a href="#tentang" className="footer-link">Tentang Kami</a></li>
              <li><a href="#fitur" className="footer-link">Fitur Utama</a></li>
              <li><a href="#berita" className="footer-link">Berita &amp; Artikel</a></li>
              <li><a href="#jenis-sampah" className="footer-link">Jenis Sampah</a></li>
            </ul>
          </div>

          {/* Column 3: Layanan & Akses */}
          <div>
            <h4 className="footer-col-title">Layanan Publik</h4>
            <ul className="footer-links">
              <li>
                <button type="button" className="footer-link" onClick={onOpenTpsModal} style={{ textAlign: 'left' }}>
                  Peta Web-GIS TPS
                </button>
              </li>
              <li>
                <button type="button" className="footer-link" onClick={onOpenRewardModal} style={{ textAlign: 'left' }}>
                  Bank Sampah &amp; Reward
                </button>
              </li>
              <li>
                <a href="#jenis-sampah" className="footer-link">Panduan Pemilahan</a>
              </li>
              <li>
                <a href="https://dlh.surabaya.go.id" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Portal DLH Surabaya
                </a>
              </li>
              <li>
                <a href="#tentang" className="footer-link">TPA Benowo WtE</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Call to Action */}
          <div>
            <h4 className="footer-col-title">Mulai Sekarang</h4>
            <p className="footer-cta-text">
              Pantau kondisi TPS di lingkungan tempat tinggal Anda atau setorkan sampah bernilai ekonomis ke kelurahan.
            </p>
            <button 
              type="button" 
              className="btn-pill-dark"
              onClick={onOpenTpsModal}
              id="footer-tps-btn"
            >
              <span>Buka Peta TPS</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} SI-PETASAN Surabaya. Hak Cipta Dilindungi Pemerintah Kota Surabaya.</p>
          <div className="footer-social-links">
            <a href="#beranda" className="social-icon" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#beranda" className="social-icon" aria-label="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="#beranda" className="social-icon" aria-label="Website">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
