import { api } from './client.js';

/**
 * Fetch all TPS data for dashboard statistics and admin panels
 * Requires authentication, returns all TPS (active and inactive)
 */
export const fetchAllTps = async (retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await api.get('/api/tps/');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      console.warn('API response does not contain array of TPS:', response);
      return [];
    } catch (error) {
      console.error(`Error fetching all TPS (attempt ${attempt + 1}/${retries}):`, error.message);
      
      // If 401 and not last attempt, wait and retry (token might not be set yet)
      if (error.response?.status === 401 && attempt < retries - 1) {
        console.log('Token not ready, retrying in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      // Last attempt or different error
      if (attempt === retries - 1) {
        console.error('All retries exhausted for fetchAllTps');
      }
    }
  }
  return [];
};

/**
 * Fetch active TPS only for public dashboards
 * Does not require authentication
 */
export const fetchActiveTps = async () => {
  try {
    const response = await api.get('/api/tps/public');
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    console.warn('API response does not contain array of active TPS:', response);
    return [];
  } catch (error) {
    console.error('Error fetching active TPS:', error);
    return [];
  }
};

/**
 * Normalize TPS data for frontend use (dashboard stats version)
 */
export const normalizeTpsStats = (backendTps) => {
  if (!backendTps) return null;

  return {
    id: backendTps.id,
    nama: backendTps.nama,
    kecamatan: backendTps.kecamatan || '-',
    wilayahKota: backendTps.wilayah_kota || '-',
    dayaTampungM3: backendTps.daya_tampung_m3 || null,
    // For backward compatibility - use daya_tampung_m3 for capacity calculations
    kapasitasM3: backendTps.daya_tampung_m3 || null,
    // Generate placeholder kapasitasPersen based on daya_tampung_m3 (if available)
    // In real app, this should come from filler/sensor data
    kapasitasPersen: backendTps.daya_tampung_m3 
      ? Math.min(100, Math.round((backendTps.daya_tampung_m3 / 100) * 100)) // Placeholder formula
      : 50,
    capacity: backendTps.daya_tampung_m3 
      ? Math.min(100, Math.round((backendTps.daya_tampung_m3 / 100) * 100)) // Placeholder formula
      : 50,
    status: backendTps.status || 'Tidak Aktif',
    hasCoordinates: !!(backendTps.latitude && backendTps.longitude),
    // Backward compatibility fields
    lat: backendTps.latitude || null,
    lng: backendTps.longitude || null,
    kelurahanList: backendTps.lokasi ? [backendTps.lokasi] : []
  };
};

/**
 * Calculate dashboard statistics from TPS data
 */
export const calculateTpsStats = (tpsList) => {
  const totalCount = tpsList.length;
  const activeCount = tpsList.filter(t => t.status === 'Aktif').length;
  const inactiveCount = tpsList.filter(t => t.status === 'Tidak Aktif').length;
  
  const criticalTps = tpsList.filter(t => (t.kapasitasPersen || t.capacity || 0) >= 80);
  const warningTps = tpsList.filter(t => (t.kapasitasPersen || t.capacity || 0) >= 65 && (t.kapasitasPersen || t.capacity || 0) < 80);
  const safeTps = tpsList.filter(t => (t.kapasitasPersen || t.capacity || 0) < 65);
  
  const avgCapacityPercent = totalCount > 0 
    ? Math.round(tpsList.reduce((acc, t) => acc + (t.kapasitasPersen || t.capacity || 50), 0) / totalCount)
    : 0;
    
  const totalCapacityM3 = tpsList.reduce((acc, t) => acc + (t.dayaTampungM3 || 0), 0);
  
  return {
    totalCount,
    activeCount,
    inactiveCount,
    criticalTpsCount: criticalTps.length,
    warningTpsCount: warningTps.length,
    safeTpsCount: safeTps.length,
    avgCapacityPercent,
    totalCapacityM3,
    criticalTps,
    warningTps,
    safeTps
  };
};

/**
 * Get unique regions from TPS data
 */
export const extractRegionsFromTps = (tpsList) => {
  const regionMap = {};
  
  tpsList.forEach(tps => {
    const regionName = tps.wilayahKota || 'Lainnya';
    if (!regionMap[regionName]) {
      regionMap[regionName] = {
        name: regionName,
        tpsList: [],
        totalTps: 0,
        avgPct: 0,
        criticalCount: 0
      };
    }
    regionMap[regionName].tpsList.push(tps);
    regionMap[regionName].totalTps++;
  });
  
  // Calculate averages for each region
  Object.values(regionMap).forEach(region => {
    if (region.totalTps > 0) {
      region.avgPct = Math.round(
        region.tpsList.reduce((acc, t) => acc + (t.kapasitasPersen || t.capacity || 50), 0) / region.totalTps
      );
      region.criticalCount = region.tpsList.filter(t => (t.kapasitasPersen || t.capacity || 0) >= 80).length;
      region.statusText = region.avgPct >= 80 ? 'Kritis' : region.avgPct >= 65 ? 'Waspada' : 'Aman';
      region.statusColor = region.avgPct >= 80 ? '#ef4444' : region.avgPct >= 65 ? '#f59e0b' : '#10b981';
    }
  });
  
  return Object.values(regionMap);
};
