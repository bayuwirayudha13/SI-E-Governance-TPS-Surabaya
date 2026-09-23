import React from 'react';
import tpaBenowoImg from '../assets/images/tpa_benowo.jpg';

export default function About() {
  return (
    <section id="tentang" className="about-section">
      <div className="about-contour-bg"></div>
      <div className="container">
        <div className="about-grid">
          {/* Left Column: About Information */}
          <div className="about-content">
            <h2 className="about-title">Tentang kami</h2>
            <p className="about-text">
              SI-PETASAN (Sistem Informasi Pemetaan Kapasitas Tempat Penampungan Sementara) adalah platform aplikasi berbasis web geospasial (Web-GIS) yang dirancang khusus untuk memetakan, memantau, menganalisis, serta mengelola kapasitas tampung sampah di seluruh Tempat Penampungan Sementara (TPS) yang tersebar di wilayah Kota Surabaya secara konsisten dan terintegrasi.
            </p>
            <p className="about-text" style={{ fontSize: '0.96rem', color: '#64748b' }}>
              Bekerja sama dengan Dinas Lingkungan Hidup (DLH) Kota Surabaya, platform ini mengintegrasikan rute armada pengangkut menuju TPA Benowo (Waste to Energy), pengawasan kapasitas real-time, serta program insentif reward untuk warga yang memilah sampah dari rumah tangga.
            </p>
          </div>

          {/* Right Column: Waste to Energy TPA Benowo Image */}
          <div className="about-image-wrapper">
            <img 
              src={tpaBenowoImg} 
              alt="Monumen Waste To Energy TPA Benowo Surabaya - Dinas Kebersihan dan Pertamanan Kota Surabaya" 
              className="about-image"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
