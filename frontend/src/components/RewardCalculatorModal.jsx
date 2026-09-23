import React, { useState } from 'react';
import { rewardCatalog } from '../data/mockData';

export default function RewardCalculatorModal({ isOpen, onClose }) {
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [weightKg, setWeightKg] = useState(3);
  const [cleanliness, setCleanliness] = useState('full'); // 'full' (100%) or 'partial' (80%)
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentRate = rewardCatalog[selectedItemIndex];
  const factor = cleanliness === 'full' ? 1.0 : 0.8;
  const totalPoints = Math.round(weightKg * currentRate.poinPerKg * factor);
  const totalRupiah = Math.round(weightKg * currentRate.rupiah * factor);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Simulasi Reward Sampah Anorganik</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Bank Sampah &bull; Kelurahan Surabaya
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Item Category Selection */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              Pilih Jenis Sampah Anorganik:
            </label>
            <select
              value={selectedItemIndex}
              onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.92rem',
                fontFamily: 'inherit',
                backgroundColor: '#f8fafc',
                color: '#0f172a'
              }}
            >
              {rewardCatalog.map((item, idx) => (
                <option key={idx} value={idx}>
                  {item.jenis} — Rp {item.rupiah.toLocaleString('id-ID')}/kg
                </option>
              ))}
            </select>
          </div>

          {/* Weight Input & Presets */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              Estimasi Berat Sampah (kg):
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0))}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  fontWeight: 600
                }}
              />
              <span style={{ fontWeight: 600, color: '#475569' }}>Kg</span>
            </div>
            {/* Quick Weight Presets */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {[1, 2, 5, 10].map((kg) => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => setWeightKg(kg)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: weightKg === kg ? '#047857' : '#f1f5f9',
                    color: weightKg === kg ? '#ffffff' : '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  +{kg} kg
                </button>
              ))}
            </div>
          </div>

          {/* Cleanliness Check (PRD requirement 4.1) */}
          <div style={{ marginBottom: '22px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#14532d', display: 'block', marginBottom: '6px' }}>
              Tingkat Kebersihan Sampah:
            </span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: '#166534', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cleanliness"
                  checked={cleanliness === 'full'}
                  onChange={() => setCleanliness('full')}
                />
                <span>100% Bersih &amp; Kering (Reward Penuh)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: '#166534', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cleanliness"
                  checked={cleanliness === 'partial'}
                  onChange={() => setCleanliness('partial')}
                />
                <span>Cukup Bersih (80% Reward)</span>
              </label>
            </div>
          </div>

          {/* Calculation Result Card */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b, #047857)',
            borderRadius: '16px',
            padding: '20px',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(4, 120, 87, 0.25)',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '0.82rem', opacity: 0.85, marginBottom: '4px' }}>
              Estimasi Perolehan Reward Warga:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {totalPoints.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Poin</span>
                </div>
                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  Setara: <strong>Rp {totalRupiah.toLocaleString('id-ID')}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.78rem', opacity: 0.8 }}>
                <div>Bobot: {weightKg} kg</div>
                <div>Status: Siap Ditimbang</div>
              </div>
            </div>
          </div>

          {/* QR Code Section Toggle */}
          {showQr ? (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #94a3b8',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{
                width: '140px',
                height: '140px',
                margin: '0 auto 12px',
                background: '#ffffff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 100 100" width="120" height="120">
                  {/* Stylized QR Code Graphic */}
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="30" height="30" fill="#042416" />
                  <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                  <rect x="20" y="20" width="10" height="10" fill="#042416" />
                  
                  <rect x="60" y="10" width="30" height="30" fill="#042416" />
                  <rect x="65" y="15" width="20" height="20" fill="#ffffff" />
                  <rect x="70" y="20" width="10" height="10" fill="#042416" />

                  <rect x="10" y="60" width="30" height="30" fill="#042416" />
                  <rect x="15" y="65" width="20" height="20" fill="#ffffff" />
                  <rect x="20" y="70" width="10" height="10" fill="#042416" />

                  <rect x="45" y="10" width="8" height="25" fill="#042416" />
                  <rect x="45" y="45" width="25" height="10" fill="#042416" />
                  <rect x="75" y="45" width="15" height="15" fill="#042416" />
                  <rect x="45" y="65" width="10" height="25" fill="#042416" />
                  <rect x="60" y="70" width="25" height="20" fill="#042416" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                ID Warga: SBY-7291-8842
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Tunjukkan QR ini ke Petugas Kelurahan saat menimbang sampah
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-pill-dark"
              onClick={() => setShowQr(true)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Buat QR Code Setor Sampah</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
