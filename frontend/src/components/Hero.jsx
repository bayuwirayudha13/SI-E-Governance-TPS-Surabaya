import React from 'react';
import HeroMap from './HeroMap';

export default function Hero({ onOpenTpsModal, onOpenTpsDetail, onOpenLoginModal }) {
  return (
    <section id="beranda" className="hero-section">
      <div className="hero-contour-bg"></div>
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Headlines & Call to Action */}
          <div className="hero-content">
            <h1 className="hero-title">
              <span>Kelola sampah</span>
              <span>selamatkan bumi!</span>
            </h1>
            <p className="hero-description">
              Sistem Informasi Pemetaan Kapasitas TPS Kota Surabaya berbasis OpenStreetMap (OSM). Pantau ketersediaan daya tampung sampah secara real-time, pilah sampah dari rumah tangga, dan dapatkan reward untuk Surabaya yang lebih bersih dan hijau.
            </p>
            <div className="hero-cta">
              <button 
                type="button" 
                className="btn-pill-dark"
                onClick={onOpenTpsModal}
                id="hero-cta-btn"
              >
                <span>Mulai Sekarang</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              {onOpenLoginModal && (
                <button
                  type="button"
                  className="btn-hero-login"
                  onClick={onOpenLoginModal}
                  id="hero-login-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  <span>Login Akun</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Interactive OpenStreetMap (OSM) */}
          <HeroMap onOpenTpsModal={onOpenTpsDetail || onOpenTpsModal} />
        </div>
      </div>
    </section>
  );
}
