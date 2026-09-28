import React from 'react';
import HeroMap from './HeroMap';

export default function Hero({ onOpenTpsModal }) {
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
            </div>
          </div>

          {/* Right Column: Interactive OpenStreetMap (OSM) */}
          <HeroMap onOpenTpsModal={onOpenTpsModal} />
        </div>
      </div>
    </section>
  );
}
