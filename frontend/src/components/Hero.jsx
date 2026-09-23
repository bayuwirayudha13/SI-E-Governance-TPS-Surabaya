import React, { useState } from 'react';
import surabayaMapImg from '../assets/images/surabaya_map_satellite.jpg';

// Hotspot points mapped to the exact pins on the user's satellite map
const mapHotspots = [
  {
    id: 1,
    name: "TPA Benowo",
    x: 17,
    y: 9,
    kapasitas: 82,
    status: "Merah",
    statusText: "Kritis (Prioritas Angkut)",
    tipe: "Tempat Pemrosesan Akhir (Waste-to-Energy)",
    kecamatan: "Benowo",
    jam: "24 Jam"
  },
  {
    id: 2,
    name: "PD. Benowo Indah",
    x: 23,
    y: 27,
    kapasitas: 64,
    status: "Kuning",
    statusText: "Waspada",
    tipe: "TPS Pemukiman",
    kecamatan: "Pakal",
    jam: "06:00 - 18:00 WIB"
  },
  {
    id: 3,
    name: "Old Town (Kota Lama)",
    x: 53,
    y: 28,
    kapasitas: 48,
    status: "Hijau",
    statusText: "Aman",
    tipe: "TPS Wisata & Cagar Budaya",
    kecamatan: "Pabean Cantikan",
    jam: "05:00 - 21:00 WIB"
  },
  {
    id: 4,
    name: "TPS Gebang Putih",
    x: 80,
    y: 45,
    kapasitas: 55,
    status: "Hijau",
    statusText: "Aman",
    tipe: "TPS Kelurahan",
    kecamatan: "Sukolilo",
    jam: "06:00 - 19:00 WIB"
  },
  {
    id: 5,
    name: "Pakuwon City",
    x: 75.5,
    y: 34,
    kapasitas: 42,
    status: "Hijau",
    statusText: "Aman",
    tipe: "TPS Mandiri Kawasan",
    kecamatan: "Mulyorejo",
    jam: "06:00 - 20:00 WIB"
  },
  {
    id: 6,
    name: "Bank Sampah Pesapen",
    x: 35,
    y: 68,
    kapasitas: 35,
    status: "Hijau",
    statusText: "Unit Bank Sampah Aktif",
    tipe: "Pusat Setor Sampah Anorganik",
    kecamatan: "Krembangan",
    jam: "08:00 - 16:00 WIB"
  },
  {
    id: 7,
    name: "TPST Kiriman Dalam",
    x: 68,
    y: 82,
    kapasitas: 88,
    status: "Merah",
    statusText: "Kritis (Peringatan Dini Overcapacity)",
    tipe: "TPST 3R (Reuse, Reduce, Recycle)",
    kecamatan: "Rungkut",
    jam: "05:30 - 17:30 WIB"
  },
  {
    id: 8,
    name: "TPS Wonokromo / Pusat",
    x: 53.5,
    y: 46,
    kapasitas: 74,
    status: "Kuning",
    statusText: "Waspada (Mendekati Batas)",
    tipe: "TPS Pasar & Pemukiman",
    kecamatan: "Wonokromo",
    jam: "06:00 - 18:00 WIB"
  },
  {
    id: 9,
    name: "TPS Darmo / Selatan",
    x: 52,
    y: 64,
    kapasitas: 58,
    status: "Hijau",
    statusText: "Aman",
    tipe: "TPS Perkotaan",
    kecamatan: "Wonokromo",
    jam: "06:00 - 20:00 WIB"
  }
];

export default function Hero({ onOpenTpsModal }) {
  const [activeSpot, setActiveSpot] = useState(null);

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
              Sistem Informasi Pemetaan Kapasitas TPS Kota Surabaya. Pantau ketersediaan daya tampung sampah secara real-time, pilah sampah dari rumah tangga, dan dapatkan reward untuk Surabaya yang lebih bersih dan hijau.
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

          {/* Right Column: Exact Satellite GIS Map from User */}
          <div className="hero-map-wrapper">
            {/* Map Header Status Legend */}
            <div className="map-status-bar">
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                Pemetaan Web-GIS Surabaya
              </span>
              <div className="map-status-indicators">
                <span><span className="status-dot green"></span>&le;60% Aman</span>
                <span><span className="status-dot yellow"></span>61-79% Waspada</span>
                <span><span className="status-dot red"></span>&ge;80% Kritis</span>
              </div>
            </div>

            {/* Map Satellite Image View with Interactive Pulse Markers */}
            <div 
              style={{ 
                position: 'relative', 
                width: '100%', 
                overflow: 'hidden', 
                cursor: 'pointer',
                backgroundColor: '#0c2417'
              }}
              onClick={() => setActiveSpot(null)}
            >
              <img 
                src={surabayaMapImg} 
                alt="Peta Satelit Sebaran TPS Kota Surabaya"
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block',
                  filter: 'contrast(1.05) brightness(1.02)'
                }}
              />

              {/* Interactive Hotspot Buttons for Pins on the Map */}
              {mapHotspots.map((spot) => {
                const isSelected = activeSpot?.id === spot.id;
                const badgeClass = spot.status === 'Merah' ? 'red' : spot.status === 'Kuning' ? 'yellow' : 'green';

                return (
                  <div
                    key={spot.id}
                    style={{
                      position: 'absolute',
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isSelected ? 30 : 10
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSpot(isSelected ? null : spot);
                    }}
                  >
                    {/* Glowing Circular Target Ring */}
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title={`${spot.name} - ${spot.kapasitas}%`}
                    >
                      {/* Pulse Wave Animation */}
                      <span 
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          border: `2px solid ${spot.status === 'Merah' ? '#ef4444' : spot.status === 'Kuning' ? '#f59e0b' : '#22c55e'}`,
                          animation: 'mapPulse 2s infinite ease-out'
                        }}
                      />
                      {/* Small Center Target Dot */}
                      <span 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: spot.status === 'Merah' ? '#ef4444' : spot.status === 'Kuning' ? '#f59e0b' : '#22c55e',
                          boxShadow: '0 0 8px rgba(255,255,255,0.9)'
                        }}
                      />
                    </div>

                    {/* Popup Tooltip upon Clicking Marker */}
                    {isSelected && (
                      <div 
                        className="map-tooltip" 
                        style={{ bottom: 'calc(100% + 8px)', width: '230px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="map-tooltip-title">{spot.name}</div>
                        <span className={`map-tooltip-badge ${badgeClass}`}>
                          Kapasitas: {spot.kapasitas}% &bull; {spot.statusText}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: '#475569', margin: '6px 0' }}>
                          <div>Tipe: <strong>{spot.tipe}</strong></div>
                          <div>Kecamatan: {spot.kecamatan}</div>
                          <div>Jam: {spot.jam}</div>
                        </div>
                        <button
                          type="button"
                          onClick={onOpenTpsModal}
                          style={{
                            background: '#042416',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.74rem',
                            fontWeight: '600',
                            width: '100%',
                            marginTop: '4px'
                          }}
                        >
                          Lihat Detail TPS &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar: Full Map CTA */}
            <div 
              style={{ 
                padding: '12px 18px', 
                background: 'rgba(7, 24, 16, 0.95)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.82rem',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                Peta Sebaran TPS &bull; Surabaya Terintegrasi
              </span>
              <button 
                type="button"
                onClick={onOpenTpsModal}
                style={{ 
                  color: '#4ade80', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}
              >
                Buka Direktori Lengkap &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
