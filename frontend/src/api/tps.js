import { api } from './client.js';

/**
 * Normalize backend TPS data to frontend format
 */
function normalizeTpsData(backendTps) {
  if (!backendTps || !backendTps.latitude || !backendTps.longitude) {
    return null;
  }

  const lat = parseFloat(backendTps.latitude);
  const lng = parseFloat(backendTps.longitude);

  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    return null;
  }

  // Validate Surabaya range
  if (lat < -8.0 || lat > -7.0 || lng < 112.0 || lng > 113.0) {
    return null;
  }

  // Mock capacity percentage since backend doesn't provide it yet
  const capacity = Math.floor(Math.random() * 60) + 30;
  
  const isInactive = backendTps.status !== 'Aktif';
  const statusColor = isInactive ? 'gray' : capacity >= 90 ? 'red' : capacity >= 75 ? 'yellow' : 'green';
  const statusText = isInactive ? 'Nonaktif' : capacity >= 90 ? 'Overload' : capacity >= 75 ? 'Waspada' : 'Aman';
  const dotColor = isInactive ? '#94a3b8' : capacity >= 90 ? '#ef4444' : capacity >= 75 ? '#f59e0b' : '#10b981';

  return {
    id: backendTps.id,
    nama: backendTps.nama,
    nama_lama: backendTps.nama_lama || null,
    lokasi: backendTps.lokasi || backendTps.kecamatan,
    kecamatan: backendTps.kecamatan,
    wilayahKota: backendTps.wilayah_kota,
    kelurahan: backendTps.lokasi || '',
    kelurahanList: backendTps.lokasi ? [backendTps.lokasi] : [],
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    jenisTps: backendTps.jenis_tps || 'TPS Reguler',
    jumlahContainer: backendTps.jumlah_container || 'Data belum tersedia',
    dayaTampungM3: backendTps.daya_tampung_m3 || 0,
    kapasitasM3: backendTps.daya_tampung_m3 || 0,
    status: backendTps.status,
    statusColor,
    statusText,
    dotColor,
    capacity,
    kapasitasPersen: capacity,
    jamOperasional: '06:00 - 18:00 WIB',
    terakhirUpdate: backendTps.tanggal_update || 'Baru saja',
    tanggal_update: backendTps.tanggal_update,
    catatan: backendTps.catatan || null,
    sumber_data: backendTps.sumber_data || 'Data DLH'
  };
}

/**
 * Fetch active public TPS data from backend
 * No authentication required
 */
export async function fetchPublicTps() {
  try {
    const response = await api.get('/api/tps/public');
    
    if (response.data && Array.isArray(response.data)) {
      // Normalize and filter out invalid entries
      const normalized = response.data
        .map(normalizeTpsData)
        .filter(tps => tps !== null);
      
      return normalized;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching public TPS:', error);
    return null;
  }
}

/**
 * Fetch TPS by kelurahan name
 * Filters normalized data by lokasi field
 */
export async function fetchTpsByKelurahan(kelurahanName) {
  try {
    const allTps = await fetchPublicTps();
    
    if (!allTps || allTps.length === 0) {
      return [];
    }
    
    // Filter by lokasi or check kelurahanList
    const filtered = allTps.filter(tps => {
      if (tps.lokasi && tps.lokasi.toLowerCase().includes(kelurahanName.toLowerCase())) {
        return true;
      }
      if (tps.kelurahanList && tps.kelurahanList.length > 0) {
        return tps.kelurahanList.some(k => k.toLowerCase().includes(kelurahanName.toLowerCase()));
      }
      return false;
    });
    
    return filtered;
  } catch (error) {
    console.error('Error fetching TPS by kelurahan:', error);
    return [];
  }
}
