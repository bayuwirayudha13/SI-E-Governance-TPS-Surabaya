import React, { useState } from 'react';
import { tpsList } from '../data/mockData';

export default function TpsMapModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [reportingTps, setReportingTps] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredList = tpsList.filter((tps) => {
    const matchesSearch = 
      tps.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tps.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tps.kelurahan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'Semua' || 
      (filterStatus === 'Aman' && tps.status === 'Hijau') ||
      (filterStatus === 'Waspada' && tps.status === 'Kuning') ||
      (filterStatus === 'Kritis' && tps.status === 'Merah');

    return matchesSearch && matchesStatus;
  });

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setReportingTps(null);
    }, 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Direktori Web-GIS TPS Surabaya</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Monitoring 231 Titik Penampungan Sementara &bull; Data Terupdate
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* If citizen is filling a report form for a TPS */}
          {reportingTps ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <button 
                type="button" 
                onClick={() => setReportingTps(null)} 
                style={{ color: '#059669', fontSize: '0.88rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                &larr; Kembali ke daftar TPS
              </button>

              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Lapor Kondisi TPS: {reportingTps.nama}
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '18px' }}>
                Laporan warga akan langsung diteruskan ke Pengawas Lapangan DLH &amp; Driver Truk Surabaya (tanpa perlu login).
              </p>

              {reportSuccess ? (
                <div style={{ padding: '20px', background: '#dcfce7', borderRadius: '12px', border: '1px solid #86efac', textAlign: 'center', color: '#14532d' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
                    Laporan Berhasil Terkirim!
                  </div>
                  <div style={{ fontSize: '0.88rem' }}>
                    Terima kasih atas kepedulian Anda. Satgas DLH Surabaya segera menindaklanjuti lokasi ini.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Kategori Masalah:
                    </label>
                    <select 
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    >
                      <option value="overcapacity">Sampah Meluap (Overcapacity &ge;80%)</option>
                      <option value="bau">Bau Menyengat Mengganggu Permukiman</option>
                      <option value="rusak">Kontainer / Fasilitas TPS Rusak</option>
                      <option value="liar">Tumpukan Sampah di Luar Kontainer</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Deskripsi Singkat / Catatan Lokasi:
                    </label>
                    <textarea 
                      required
                      rows="3"
                      placeholder="Contoh: Sampah menumpuk hingga ke bahu jalan, mohon segera diangkut truk DLH."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setReportingTps(null)}
                      style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="btn-pill-green"
                      style={{ padding: '9px 22px', borderRadius: '8px' }}
                    >
                      Kirim Laporan Sekarang
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Search & Filter Controls */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Cari nama TPS, kecamatan, atau kelurahan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem'
                  }}
                />
                
                {/* Status Tabs */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['Semua', 'Aman', 'Waspada', 'Kritis'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: filterStatus === status ? '#047857' : '#f8fafc',
                        color: filterStatus === status ? '#ffffff' : '#475569'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* TPS List Table / Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                {filteredList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Tidak ada TPS yang sesuai dengan filter pencarian.
                  </div>
                ) : (
                  filteredList.map((tps) => {
                    const badgeClass = tps.status === 'Merah' ? 'red' : tps.status === 'Kuning' ? 'yellow' : 'green';
                    
                    return (
                      <div
                        key={tps.id}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px',
                          transition: 'border-color 0.2s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{tps.nama}</strong>
                            <span className={`map-tooltip-badge ${badgeClass}`} style={{ margin: 0 }}>
                              {tps.kapasitasPersen}% &bull; {tps.statusText}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            Kec. {tps.kecamatan} &bull; Kel. {tps.kelurahan} &bull; Jam: {tps.jamOperasional}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '3px' }}>
                            Daya tampung: {tps.kapasitasM3} m³ &bull; Terakhir update: {tps.terakhirUpdate}
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div style={{ width: '130px', textAlign: 'right' }}>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: '#e2e8f0',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            marginBottom: '6px'
                          }}>
                            <div style={{
                              width: `${tps.kapasitasPersen}%`,
                              height: '100%',
                              background: tps.status === 'Merah' ? '#ef4444' : tps.status === 'Kuning' ? '#f59e0b' : '#10b981',
                              borderRadius: '999px'
                            }}></div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReportingTps(tps)}
                            style={{
                              fontSize: '0.76rem',
                              color: '#b91c1c',
                              fontWeight: 600,
                              textDecoration: 'underline'
                            }}
                          >
                            Lapor Kendala
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
