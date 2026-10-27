import React from 'react';

/**
 * TpsDetailModal Component:
 * Halaman / Modal Detail Lengkap TPS Kota Surabaya
 * Menampilkan metrik kapasitas, lokasi GPS, jam operasional,
 * tombol navigasi Google Maps, dan tombol lapor kendala.
 */
export default function TpsDetailModal({ tps, isOpen, onClose, onOpenReport }) {
  if (!isOpen || !tps) return null;

  const persen = tps.kapasitasPersen ?? 50;
  const isCritical = persen >= 80 || tps.status === 'Kritis' || tps.status === 'Merah';
  const isWarning = (persen >= 60 && persen < 80) || tps.status === 'Waspada' || tps.status === 'Kuning';
  const statusColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const statusBadgeClass = isCritical ? 'red' : isWarning ? 'yellow' : 'green';
  const statusLabel = isCritical ? 'KRITIS (Overload)' : isWarning ? 'WASPADA (Hampir Penuh)' : 'AMAN';

  const googleMapsUrl = tps.lat && tps.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${tps.lat},${tps.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tps.nama + ' Surabaya')}`;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '0', overflow: 'hidden', borderRadius: '20px' }}
      >
        {/* Header Hero Banner */}
        <div style={{
          background: isCritical
            ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
            : isWarning
            ? 'linear-gradient(135deg, #78350f, #b45309)'
            : 'linear-gradient(135deg, #064e3b, #047857)',
          color: '#ffffff',
          padding: '24px 28px',
          position: 'relative'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: '#ffffff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Tutup"
          >
            &times;
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {tps.jenisTps || tps.jenis_tps || 'TPS Resmi DLH'}
            </span>
            <span style={{
              background: statusColor,
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              {persen}% &bull; {statusLabel}
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
            {tps.nama}
          </h2>
          <p style={{ fontSize: '0.86rem', opacity: 0.9, margin: 0 }}>
            Kecamatan {tps.kecamatan || '—'} &bull; Kelurahan {tps.kelurahan || tps.wilayahKota || tps.wilayah_kota || '—'}
          </p>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Capacity Progress Gauge */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                Tingkat Keterisian Sampah Saat Ini
              </span>
              <strong style={{ fontSize: '1.15rem', color: statusColor }}>
                {persen}%
              </strong>
            </div>

            <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, persen))}%`,
                height: '100%',
                background: statusColor,
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
              <span>0% (Kosong)</span>
              <span>75% (Waspada)</span>
              <span>100% (Penuh / Overload)</span>
            </div>
          </div>

          {/* Key Metric Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                📦 DAYA TAMPUNG TOTAL
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {tps.kapasitasM3 || tps.daya_tampung_m3 || tps.dayaTampungM3 || '—'} m³
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                🚛 JUMLAH KONTAINER
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {tps.jumlahContainer || tps.jumlah_container || '1 Kontainer Besar'}
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                ⏰ JAM OPERASIONAL
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                {tps.jamOperasional || '06:00 - 18:00 WIB'}
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                🌐 KOORDINAT GPS
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {tps.lat ? `${parseFloat(tps.lat).toFixed(4)}, ${parseFloat(tps.lng).toFixed(4)}` : 'Tersedia di Peta'}
              </div>
            </div>
          </div>

          {/* Location & Details Card */}
          <div style={{ padding: '16px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>
              📍 Alamat &amp; Area Layanan
            </h4>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
              {tps.lokasi || tps.alamat || `Area TPS ${tps.nama}, Kelurahan ${tps.kelurahan || tps.wilayahKota || '—'}, Kecamatan ${tps.kecamatan || '—'}, Kota Surabaya.`}
            </p>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Wilayah Kota: <strong>{tps.wilayahKota || tps.wilayah_kota || 'Surabaya'}</strong> &bull; Terakhir Diperbarui: <strong>{tps.terakhirUpdate || 'Hari ini'}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 18px',
                borderRadius: '10px',
                background: '#047857',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(4,120,87,0.25)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Buka Rute Google Maps
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenReport) onOpenReport(tps);
              }}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '12px 18px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Lapor Kendala TPS Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
