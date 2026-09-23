import React from 'react';
import bankSampahImg from '../assets/images/bank_sampah.jpg';

export default function Features({ onOpenRewardModal, onOpenTpsModal }) {
  return (
    <section id="fitur" className="features-section">
      <div className="features-contour-bg"></div>
      <div className="container">
        <div className="features-grid">
          {/* Left Column: Features Explanation */}
          <div className="features-content">
            <h2 className="features-title">Fitur utama kami</h2>
            <p className="features-description">
              Pantau kapasitas TPS secara real-time melalui visualisasi Web-GIS interaktif, setorkan sampah anorganik terpilah di Bank Sampah kelurahan untuk mengumpulkan poin reward yang dapat ditukar, serta nikmati sistem peringatan dini (early warning) pencegahan overcapacity demi Surabaya yang bersih dan asri.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn-pill-dark"
                onClick={onOpenRewardModal}
                id="features-reward-btn"
              >
                <span>Simulasi Reward Sampah</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <button 
                type="button" 
                className="btn-pill-green"
                onClick={onOpenTpsModal}
                style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <span>Monitoring Spasial</span>
              </button>
            </div>
          </div>

          {/* Right Column: Bank Sampah Community Photo */}
          <div className="features-image-wrapper">
            <img 
              src={bankSampahImg} 
              alt="Petugas Dinas Lingkungan Hidup Surabaya melayani penimbangan sampah anorganik berhadiah reward poin di Bank Sampah" 
              className="features-image"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
