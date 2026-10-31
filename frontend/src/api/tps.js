import { api } from './client.js';

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Normalize one TPS record from the public API.
 * TPS records are retained even when their coordinates are missing or invalid.
 */
function normalizeTpsData(backendTps) {
  if (!backendTps) return null;

  const rawLat = toOptionalNumber(backendTps.latitude);
  const rawLng = toOptionalNumber(backendTps.longitude);
  const hasValidCoordinates =
    rawLat !== null &&
    rawLng !== null &&
    rawLat >= -8.0 && rawLat <= -7.0 &&
    rawLng >= 112.0 && rawLng <= 113.0;

  const latitude = hasValidCoordinates ? rawLat : null;
  const longitude = hasValidCoordinates ? rawLng : null;
  const dayaTampungM3 = toOptionalNumber(backendTps.daya_tampung_m3);
  const isInactive = backendTps.status !== 'Aktif';

  return {
    id: backendTps.id,
    nama: backendTps.nama,
    nama_lama: backendTps.nama_lama ?? null,
    lokasi: backendTps.lokasi || backendTps.kecamatan || '-',
    kecamatan: backendTps.kecamatan || '-',
    wilayahKota: backendTps.wilayah_kota || '-',
    kelurahan: backendTps.lokasi || '',
    kelurahanList: backendTps.lokasi ? [backendTps.lokasi] : [],
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
    hasValidCoordinates,
    jenisTps: backendTps.jenis_tps ?? null,
    jumlahContainer: backendTps.jumlah_container ?? null,
    dayaTampungM3,
    kapasitasM3: dayaTampungM3,
    status: backendTps.status,
    // Occupancy is not present in the current backend schema; do not fabricate it.
    statusColor: isInactive ? 'gray' : null,
    statusText: isInactive ? 'Nonaktif' : 'Data keterisian belum tersedia',
    dotColor: isInactive ? '#94a3b8' : '#64748b',
    capacity: null,
    kapasitasPersen: null,
    jamOperasional: null,
    terakhirUpdate: backendTps.tanggal_update || null,
    tanggal_update: backendTps.tanggal_update || null,
    catatan: backendTps.catatan || null,
    sumber_data: backendTps.sumber_data || null
  };
}

/** Fetch all active public TPS records from MySQL through the public API. */
export async function fetchPublicTps() {
  try {
    const response = await api.get('/api/tps/public');

    if (Array.isArray(response.data)) {
      return response.data
        .map(normalizeTpsData)
        .filter((tps) => tps !== null);
    }

    return [];
  } catch (error) {
    console.error('Error fetching public TPS:', error);
    return null;
  }
}

/** Fetch public TPS and filter by the supplied kelurahan/location text. */
export async function fetchTpsByKelurahan(kelurahanName) {
  try {
    const allTps = await fetchPublicTps();
    if (!Array.isArray(allTps) || allTps.length === 0) return [];

    const query = String(kelurahanName || '').toLowerCase();
    return allTps.filter((tps) => {
      if (tps.lokasi && tps.lokasi.toLowerCase().includes(query)) return true;
      return tps.kelurahanList.some((name) => name.toLowerCase().includes(query));
    });
  } catch (error) {
    console.error('Error fetching TPS by kelurahan:', error);
    return [];
  }
}
