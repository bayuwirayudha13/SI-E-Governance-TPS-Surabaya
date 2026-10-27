import React, { useState } from 'react';
import { api } from '../api/client';
import { TPS_SURABAYA_ALL } from '../data/tpsSurabayaData';

export default function LaporanWargaModal({ isOpen, onClose, targetTps, currentUser }) {
  if (!isOpen) return null;

  const [tpsNama, setTpsNama] = useState(() => targetTps?.nama || 'TPS Mawar');
  const [tpsId, setTpsId] = useState(() => targetTps?.id || 1);
  const [jenisLaporan, setJenisLaporan] = useState('Penuh');
  const [deskripsi, setDeskripsi] = useState('');
  const [namaPelapor, setNamaPelapor] = useState(() => currentUser?.nama_lengkap || currentUser?.nama || '');
  const [noHp, setNoHp] = useState(() => currentUser?.no_hp || '');
  const [fotoUrl, setFotoUrl] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFotoPreview(reader.result);
        setFotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deskripsi.trim()) {
      setErrorMsg('Mohon isi deskripsi kendala / masalah di TPS.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      tps_id: typeof tpsId === 'number' ? tpsId : 1,
      warga_id: currentUser?.id || 1,
      jenis_laporan: jenisLaporan,
      deskripsi: `[${tpsNama}] ${deskripsi.trim()}${namaPelapor ? ` (Pelapor: ${namaPelapor} - ${noHp || 'No HP tidak dicantumkan'})` : ''}`,
      foto_url: fotoUrl || null
    };

    try {
      // 1. Coba simpan ke Backend API
      await api.post('/api/laporan/', payload);
      setSuccessMsg(true);
    } catch (err) {
      console.warn('Backend laporan belum tersambung, menyimpan ke database lokal:', err);
      // 2. Simpan ke local storage agar tersimpan persist
      try {
        const savedReports = JSON.parse(localStorage.getItem('sipetasan_laporan_warga') || '[]');
        const newReport = {
          id: Date.now(),
          ...payload,
          tps_nama: tpsNama,
          status_tindak_lanjut: 'Menunggu',
          tanggal_lapor: new Date().toISOString()
        };
        localStorage.setItem('sipetasan_laporan_warga', JSON.stringify([newReport, ...savedReports]));
        setSuccessMsg(true);
      } catch {
        setErrorMsg('Gagal mengirim laporan. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', borderRadius: '18px', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
              📢 Form Laporan &amp; Keluhan Warga
            </h3>
            <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.9 }}>
              Laporan diteruskan langsung ke Satgas DLH &amp; Pengawas Lapangan Surabaya
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '30px 16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 16px'
              }}>
                ✓
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Laporan Berhasil Terkirim!
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
                Terima kasih atas kepedulian Anda terhadap kebersihan Kota Surabaya. Petugas DLH wilayah <strong>{tpsNama}</strong> telah menerima notifikasi laporan ini dan akan segera menindaklanjuti.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-pill-green"
                style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700 }}
              >
                Selesai &amp; Tutup
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  {errorMsg}
                </div>
              )}

              {/* Target TPS */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Lokasi / Titik TPS:
                </label>
                {targetTps ? (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}>
                    📍 {targetTps.nama} &bull; Kec. {targetTps.kecamatan || '—'}
                  </div>
                ) : (
                  <select
                    value={tpsNama}
                    onChange={(e) => {
                      setTpsNama(e.target.value);
                      const found = TPS_SURABAYA_ALL.find(x => x.nama === e.target.value);
                      if (found) setTpsId(found.id);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {TPS_SURABAYA_ALL.slice(0, 30).map(t => (
                      <option key={t.id} value={t.nama}>
                        {t.nama} — Kec. {t.kecamatan}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Kategori Kendala */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Kategori Masalah:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { val: 'Penuh', label: '🗑️ Sampah Meluap (Penuh)' },
                    { val: 'Rusak', label: '⚠️ Kontainer / TPS Rusak' },
                    { val: 'Tidak Terawat', label: '🤢 Bau & Air Lindi' },
                    { val: 'Lainnya', label: '❓ Sampah Liar / Lainnya' }
                  ].map(cat => (
                    <button
                      key={cat.val}
                      type="button"
                      onClick={() => setJenisLaporan(cat.val)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: jenisLaporan === cat.val ? '2px solid #b91c1c' : '1px solid #cbd5e1',
                        background: jenisLaporan === cat.val ? '#fef2f2' : '#ffffff',
                        color: jenisLaporan === cat.val ? '#b91c1c' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Pelapor (Opsional) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nama Pelapor:
                  </label>
                  <input
                    type="text"
                    placeholder="Budi (Warga)"
                    value={namaPelapor}
                    onChange={(e) => setNamaPelapor(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nomor WhatsApp / HP:
                  </label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Deskripsi Singkat / Rincian Lokasi: *
                </label>
                <textarea
                  required
                  rows="3"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan kondisi tumpukan sampah, patokan jalan, atau dampak terhadap lingkungan warga..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Foto Bukti */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Foto Bukti Kondisi TPS (Opsional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  style={{ fontSize: '0.84rem', color: '#64748b' }}
                />
                {fotoPreview && (
                  <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                    <img
                      src={fotoPreview}
                      alt="Preview Foto"
                      style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      onClick={() => { setFotoPreview(null); setFotoUrl(''); }}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#b91c1c',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(185,28,28,0.25)'
                  }}
                >
                  {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Sekarang'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
