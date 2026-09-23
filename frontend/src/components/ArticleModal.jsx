import React from 'react';

export default function ArticleModal({ article, onClose }) {
  if (!article) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
              {article.category}
            </span>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{article.date}</div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0 26px 30px' }}>
          <div style={{ height: '300px', margin: '0 -26px 20px', overflow: 'hidden' }}>
            <img 
              src={article.image} 
              alt={article.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', lineHeight: 1.3 }}>
            {article.title}
          </h2>

          <div style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {article.content}
          </div>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Sumber: Biro Hubungan Masyarakat &amp; Informasi DLH Surabaya
            </span>
            <button 
              type="button" 
              className="btn-pill-dark"
              onClick={onClose}
              style={{ padding: '8px 20px', fontSize: '0.88rem' }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
