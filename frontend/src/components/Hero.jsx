import React, { useState } from 'react';
import { tpsList } from '../data/mockData';

export default function Hero({ onOpenTpsModal }) {
  const [activePin, setActivePin] = useState(null);

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
              Sistem Informasi Pemetaan Kapasitas TPS Kota Surabaya. Pantau ketersediaan daya tampung sampah secara real-time, pilah sampah dari rumah tangga, dan dapatkan insentif reward untuk Surabaya yang lebih bersih, tertata, dan berkelanjutan.
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

          {/* Right Column: Interactive Surabaya GIS Map Preview */}
          <div className="hero-map-wrapper">
            {/* Map Header Status Legend */}
            <div className="map-status-bar">
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Pemetaan Web-GIS Surabaya
              </span>
              <div className="map-status-indicators">
                <span><span className="status-dot green"></span>&le;60% Aman</span>
                <span><span className="status-dot yellow"></span>61-79% Waspada</span>
                <span><span className="status-dot red"></span>&ge;80% Kritis</span>
              </div>
            </div>

            {/* Map Canvas Background (Simulated High-Tech Geodata Satellite View) */}
            <div className="hero-map-canvas" onClick={() => setActivePin(null)}>
              {/* SVG Stylized Surabaya Geography: Coastline, Rivers & Roads */}
              <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, opacity: 0.95 }}
              >
                <defs>
                  <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3e2b" />
                    <stop offset="50%" stopColor="#163323" />
                    <stop offset="100%" stopColor="#0e2418" />
                  </linearGradient>
                  <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0a1d27" />
                    <stop offset="100%" stopColor="#07151c" />
                  </linearGradient>
                </defs>

                {/* Base Land */}
                <rect width="100" height="100" fill="url(#landGrad)" />

                {/* Sea / Madura Strait (North & East coastline) */}
                <path 
                  d="M0,0 L100,0 L100,20 C85,25 75,18 60,15 C45,12 30,18 20,12 C10,6 0,10 0,0 Z" 
                  fill="url(#seaGrad)" 
                  opacity="0.85"
                />
                <path 
                  d="M88,0 L100,0 L100,100 L92,100 C90,80 94,60 88,40 C85,28 92,15 88,0 Z" 
                  fill="url(#seaGrad)" 
                  opacity="0.75"
                />

                {/* Major Arterial Roads of Surabaya */}
                <g stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" fill="none">
                  {/* Tol Surabaya-Gresik & Tol Satelit */}
                  <path d="M0,35 Q30,40 50,55 T70,85 T75,100" strokeWidth="1.2" stroke="rgba(250, 204, 21, 0.4)" />
                  {/* Jl. Ahmad Yani to Wonokromo */}
                  <path d="M52,100 L52,50 L50,30 L45,15" strokeWidth="1" stroke="rgba(255, 255, 255, 0.3)" />
                  {/* Jl. Merr (Middle East Ring Road) */}
                  <path d="M78,18 L75,40 L72,70 L70,100" strokeWidth="0.9" />
                  {/* Cross town connections */}
                  <path d="M15,35 L45,35 L75,35" strokeDasharray="1,1" />
                  <path d="M20,60 L52,60 L85,60" strokeDasharray="1,1" />
                  <path d="M45,25 L65,45 L80,50" />
                </g>

                {/* Kali Mas & Kali Jagir waterways */}
                <path 
                  d="M52,100 Q50,75 55,60 T48,30 T45,15" 
                  fill="none" 
                  stroke="#0284c7" 
                  strokeWidth="1.2" 
                  opacity="0.6" 
                />
                <path 
                  d="M52,70 Q65,72 88,75" 
                  fill="none" 
                  stroke="#0284c7" 
                  strokeWidth="0.9" 
                  opacity="0.6" 
                />

                {/* Subtle District Boundaries / Grid */}
                <g stroke="rgba(74, 222, 128, 0.12)" strokeWidth="0.4" fill="none">
                  <circle cx="50" cy="50" r="18" />
                  <circle cx="50" cy="50" r="32" strokeDasharray="2,2" />
                </g>
              </svg>

              {/* Marker Pins Placed According to Coordinates */}
              {tpsList.map((tps) => {
                const isSelected = activePin?.id === tps.id;
                const pinColor = tps.status === 'Merah' ? 'red' : tps.status === 'Kuning' ? 'yellow' : 'green';

                return (
                  <div
                    key={tps.id}
                    className={`map-pin ${isSelected ? 'active' : ''}`}
                    style={{ left: `${tps.koordinat.x}%`, top: `${tps.koordinat.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePin(isSelected ? null : tps);
                    }}
                    title={`${tps.nama} (${tps.kapasitasPersen}%)`}
                  >
                    <div className="pin-icon-wrap">
                      <div className={`pin-marker ${pinColor}`}>
                        <div className="pin-center"></div>
                      </div>
                      <div className="pin-pulse"></div>
                    </div>
                    <span className="pin-label">{tps.nama}</span>

                    {/* Interactive Tooltip Card on Click */}
                    {isSelected && (
                      <div className="map-tooltip" onClick={(e) => e.stopPropagation()}>
                        <div className="map-tooltip-title">{tps.nama}</div>
                        <span className={`map-tooltip-badge ${pinColor}`}>
                          {tps.statusText}
                        </span>
                        <div style={{ margin: '6px 0', fontSize: '0.76rem', color: '#475569' }}>
                          <div>Kec. {tps.kecamatan} &bull; Kel. {tps.kelurahan}</div>
                          <div>Daya Tampung: <strong>{tps.kapasitasPersen}%</strong> ({tps.kapasitasM3} m³)</div>
                          <div>Jam: {tps.jamOperasional}</div>
                          <div style={{ color: '#059669', fontSize: '0.72rem', marginTop: '4px' }}>
                            Diupdate {tps.terakhirUpdate}
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{
                            background: '#042416',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            width: '100%',
                            marginTop: '4px'
                          }}
                          onClick={onOpenTpsModal}
                        >
                          Lihat Detail TPS Lengkap &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar: Quick Trigger for Full Map */}
            <div 
              style={{ 
                padding: '10px 16px', 
                background: 'rgba(7, 24, 16, 0.95)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.8rem',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                Menampilkan 8 dari 231 titik TPS Kota Surabaya
              </span>
              <button 
                type="button"
                onClick={onOpenTpsModal}
                style={{ 
                  color: '#4ade80', 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}
              >
                Lihat 231 TPS &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
