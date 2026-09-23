import React from 'react';

export default function WasteGuideModal({ wasteGuide, onClose }) {
  if (!wasteGuide) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Panduan Edukasi: {wasteGuide.title}</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Pedoman DLH Kota Surabaya &bull; Pengelolaan Mandiri
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, marginBottom: '20px' }}>
            {wasteGuide.description}
          </p>

          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
            Daftar Material Termasuk:
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px', color: '#475569', fontSize: '0.92rem' }}>
            {wasteGuide.items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
            ))}
          </ul>

          <div style={{
            background: wasteGuide.id === 'organik' ? '#f0fdf4' : '#fff7ed',
            padding: '16px',
            borderRadius: '12px',
            border: `1px solid ${wasteGuide.id === 'organik' ? '#bbf7d0' : '#fed7aa'}`,
            fontSize: '0.88rem',
            color: wasteGuide.id === 'organik' ? '#166534' : '#9a3412',
            lineHeight: 1.6
          }}>
            <strong>Tips Pengelolaan Praktis:</strong>
            {wasteGuide.id === 'organik' ? (
              <p style={{ marginTop: '4px' }}>
                Gunakan wadah tertutup komposter takakura atau biopori di halaman rumah. Sampah organik yang terolah menjadi kompos dapat menyuburkan tanaman taman kota dan mengurangi emisi gas metana di TPA Benowo.
              </p>
            ) : (
              <p style={{ marginTop: '4px' }}>
                Bungkus residu tajam, popok, dan obat kadaluwarsa secara terpisah dan rapat sebelum dimasukkan ke kantong sampah residu. Serahkan ke petugas armada pengangkut resmi DLH untuk penanganan aman.
              </p>
            )}
          </div>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button 
              type="button" 
              className="btn-pill-dark"
              onClick={onClose}
              style={{ padding: '8px 22px' }}
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
