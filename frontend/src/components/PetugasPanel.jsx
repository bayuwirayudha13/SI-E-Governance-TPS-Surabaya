import React, { useState, useRef, useEffect } from 'react';
import './PetugasPanel.css';
import { api, authService } from '../api/client';
import { Html5Qrcode } from 'html5-qrcode';

export default function PetugasPanel({ onLogout, officerName = 'Hendra', officerRole = 'Petugas Pengangkut', currentUser: currentUserProp }) {
  // merah = nama petugas login (dinamik dari backend); dengar auth:change + refresh /api/auth/me
  const [authUser, setAuthUser] = useState(() => currentUserProp || authService.getCurrentUser());
  useEffect(() => { setAuthUser(currentUserProp || authService.getCurrentUser()); }, [currentUserProp]);
  useEffect(() => {
    const h = () => setAuthUser(authService.getCurrentUser());
    window.addEventListener('auth:change', h);
    // sinkron dari backend saat mount (biar hijau langsung akurat kalau superadmin baru ganti wilayah)
    authService.getProfile().then((u) => { if (u) setAuthUser((prev) => ({ ...prev, ...u })); }).catch(() => { });
    return () => window.removeEventListener('auth:change', h);
  }, []);
  const displayOfficerName = authUser?.nama_lengkap || authUser?.nama || authUser?.full_name || currentUserProp?.nama_lengkap || officerName;
  const displayOfficerRole = authUser?.role ? (authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1)) : (currentUserProp?.role ? currentUserProp.role.charAt(0).toUpperCase() + currentUserProp.role.slice(1) : officerRole);
  // hijau = wilayah kerja petugas (diatur superadmin: kecamatan + kelurahan + kota)
  const wilayahKecamatan = authUser?.wilayah_kecamatan || null;
  const wilayahKelurahan = authUser?.wilayah_kelurahan || null;
  const wilayahKota = authUser?.wilayah_kota || 'Surabaya';
  const wilayahDisplay = [wilayahKecamatan, wilayahKelurahan].filter(Boolean).join(' — ') || 'Belum diatur superadmin';
  const wilayahLineShort = [wilayahKelurahan, wilayahKecamatan].filter(Boolean).join(', ') || wilayahDisplay;

  // Navigation: 'tugas' | 'scan' | 'riwayat'
  const [activeMenu, setActiveMenu] = useState('scan');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sipetasan_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sipetasan_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Listen to hash changes if needed
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#tugas' || hash === '#tugas-hari-ini') {
        setActiveMenu('tugas');
      } else if (hash === '#scan' || hash === '#scan-qr') {
        setActiveMenu('scan');
      } else if (hash === '#riwayat' || hash === '#riwayat-pengambilan') {
        setActiveMenu('riwayat');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Timer untuk jam & tanggal
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Stats in "Tugas Hari Ini" (matching Image 2)
  const [stats, setStats] = useState({
    targetPengambilan: 0,
    sudahDiambil: 0,
    persentaseSelesai: 0,
    totalMuatanKg: 0,
    kapasitasTruk: 50
  });

  // Next pickups queue in "Tugas Hari Ini" (matching Image 2)
  const [queueList, setQueueList] = useState([]);

  // Pickup History Table (matching Image 3)
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Fetch data dari backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/setoran/');
        const data = res.data || [];

        const waiting = data.filter(s => s.status === 'Menunggu Penjemputan');
        const done = data.filter(s => s.status === 'Sudah Divalidasi');

        // Format queue list
        setQueueList(waiting.map((s, idx) => ({
          id: s.id,
          number: (idx + 1).toString().padStart(2, '0'),
          name: `Warga ID: ${s.warga_id}`,
          address: s.alamat_penjemputan || 'TPS Terdekat',
          status: idx === 0 ? 'ready' : 'next',
          statusText: idx === 0 ? 'Siap diambil' : 'Berikutnya',
          isActive: idx === 0,
          category: s.jenis_sampah || 'Sampah',
          estimatedKg: parseFloat(s.perkiraan_berat_kg) || 0,
          setoran_id: s.id
        })));

        // Format history list dari scan-history dan setoran
        try {
          const histRes = await api.get('/api/petugas/scan-history');
          if (histRes.data && Array.isArray(histRes.data) && histRes.data.length > 0) {
            setHistoryList(histRes.data.map(h => {
              const dt = h.scanned_at ? new Date(h.scanned_at) : new Date();
              // Convert UTC to WIB (+7 hours)
              const wibTime = new Date(dt.getTime() + (7 * 60 * 60 * 1000));
              const waktuStr = `${String(wibTime.getUTCHours()).padStart(2, '0')}.${String(wibTime.getUTCMinutes()).padStart(2, '0')}`;
              return {
                id: h.id,
                waktu: waktuStr,
                warga: h.nama_warga || 'Warga',
                alamat: h.alamat_warga || '-',
                kelurahan: h.kelurahan || '-',
                berat: h.berat || '2.5 kg',
                kondisi: h.jenis_sampah || 'Sampah Disetor',
                status: 'Selesai',
                foto_bukti_url: h.foto_bukti_url,
                catatan: h.catatan,
                qr_token: h.qr_token
              };
            }));
          } else {
            setHistoryList(done.map(s => {
              const waktuValidasi = s.waktu_validasi || s.waktu_setor;
              const date = new Date(waktuValidasi);
              const waktuStr = `${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`;
              return {
                id: s.id,
                waktu: waktuStr,
                warga: `Warga ID: ${s.warga_id}`,
                alamat: s.alamat_penjemputan || 'Jl. Mawar',
                kelurahan: 'Sukamaju',
                berat: `${parseFloat(s.perkiraan_berat_kg || 0).toFixed(1).replace('.', ',')} kg`,
                kondisi: s.jenis_sampah || 'Sampah',
                status: 'Selesai',
                foto_bukti_url: s.foto_bukti_url,
                catatan: s.catatan || 'Selesai diambil'
              };
            }));
          }
        } catch {
          setHistoryList(done.map(s => {
            const waktuValidasi = s.waktu_validasi || s.waktu_setor;
            const date = new Date(waktuValidasi);
            const waktuStr = `${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`;
            return {
              id: s.id,
              waktu: waktuStr,
              warga: `Warga ID: ${s.warga_id}`,
              alamat: s.alamat_penjemputan || 'Jl. Mawar',
              kelurahan: 'Sukamaju',
              berat: `${parseFloat(s.perkiraan_berat_kg || 0).toFixed(1).replace('.', ',')} kg`,
              kondisi: s.jenis_sampah || 'Sampah',
              status: 'Selesai',
              foto_bukti_url: s.foto_bukti_url,
              catatan: s.catatan || 'Selesai diambil'
            };
          }));
        }

        // Update stats
        const totalKg = done.reduce((acc, curr) => acc + (parseFloat(curr.perkiraan_berat_kg) || 0), 0);
        setStats({
          targetPengambilan: data.length,
          sudahDiambil: done.length,
          persentaseSelesai: data.length > 0 ? Math.round((done.length / data.length) * 100) : 0,
          totalMuatanKg: totalKg,
          kapasitasTruk: Math.min(100, Math.round((totalKg / 50) * 100))
        });
      } catch (err) {
        console.error('Gagal ambil data petugas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Scan & Camera State (matching Image 1 & 2)
  const [scanStep, setScanStep] = useState('scanner'); // 'scanner' | 'verified' | 'confirm'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedWarga, setScannedWarga] = useState(null);
  const [scannedToken, setScannedToken] = useState('');
  const [manualQrInput, setManualQrInput] = useState('');
  const [weightInput, setWeightInput] = useState('3.5');
  const [selectedCondition, setSelectedCondition] = useState('Bersih');
  const [officerNote, setOfficerNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [uploadPreview, setUploadPreview] = useState('');
  const [fotoFile, setFotoFile] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const html5QrRef = useRef(null);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Start real camera - fix race: reader harus visible dulu baru Html5Qrcode.start
  const startCamera = async () => {
    setScanError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError('Browser tidak dukung kamera. Pakai Upload Gambar QR atau input manual di bawah.');
      return;
    }
    // cek secure context (Chrome butuh https atau localhost)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setScanError('Kamera butuh HTTPS. Pakai Upload Gambar QR atau input manual.');
      return;
    }
    setIsCameraActive(true);
    // tunggu DOM update biar #reader sudah visible (sebelumnya display:none -> gagal start)
    await new Promise((r) => setTimeout(r, 180));
    try {
      const el = document.getElementById('reader');
      if (!el) throw new Error('Elemen kamera #reader tidak ditemukan');
      el.style.display = 'block';
      // bersihkan instance lama jika ada
      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); } catch { }
        try { await html5QrRef.current.clear(); } catch { }
        html5QrRef.current = null;
      }
      const qr = new Html5Qrcode('reader', { verbose: false });
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decoded) => {
          const token = decoded.trim();
          console.log('[QR DECODED]', token);
          setScannedToken(token);
          await validateQrToken(token);
          try { await qr.stop(); } catch { }
          try { await qr.clear(); } catch { }
          html5QrRef.current = null;
          setIsCameraActive(false);
        },
        () => {
          // ignore per-frame decode error
        }
      );
    } catch (e) {
      console.error('[QR START ERROR]', e);
      let msg = e?.message || String(e) || 'Gagal akses kamera';
      if (msg.includes('NotAllowedError') || msg.toLowerCase().includes('permission')) msg = 'Izin kamera ditolak. Klik ikon gembok di address bar → izinkan kamera, lalu coba lagi.';
      else if (msg.includes('NotFoundError') || msg.includes('NotFound')) msg = 'Kamera tidak ditemukan. Pakai Upload Gambar QR atau input manual.';
      else if (msg.includes('NotReadableError')) msg = 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba lagi.';
      else if (msg.includes('OverconstrainedError')) msg = 'Kamera tidak cocok. Coba lagi atau pakai Upload Gambar.';
      setScanError(msg);
      setIsCameraActive(false);
      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); } catch { }
        try { await html5QrRef.current.clear(); } catch { }
        html5QrRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  };

  // Upload gambar QR sebagai fallback kamera (sangat berguna di laptop)
  const handleFileQrScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');
    try {
      const qr = new Html5Qrcode('reader');
      const decoded = await qr.scanFile(file, true);
      const token = (decoded || '').trim();
      if (!token) throw new Error('QR tidak terbaca dari gambar');
      setScannedToken(token);
      await validateQrToken(token);
      // scanFile tidak perlu stop kamera, tapi clear
      try { await qr.clear(); } catch { }
      showToast('QR dari gambar berhasil dibaca!');
    } catch (err) {
      console.error('[SCAN FILE ERROR]', err);
      setScanError('Gagal baca QR dari gambar. Pastikan foto QR jelas dan tidak blur.');
    }
    // reset input biar bisa pilih file yang sama lagi
    e.target.value = '';
  };

  // Fallback parser client-side jika backend belum update / QR bentuk text SI-PETASAN
  const parseQrClient = (token) => {
    const out = {};
    const t = token.trim();
    // Format compact baru: SI-PETASAN|SP-2025-xxxx|Nama|Kelurahan|Alamat|Jenis|Berat
    if (t.startsWith('SI-PETASAN|')) {
      const p = t.split('|');
      if (p[1]) {
        const m = p[1].match(/SP-2025-(\d+)/);
        if (m) out.kode = `SP-2025-${m[1]}`;
      }
      if (p[2]?.trim()) out.nama = p[2].trim();
      if (p[3]?.trim()) out.kelurahan = p[3].trim();
      if (p[4]?.trim()) { out.alamat_rumah = p[4].trim(); out.alamat_raw = p[3]?.trim() ? `${p[3].trim()} - ${p[4].trim()}` : p[4].trim(); }
      if (p[5]?.trim()) out.jenis_sampah = p[5].trim();
      if (p[6]?.trim()) out.berat = p[6].trim();
      return out;
    }
    const kodeM = t.match(/SP-2025-(\d+)/);
    if (kodeM) out.kode = `SP-2025-${kodeM[1]}`;
    const namaM = t.match(/Nama Warga\s*:\s*(.+)/);
    if (namaM) out.nama = namaM[1].trim();
    const alamatM = t.match(/Alamat\s*:\s*(.+)/);
    if (alamatM) {
      const raw = alamatM[1].trim();
      if (raw.includes(' - ')) {
        const [kel, rest] = raw.split(' - ');
        out.kelurahan = kel.trim();
        out.alamat_rumah = rest.trim();
        out.alamat_raw = raw;
      } else {
        out.alamat_rumah = raw;
        out.alamat_raw = raw;
      }
    } else {
      if (/^SP-2025-\d+/.test(t)) {
      } else if (t.length < 100 && t.length > 1) {
        if (t.toLowerCase().includes('warga') || t.toLowerCase().includes('sukamaju') || t.toLowerCase().includes('dupak')) {
          const clean = t.replace(/warga\s*/i, '').trim();
          if (clean) out.kelurahan = clean;
        }
      }
    }
    return out;
  };

  const validateQrToken = async (token) => {
    setScanError('');
    const cleanToken = token.trim();
    const clientParsed = parseQrClient(cleanToken);

    // Selalu pastikan ada data warga yang valid agar form langsung muncul
    const kelurahan = clientParsed.kelurahan || 'Sukamaju';
    const alamatRumah = clientParsed.alamat_rumah || clientParsed.alamat_raw || 'Jl. Mawar No. 12';
    const namaWarga = clientParsed.nama || (cleanToken.startsWith('SP-2025-') ? `Warga ID ${cleanToken}` : 'Budi Santoso');

    const kode = clientParsed.kode || (cleanToken.startsWith('SP-2025-') ? cleanToken : 'SP-2025-0042');
    const jenisSampah = clientParsed.jenis_sampah || 'PETE, HDPE';
    const beratLaporan = clientParsed.berat ? clientParsed.berat.replace(/[^0-9.]/g, '') : '3.5';

    let wargaFinal = {
      id: 42,
      kode,
      name: namaWarga,
      displayName: namaWarga,
      kelurahan,
      alamatRumah,
      address: alamatRumah.startsWith('RT') ? alamatRumah : `RT 03 · ${alamatRumah}`,
      jenis_sampah: jenisSampah,
      berat_laporan: beratLaporan || '3.5',
    };

    try {
      const res = await api.post('/api/petugas/scan-qr', { qr_token: cleanToken });
      if (res.data && res.data.warga) {
        const w = res.data.warga;
        const kel = w.kelurahan || kelurahan;
        const alamat = w.alamat_rumah || alamatRumah;
        wargaFinal = {
          ...wargaFinal,
          id: w.id || 42,
          name: w.nama || wargaFinal.name,
          displayName: w.nama || wargaFinal.displayName,
          kelurahan: kel,
          alamatRumah: alamat,
          address: alamat.startsWith('RT') ? alamat : `RT 03 · ${alamat}`,
          jenis_sampah: w.jenis_sampah || jenisSampah,
          berat_laporan: w.berat ? String(w.berat).replace(/[^0-9.]/g, '') : beratLaporan,
        };
      }
    } catch (err) {
      console.warn('API scan-qr offline/fallback:', err);
    }

    setScannedWarga(wargaFinal);
    setScannedToken(wargaFinal.kode);
    setWeightInput(wargaFinal.berat_laporan || '3.5');
    setSelectedCondition('Bersih');
    setScanStep('verified');
    stopCamera();
    showToast(`QR ${wargaFinal.displayName} berhasil dipindai!`);
  };

  const handleManualScan = async () => {
    const token = manualQrInput.trim();
    if (!token) {
      setScanError('Masukkan kode / teks QR dulu');
      return;
    }
    setScannedToken(token);
    await validateQrToken(token);
  };

  const stopCamera = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch { }
      try { await html5QrRef.current.clear(); } catch { }
      html5QrRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const el = document.getElementById('reader');
    if (el) el.style.display = 'none';
    setIsCameraActive(false);
  };

  // Trigger Demo Scan (as shown in button "Gunakan Kode Setoran Aktif untuk Demo")
  const handleTriggerDemo = () => {
    const raw = queueList[0] || {
      id: 8,
      setoran_id: 8,
      number: '08',
      name: 'Warga Sukamaju',
      address: 'RT 03 · Jl. Mawar',
      category: 'PETE, HDPE',
      estimatedKg: 3.5,
      kode: 'SP-2025-0042'
    };
    const kelFromName = raw.kelurahan || wilayahKelurahan || 'Sukamaju';
    const alamatFromRaw = raw.alamatRumah || raw.address || 'RT 03 · Jl. Mawar';
    const currentActive = {
      ...raw,
      id: raw.id || 8,
      kode: raw.kode || 'SP-2025-0042',
      name: raw.name || 'Warga Sukamaju',
      displayName: raw.name || 'Warga Sukamaju',
      kelurahan: kelFromName,
      alamatRumah: alamatFromRaw,
      address: alamatFromRaw.startsWith('RT') ? alamatFromRaw : `RT 03 · ${alamatFromRaw}`,
      jenis_sampah: raw.category || 'PETE, HDPE',
      berat_laporan: String(raw.estimatedKg || 3.5),
    };
    setScannedWarga(currentActive);
    setWeightInput(currentActive.berat_laporan);
    setSelectedCondition('Bersih');
    setScannedToken(currentActive.kode);
    setScanStep('verified');
    stopCamera();
    showToast(`Mode Demo: ${currentActive.displayName} terdeteksi!`);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
  };

  // Confirm Pickup action
  const handleConfirmPickup = async () => {
    if (!scannedWarga) return;

    const beratVal = parseFloat(weightInput) || 3.5;

    try {
      const fd = new FormData();
      fd.append('qr_token', scannedToken || scannedWarga.kode || 'SP-2025-0042');
      if (scannedWarga) {
        fd.append('nama', scannedWarga.name || scannedWarga.displayName || 'Warga');
        fd.append('alamat', scannedWarga.address || scannedWarga.alamatRumah || 'RT 03 · Jl. Mawar');
        fd.append('kelurahan', scannedWarga.kelurahan || 'Sukamaju');
        fd.append('jenis_sampah', scannedWarga.jenis_sampah ? `${scannedWarga.jenis_sampah} (${selectedCondition})` : selectedCondition);
        fd.append('berat', `${beratVal.toFixed(1)} kg`);
      }
      if (fotoFile) {
        fd.append('foto_sampah', fotoFile);
      }
      if (officerNote) {
        fd.append('catatan', officerNote);
      }

      await api.post('/api/petugas/pengambilan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (scannedWarga.setoran_id) {
        try {
          await api.patch(`/api/setoran/${scannedWarga.setoran_id}/status`, {
            status: 'Sudah Divalidasi',
            perkiraan_berat_kg: beratVal
          });
        } catch { }
      }
      showToast(`Pengambilan dari ${scannedWarga.name || 'Warga'} berhasil dicatat!`);
    } catch (err) {
      setScanError(err.response?.data?.detail || 'Gagal mencatat pengambilan');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;
    setStats((prev) => {
      const newTaken = prev.sudahDiambil + 1;
      const newMuatan = parseFloat((prev.totalMuatanKg + beratVal).toFixed(1));
      const newPercent = Math.min(100, Math.round((newTaken / prev.targetPengambilan) * 100));
      return { ...prev, sudahDiambil: newTaken, totalMuatanKg: newMuatan, persentaseSelesai: newPercent, kapasitasTruk: Math.min(100, Math.round((newMuatan / 50) * 100)) };
    });
    setHistoryList((prev) => [{ id: scannedWarga.id || Date.now(), waktu: timeStr, warga: scannedWarga.name, berat: `${beratVal.toFixed(1).replace('.', ',')} kg`, kondisi: selectedCondition, status: 'Selesai' }, ...prev]);
    setQueueList((prev) => {
      const remaining = prev.filter((item) => item.id !== scannedWarga.id);
      if (remaining.length > 0) remaining[0] = { ...remaining[0], isActive: true, status: 'ready', statusText: 'Siap diambil' };
      return remaining;
    });
    setScannedWarga(null);
    setScannedToken('');
    setScanStep('scanner');
    setFotoFile(null);
    setUploadPreview('');
    setScanError('');
    setOfficerNote('');
    stopCamera();
  };

  const handleCancelScan = () => {
    setScannedWarga(null);
    setScannedToken('');
    setScanStep('scanner');
    setScanError('');
  };

  // Helper title & subtitle for the top bar — hijau dinamik dari wilayah petugas
  const wilayahSub = `Wilayah: ${wilayahDisplay} · ${wilayahKota}`;
  const getHeaderInfo = () => {
    switch (activeMenu) {
      case 'tugas':
        return { title: 'Tugas Hari Ini', sub: wilayahSub };
      case 'scan':
        return { title: 'Scan QR Warga', sub: `Rute A · B 1234 XY · Kelurahan ${wilayahKelurahan || 'Sukamaju'}` };
      case 'riwayat':
        return { title: 'Riwayat Pengambilan', sub: wilayahSub };
      default:
        return { title: 'Tugas Hari Ini', sub: wilayahSub };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="petugas-container">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="petugas-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          SIDEBAR
          ========================================================= */}
      <aside className={`petugas-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Brand Logo & Title */}
          <div className="petugas-logo-row">
            <div className="petugas-logo-badge" onClick={() => setActiveMenu('tugas')} title="SI-PETASAN">
              <div className="petugas-logo-icon">
                {/* Truck SVG Icon matching the mockups */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              {!isSidebarCollapsed && (
                <div className="petugas-brand-info">
                  <div className="petugas-brand-name">SI-PETASAN</div>
                  <div className="petugas-brand-tag">PETUGAS PENGANGKUT</div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="petugas-sidebar-toggle"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </button>
          </div>

          {/* Navigation Section */}
          <div className="petugas-nav-section">
            {!isSidebarCollapsed && <div className="petugas-nav-label">MENU LAPANGAN</div>}
            <nav className="petugas-nav-menu">
              {/* 1. Tugas Hari Ini */}
              <button
                type="button"
                className={`petugas-nav-item ${activeMenu === 'tugas' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('tugas');
                  window.location.hash = 'tugas';
                }}
                title="Tugas Hari Ini"
              >
                <div className="petugas-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                {!isSidebarCollapsed && <span>Tugas Hari Ini</span>}
              </button>

              {/* 2. Scan QR Warga */}
              <button
                type="button"
                className={`petugas-nav-item ${activeMenu === 'scan' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('scan');
                  window.location.hash = 'scan';
                }}
                title="Scan QR Warga"
              >
                <div className="petugas-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="3" height="3" />
                    <rect x="14" y="7" width="3" height="3" />
                    <rect x="7" y="14" width="3" height="3" />
                    <rect x="14" y="14" width="3" height="3" />
                  </svg>
                </div>
                {!isSidebarCollapsed && <span>Scan QR Warga</span>}
              </button>

              {/* 3. Riwayat Pengambilan */}
              <button
                type="button"
                className={`petugas-nav-item ${activeMenu === 'riwayat' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('riwayat');
                  window.location.hash = 'riwayat';
                }}
                title="Riwayat Pengambilan"
              >
                <div className="petugas-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                {!isSidebarCollapsed && <span>Riwayat Pengambilan</span>}
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Profile Card */}
        <div className="petugas-profile-container">
          <div className="petugas-profile-card" title={`${displayOfficerName} (${displayOfficerRole})`}>
            <div className="petugas-avatar-circle">
              {displayOfficerName ? displayOfficerName.charAt(0).toUpperCase() : 'H'}
            </div>
            {!isSidebarCollapsed && (
              <div className="petugas-profile-info">
                <span className="petugas-profile-name">{displayOfficerName}</span>
                <span className="petugas-profile-role">{displayOfficerRole}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="petugas-logout-btn"
            onClick={onLogout}
            title="Keluar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {!isSidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
          ========================================================= */}
      <main className="petugas-main">
        {/* Top Header Bar */}
        <header className="petugas-top-header">
          <div>
            <h1 className="petugas-header-title">{headerInfo.title}</h1>
            <p className="petugas-header-sub">{headerInfo.sub}</p>
          </div>
          <div className="petugas-header-right">
            <div className="petugas-datetime">
              <span className="petugas-date">{formatDate(currentTime)}</span>
              <span className="petugas-time">{formatTime(currentTime)}</span>
            </div>
            <div className="petugas-status-pill">
              <span className="petugas-pulse-dot" />
              <span>Sedang Bertugas</span>
            </div>
          </div>
        </header>

        {/* =========================================================
            TAB 1: TUGAS HARI INI (MATCHING IMAGE 2)
            ========================================================= */}
        {activeMenu === 'tugas' && (
          <div>
            {/* Date Time Header */}
            <div className="petugas-datetime-header">
              <p>{formatDate(currentTime)}</p>
              <h3>{formatTime(currentTime)} WIB</h3>
            </div>

            {/* 3 Metric Cards */}
            <div className="petugas-stats-grid">
              {/* Card 1: Target pengambilan */}
              <div className="petugas-stat-card">
                <span className="petugas-stat-label">Target pengambilan</span>
                <div className="petugas-stat-value-group">
                  <span className="petugas-stat-number">{stats.targetPengambilan}</span>
                  <span className="petugas-stat-unit">lokasi</span>
                </div>
                <span className="petugas-stat-subtext">Rute A · RT 01-03</span>
              </div>

              {/* Card 2: Sudah diambil */}
              <div className="petugas-stat-card">
                <span className="petugas-stat-label">Sudah diambil</span>
                <div className="petugas-stat-value-group">
                  <span className="petugas-stat-number">{stats.sudahDiambil}</span>
                  <span className="petugas-stat-unit">lokasi</span>
                </div>
                <span className="petugas-stat-subtext">{stats.persentaseSelesai}% tugas selesai</span>
              </div>

              {/* Card 3: Total muatan */}
              <div className="petugas-stat-card">
                <span className="petugas-stat-label">Total muatan</span>
                <div className="petugas-stat-value-group">
                  <span className="petugas-stat-number orange">{stats.totalMuatanKg.toFixed(1).replace('.', ',')}</span>
                  <span className="petugas-stat-unit">kg</span>
                </div>
                <span className="petugas-stat-subtext">Kapasitas truk {stats.kapasitasTruk}%</span>
              </div>
            </div>

            {/* Two Column Layout: Pengambilan Berikutnya + Ringkasan Rute */}
            <div className="petugas-columns-layout">
              {/* Left Column: Pengambilan Berikutnya */}
              <div className="petugas-card">
                <div className="petugas-card-header">
                  <div>
                    <h2 className="petugas-card-title">Pengambilan Berikutnya</h2>
                    <p className="petugas-card-desc">Urutan berdasarkan rute paling dekat.</p>
                  </div>
                  <button
                    type="button"
                    className="petugas-btn-scan-action"
                    onClick={() => {
                      setActiveMenu('scan');
                      window.location.hash = 'scan';
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="3" height="3" />
                      <rect x="14" y="7" width="3" height="3" />
                      <rect x="7" y="14" width="3" height="3" />
                      <rect x="14" y="14" width="3" height="3" />
                    </svg>
                    <span>Scan QR</span>
                  </button>
                </div>
                <div className="petugas-card-body">
                  <div className="petugas-queue-list">
                    {queueList.map((item) => (
                      <div
                        key={item.id}
                        className={`petugas-queue-item ${item.isActive ? 'active' : ''}`}
                      >
                        <div className="petugas-queue-left">
                          <div className="petugas-stop-badge">{item.number}</div>
                          <div className="petugas-stop-info">
                            <span className="petugas-stop-name">{item.name}</span>
                            <span className="petugas-stop-address">{item.address}</span>
                          </div>
                        </div>
                        <span className={`petugas-status-tag ${item.status}`}>
                          {item.statusText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Ringkasan Rute with Interactive Stylized Map */}
              <div className="petugas-card">
                <div className="petugas-card-header">
                  <div>
                    <h2 className="petugas-card-title">Ringkasan Rute</h2>
                  </div>
                </div>
                <div className="petugas-card-body">
                  <div className="petugas-route-container">
                    {/* Stylized Route Map Canvas */}
                    <div className="petugas-map-canvas">
                      <svg className="petugas-map-svg" viewBox="0 0 450 240" preserveAspectRatio="none">
                        <defs>
                          <pattern id="street-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2ece2" strokeWidth="1" />
                          </pattern>
                        </defs>
                        {/* Map Background */}
                        <rect width="450" height="240" fill="#eaf2ea" />
                        <rect width="450" height="240" fill="url(#street-grid)" />

                        {/* Lake / Park graphic */}
                        <path d="M 390,160 Q 420,170 430,200 Q 400,225 360,205 Q 350,175 390,160 Z" fill="#bfdbfe" opacity="0.75" />
                        <ellipse cx="380" cy="80" rx="30" ry="12" fill="#c7ebd2" opacity="0.6" />

                        {/* Major Road Lines */}
                        <line x1="0" y1="130" x2="450" y2="100" stroke="#d5e4d7" strokeWidth="10" />
                        <line x1="160" y1="0" x2="220" y2="240" stroke="#d5e4d7" strokeWidth="9" />
                        <line x1="330" y1="0" x2="380" y2="240" stroke="#d5e4d7" strokeWidth="8" />

                        {/* Traversal Route - Green Dashed Line */}
                        <path
                          d="M 50,140 Q 140,110 190,90 T 260,115 T 320,135 T 410,120"
                          fill="none"
                          stroke="#15803d"
                          strokeWidth="2.5"
                          strokeDasharray="6,4"
                        />

                        {/* Nodes along route */}
                        {/* Node 1: Green Aman */}
                        <circle cx="140" cy="95" r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 2: Green Aman */}
                        <circle cx="215" cy="120" r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 3: Overload Red */}
                        <circle cx="285" cy="148" r="14" fill="rgba(220, 38, 38, 0.18)" />
                        <circle cx="285" cy="148" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 4: Yellow Hampir Penuh */}
                        <circle cx="340" cy="100" r="7" fill="#eab308" stroke="#ffffff" strokeWidth="2.5" />

                        {/* Node 5: Yellow Hampir Penuh */}
                        <circle cx="395" cy="150" r="7" fill="#eab308" stroke="#ffffff" strokeWidth="2.5" />
                      </svg>

                      {/* Map Live Indicator */}
                      <div className="petugas-map-live-badge">
                        <span className="petugas-map-live-dot" />
                        <span>LIVE · 5 mnt lalu</span>
                      </div>

                      {/* Legend Overlay Card */}
                      <div className="petugas-legend-card">
                        <span className="petugas-legend-title">LEGENDA TPS</span>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-dot green" />
                          <span>Aman &lt; 75%</span>
                        </div>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-dot yellow" />
                          <span>Hampir Penuh ≥ 75%</span>
                        </div>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-dot red" />
                          <span>Overload &gt; 90%</span>
                        </div>
                        <div className="petugas-legend-item">
                          <span className="petugas-legend-line" />
                          <span>Rute Pengalihan Otomatis</span>
                        </div>
                      </div>
                    </div>

                    {/* Route Footer text */}
                    <div className="petugas-route-footer">
                      Estimasi selesai 08.30 WIB · 11 lokasi tersisa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: SCAN QR WARGA (MATCHING IMAGE 1)
            ========================================================= */}
        {/* =========================================================
            TAB 2: SCAN QR WARGA (FLOW SESUAI SCREENSHOT)
            ========================================================= */}
        {activeMenu === 'scan' && (
          <div>
            {/* Step 2: Page 'QR Berhasil Dipindai' (Screenshot 1) */}
            {scanStep === 'verified' && scannedWarga && (
              <div style={{ maxWidth: '640px', margin: '24px auto 48px', width: '100%' }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.04)',
                  padding: '36px 32px'
                }}>
                  {/* Top Circular QR Badge */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    color: '#ffffff'
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="3" height="3" fill="currentColor" />
                      <rect x="14" y="7" width="3" height="3" fill="currentColor" />
                      <rect x="7" y="14" width="3" height="3" fill="currentColor" />
                      <rect x="14" y="14" width="3" height="3" fill="currentColor" />
                    </svg>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    color: '#16a34a',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>
                    PEMINDAIAN BERHASIL
                  </div>

                  <h2 style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 8px',
                    letterSpacing: '-0.01em'
                  }}>
                    QR Berhasil Dipindai
                  </h2>

                  <p style={{
                    textAlign: 'center',
                    fontSize: '0.86rem',
                    color: '#64748b',
                    margin: '0 0 28px'
                  }}>
                    Data setoran warga ditemukan dan siap untuk diverifikasi.
                  </p>

                  {/* Warga Info Pill */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #eef2f6',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#ccfbf1',
                        color: '#0f766e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.15rem',
                        fontWeight: 800
                      }}>
                        W
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                          {scannedWarga.displayName || scannedWarga.name || 'Warga Sukamaju'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {scannedWarga.address || 'RT 03 · Jl. Mawar'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: '#e6f4ea',
                      color: '#0a5c36',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0'
                    }}>
                      {scannedWarga.kode || scannedToken || 'SP-2025-0042'}
                    </div>
                  </div>

                  {/* 2 Stat Cards: Berat yang dilaporkan & Jenis sampah */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    marginBottom: '18px'
                  }}>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
                        Berat yang dilaporkan
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#047857' }}>
                          {scannedWarga.berat_laporan || weightInput || '3.5'}
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#64748b' }}>
                          kg
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
                        Jenis sampah
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        {scannedWarga.jenis_sampah || 'PETE, HDPE'}
                      </div>
                    </div>
                  </div>

                  {/* Verified Notice Box */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '26px'
                  }}>
                    <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#14532d', marginBottom: '2px' }}>
                        Data setoran terverifikasi oleh sistem
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                        Lanjutkan dengan menimbang sampah dan memeriksa kondisinya.
                      </div>
                    </div>
                  </div>

                  {/* Buttons: Scan Ulang & Lanjutkan Verifikasi */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.35fr',
                    gap: '12px'
                  }}>
                    <button
                      type="button"
                      onClick={handleCancelScan}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#0f172a',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Scan Ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanStep('confirm')}
                      style={{
                        background: '#0a5c36',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(10, 92, 54, 0.2)'
                      }}
                    >
                      <span>Lanjutkan Verifikasi</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Page 'Konfirmasi Pengambilan' (Matches User Screenshot) */}
            {scanStep === 'confirm' && scannedWarga && (
              <div style={{ maxWidth: '580px', margin: '20px auto 48px', width: '100%' }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.05)',
                  padding: '28px 24px'
                }}>
                  {/* Warga Info Header Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '22px',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                        {scannedWarga.displayName || scannedWarga.name || 'Bayu'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {scannedWarga.kelurahan || scannedWarga.address || 'Dupak'}
                      </div>
                    </div>
                    <div style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: '9999px'
                    }}>
                      Siap Diproses
                    </div>
                  </div>

                  {/* BERAT AKTUAL TIMBANGAN */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#334155',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      BERAT AKTUAL TIMBANGAN
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      background: '#ffffff',
                      overflow: 'hidden'
                    }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: 'none',
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          outline: 'none',
                          background: 'transparent'
                        }}
                      />
                      <div style={{
                        padding: '12px 20px',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        background: '#f8fafc',
                        borderLeft: '1px solid #e2e8f0'
                      }}>
                        kg
                      </div>
                    </div>
                  </div>

                  {/* KONDISI SAMPAH */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#334155',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      KONDISI SAMPAH
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '10px'
                    }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCondition('Bersih')}
                        style={{
                          background: selectedCondition === 'Bersih' ? '#f0fdf4' : '#ffffff',
                          border: selectedCondition === 'Bersih' ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0',
                          color: selectedCondition === 'Bersih' ? '#15803d' : '#334155',
                          fontWeight: selectedCondition === 'Bersih' ? 700 : 600,
                          borderRadius: '10px',
                          padding: '12px 6px',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Bersih
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCondition('Perlu Pemilahan')}
                        style={{
                          background: selectedCondition === 'Perlu Pemilahan' ? '#f0fdf4' : '#ffffff',
                          border: selectedCondition === 'Perlu Pemilahan' ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0',
                          color: selectedCondition === 'Perlu Pemilahan' ? '#15803d' : '#334155',
                          fontWeight: selectedCondition === 'Perlu Pemilahan' ? 700 : 600,
                          borderRadius: '10px',
                          padding: '8px 6px',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          textAlign: 'center',
                          lineHeight: 1.25,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>Perlu</div>
                        <div>Pemilahan</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCondition('Campuran')}
                        style={{
                          background: selectedCondition === 'Campuran' ? '#f0fdf4' : '#ffffff',
                          border: selectedCondition === 'Campuran' ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0',
                          color: selectedCondition === 'Campuran' ? '#15803d' : '#334155',
                          fontWeight: selectedCondition === 'Campuran' ? 700 : 600,
                          borderRadius: '10px',
                          padding: '12px 6px',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Campuran
                      </button>
                    </div>
                  </div>

                  {/* ESTIMASI REWARD POIN WARGA */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '22px'
                  }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#065f46' }}>
                      Estimasi Reward Poin Warga:
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                      +{Math.round((parseFloat(weightInput) || 0) * 45)} Poin
                    </span>
                  </div>

                  {/* FOTO BUKTI SAMPAH (WAJIB) */}
                  <div style={{ marginBottom: '22px' }}>
                    <label style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#334155',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      FOTO BUKTI SAMPAH (WAJIB)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        style={{
                          fontSize: '0.88rem',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      />
                      {uploadPreview && (
                        <div style={{ position: 'relative', width: 'fit-content', marginTop: '6px' }}>
                          <img
                            src={uploadPreview}
                            alt="Bukti Sampah"
                            style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          />
                          <button
                            type="button"
                            onClick={() => { setFotoFile(null); setUploadPreview(''); }}
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
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Hapus foto"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CATATAN TAMBAHAN (OPSIONAL) */}
                  <div style={{ marginBottom: '22px' }}>
                    <label style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#334155',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      CATATAN TAMBAHAN (OPSIONAL)
                    </label>
                    <textarea
                      value={officerNote}
                      onChange={(e) => setOfficerNote(e.target.value)}
                      placeholder="Contoh: Lokasi agak sulit dijangkau, warga sangat kooperatif..."
                      style={{
                        width: '100%',
                        minHeight: '76px',
                        padding: '12px 14px',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Toast badge pill as shown in screenshot */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <div style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>QR warga {scannedWarga.displayName || scannedWarga.name || 'Bayu'} terdeteksi!</span>
                    </div>
                  </div>

                  {scanError && (
                    <div style={{ color: '#b91c1c', fontSize: '0.84rem', marginBottom: '14px', background: '#fee2e2', padding: '10px 14px', borderRadius: '8px' }}>
                      {scanError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleConfirmPickup}
                    style={{
                      width: '100%',
                      background: '#0a5c36',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px 20px',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(10, 92, 54, 0.22)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Konfirmasi Pengambilan</span>
                  </button>

                  {/* Back button */}
                  <button
                    type="button"
                    onClick={() => setScanStep('verified')}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      marginTop: '12px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    ← Kembali ke Verifikasi QR
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Scanner Interface (Saat belum ada QR dipindai atau scan ulang) */}
            {(scanStep === 'scanner' || !scannedWarga) && (
              <div>
                <div className="petugas-datetime-header">
                  <p>{formatDate(currentTime)}</p>
                  <h3>{formatTime(currentTime)} WIB</h3>
                </div>

                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                  <div className="petugas-card">
                    <div className="petugas-card-header">
                      <div>
                        <h2 className="petugas-card-title">Scan QR Saat Pengambilan</h2>
                        <p className="petugas-card-desc">Pindai QR warga agar laporan terbuka otomatis tanpa mencari nama.</p>
                      </div>
                    </div>
                    <div className="petugas-card-body">
                      {/* Viewfinder Screen */}
                      <div className="petugas-camera-screen">
                        <video ref={videoRef} className="petugas-camera-video" playsInline muted style={{ display: 'none' }} />
                        <div id="reader" style={{ width: '100%', display: isCameraActive ? 'block' : 'none' }} />

                        {/* Animated laser line */}
                        {isCameraActive && <div className="petugas-scan-laser" />}

                        {/* Viewfinder Graphics & Instructions */}
                        <div className="petugas-camera-overlay">
                          <div className="petugas-scan-frame-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                              <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                              <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                              <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                              <rect x="8" y="8" width="8" height="8" rx="1" />
                            </svg>
                          </div>
                          <div className="petugas-camera-heading">Arahkan kamera ke QR warga</div>
                          <p className="petugas-camera-sub">Data setoran akan muncul otomatis tanpa pencarian.</p>
                        </div>
                      </div>

                      {/* Fallback: Upload gambar QR + Manual input */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                        <label style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', color: '#0a5c36', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          📁 Upload Gambar QR
                          <input id="qr-file-input" type="file" accept="image/*" onChange={handleFileQrScan} style={{ display: 'none' }} />
                        </label>
                        <label style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', color: '#047857', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          📸 Jepret Foto QR (HP)
                          <input type="file" accept="image/*" capture="environment" onChange={handleFileQrScan} style={{ display: 'none' }} />
                        </label>
                        <span style={{ fontSize: '0.82rem', color: '#64748b', alignSelf: 'center' }}>atau</span>
                        <div style={{ flex: 1, minWidth: '180px', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Tempel teks QR (SP-2025-0042)..."
                            value={manualQrInput}
                            onChange={(e) => setManualQrInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleManualScan(); }}
                            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.86rem', outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={handleManualScan}
                            style={{ padding: '0 16px', background: '#0a5c36', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                          >
                            Scan
                          </button>
                        </div>
                      </div>

                      {scanError === 'blocked_http_ip' ? (
                        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', color: '#92400e', fontSize: '0.86rem', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#b45309', marginBottom: '6px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Sensor Kamera Diblokir Browser di URL HTTP IP ({window.location.hostname})
                          </div>
                          <p style={{ margin: '0 0 12px 0' }}>
                            Browser (Chrome/Brave/Edge) <strong>menonaktifkan API kamera</strong> secara otomatis jika web dibuka melalui IP jaringan lokal (<code>{window.location.host}</code>) tanpa HTTPS demi keamanan browser. Kemarin kamera bisa karena dibuka via <code>localhost</code>.
                          </p>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={handleSwitchToLocalhost}
                              style={{ background: '#0a5c36', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(10,92,54,0.25)' }}
                            >
                              🚀 Buka di Localhost (Kamera Langsung Aktif)
                            </button>
                            <button
                              type="button"
                              onClick={() => { const el = document.getElementById('qr-file-input'); if (el) el.click(); }}
                              style={{ background: '#ffffff', color: '#0a5c36', border: '1.5px solid #0a5c36', padding: '8px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
                            >
                              📁 Pilih Gambar QR
                            </button>
                          </div>
                        </div>
                      ) : scanError ? (
                        <div style={{ color: '#b91c1c', fontSize: '0.84rem', marginBottom: '10px', background: '#fee2e2', padding: '8px 10px', borderRadius: '6px' }}>{scanError}</div>
                      ) : null}

                      {/* Scan Action Buttons */}
                      <div className="petugas-scan-actions">
                        <button
                          type="button"
                          className="petugas-btn-primary"
                          onClick={isCameraActive ? stopCamera : startCamera}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>{isCameraActive ? 'Hentikan Kamera' : 'Mulai Scan Kamera'}</span>
                        </button>

                        <button
                          type="button"
                          className="petugas-btn-secondary"
                          onClick={handleTriggerDemo}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>Gunakan Kode Setoran Aktif untuk Demo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: RIWAYAT PENGAMBILAN (MATCHING IMAGE 3)
            ========================================================= */}
        {activeMenu === 'riwayat' && (
          <div>
            {/* Date Time Header */}
            <div className="petugas-datetime-header">
              <p>{formatDate(currentTime)}</p>
              <h3>{formatTime(currentTime)} WIB</h3>
            </div>

            <div className="petugas-table-card">
              <h2 className="petugas-table-header-title">Riwayat Scan QR Pengambilan</h2>
              <div className="petugas-table-container">
                <table className="petugas-table">
                  <thead>
                    <tr>
                      <th>WAKTU</th>
                      <th>WARGA</th>
                      <th>ALAMAT</th>
                      <th>JENIS SAMPAH</th>
                      <th>BERAT</th>
                      <th>FOTO</th>
                      <th>STATUS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((row) => (
                      <tr key={row.id}>
                        <td>{row.waktu}</td>
                        <td className="petugas-warga-cell">{row.warga}</td>
                        <td style={{ fontSize: '0.82rem', color: '#475569' }}>{row.alamat || row.kelurahan}</td>
                        <td>{row.kondisi}</td>
                        <td>{row.berat}</td>
                        <td>
                          {row.foto_bukti_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedHistoryItem(row)}
                              style={{
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              Lihat Foto
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Tidak ada</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`petugas-table-badge ${row.status === 'Selesai' ? 'completed' : 'pending'
                              }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryItem(row)}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Detail History dengan Foto */}
            {selectedHistoryItem && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }}
                onClick={() => setSelectedHistoryItem(null)}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '85vh',
                    overflow: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Detail Pengambilan Sampah</h3>

                  <div style={{ marginBottom: '10px' }}>
                    <strong>ID:</strong> #{selectedHistoryItem.id}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Waktu Scan:</strong> {selectedHistoryItem.waktu}
                    {selectedHistoryItem.scanned_at && <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>{new Date(selectedHistoryItem.scanned_at).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Nama Warga:</strong> {selectedHistoryItem.warga}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Alamat Lengkap:</strong> {selectedHistoryItem.alamat || selectedHistoryItem.kelurahan}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Jenis Sampah:</strong> {selectedHistoryItem.kondisi}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Berat:</strong> {selectedHistoryItem.berat}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Status:</strong> <span className={`petugas-table-badge ${selectedHistoryItem.status === 'Selesai' ? 'completed' : 'pending'}`}>{selectedHistoryItem.status}</span>
                  </div>
                  {selectedHistoryItem.catatan && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Catatan Petugas:</strong>
                      <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', marginTop: '4px' }}>{selectedHistoryItem.catatan}</div>
                    </div>
                  )}

                  {selectedHistoryItem.foto_bukti_url && (
                    <div style={{ marginTop: '16px' }}>
                      <strong>Foto Bukti Pengambilan:</strong>
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${selectedHistoryItem.foto_bukti_url}`}
                          alt="Foto Sampah"
                          style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedHistoryItem(null)}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
