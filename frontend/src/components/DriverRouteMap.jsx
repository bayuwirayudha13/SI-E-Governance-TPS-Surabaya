import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  IconTruck, 
  IconMapPin, 
  IconCheck, 
  IconClock, 
  IconCompass, 
  IconNavigation,
  IconBox,
  IconBuilding,
  IconAlert,
  IconSearch,
  IconCamera,
  IconX
} from './common/AppIcons';

// Surabaya Center fallback
const SURABAYA_CENTER = [-7.2485, 112.7245];

const TILE_URLS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; DigitalGlobe'
  }
};

/**
 * Default Realistic Route Stops for Petugas Driver in Surabaya (e.g. Hendra)
 */
const DEFAULT_ROUTE_STOPS = [
  {
    id: 'stop-0',
    number: '01',
    type: 'start',
    title: 'Pangkalan Armada DLH (Pos Berangkat)',
    subtitle: 'Depot Armada Truk Surabaya Barat/Pusat',
    address: 'Jl. Semarang No. 12, Bubutan',
    lat: -7.2520,
    lng: 112.7302,
    time: '06:00 WIB',
    status: 'done',
    weightKg: 0,
    category: 'Persiapan Armada',
    notes: 'Pemeriksaan oli, bahan bakar, dan APD sebelum jalan.'
  },
  {
    id: 'stop-1',
    number: '02',
    type: 'pickup',
    title: 'Bpk. Joko Santoso (RT 01)',
    subtitle: 'Warga Terdaftar SI-PETASAN',
    address: 'RT 01 RW 02 Jl. Demak Barat No. 14',
    lat: -7.2505,
    lng: 112.7275,
    time: '06:20 WIB',
    status: 'done',
    weightKg: 12.5,
    category: 'Plastik & Kertas',
    notes: 'Kantung sampah sudah terpilah di depan pagar.'
  },
  {
    id: 'stop-2',
    number: '03',
    type: 'pickup',
    title: 'Ibu Siti Aminah (RT 02)',
    subtitle: 'Titik Penjemputan Aktif Saat Ini',
    address: 'RT 02 RW 02 Jl. Kalibutuh Gg. 3 No. 8',
    lat: -7.2488,
    lng: 112.7252,
    time: '06:45 WIB',
    status: 'current',
    weightKg: 18.0,
    category: 'Anorganik Campur',
    notes: 'Hubungi jika pagar tertutup. Scan QR di gerbang.'
  },
  {
    id: 'stop-3',
    number: '04',
    type: 'pickup',
    title: 'Bpk. Agus Setiawan (RT 03)',
    subtitle: 'Penjemputan Terjadwal',
    address: 'RT 03 RW 03 Jl. Dupak Melati No. 22',
    lat: -7.2465,
    lng: 112.7225,
    time: '07:15 WIB',
    status: 'pending',
    weightKg: 14.2,
    category: 'Plastik Botol (PETE)',
    notes: 'Sampah daur ulang bersih, ada bonus kardus.'
  },
  {
    id: 'stop-4',
    number: '05',
    type: 'pickup',
    title: 'Bpk. Budi Prasetyo (RT 04)',
    subtitle: 'Penjemputan Terjadwal',
    address: 'RT 04 RW 03 Jl. Tembok Dukuh Barat No. 5',
    lat: -7.2448,
    lng: 112.7240,
    time: '07:40 WIB',
    status: 'pending',
    weightKg: 16.5,
    category: 'Karton & Logam',
    notes: 'Ada kaleng bekas dan kardus tebal.'
  },
  {
    id: 'stop-5',
    number: '06',
    type: 'pickup',
    title: 'Ibu Ratna Dewi (RT 05)',
    subtitle: 'Penjemputan Terjadwal',
    address: 'RT 05 RW 04 Jl. Demak Kalibutuh No. 41',
    lat: -7.2470,
    lng: 112.7268,
    time: '08:05 WIB',
    status: 'pending',
    weightKg: 9.8,
    category: 'Plastik Daur Ulang',
    notes: 'Lokasi dekat pertigaan gang.'
  },
  {
    id: 'stop-6',
    number: '07',
    type: 'tps',
    title: 'TPS Tembok DK (Titik Bongkar Muatan)',
    subtitle: 'TPS Tujuan Akhir Armada',
    address: 'Jl. Demak Kalibutuh, Kel. Tembok Dukuh',
    lat: -7.2482,
    lng: 112.7245,
    time: '08:30 WIB',
    status: 'pending',
    weightKg: 0,
    category: 'Bongkar ke Compactor',
    notes: 'Kapasitas TPS saat ini 66% (Aman). Penimbangan total muatan.'
  }
];

export default function DriverRouteMap({
  officerName = 'Hendra',
  wilayahKelurahan = 'Tembok Dukuh',
  wilayahKecamatan = 'Bubutan',
  queueList = [],
  onNavigateScan,
  height = '420px',
  isCompact = false,
  onExpand
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const truckMarkerRef = useRef(null);

  const [mapType, setMapType] = useState('osm');
  const [selectedStopId, setSelectedStopId] = useState('stop-2');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending' | 'done'
  const [routeStops, setRouteStops] = useState(DEFAULT_ROUTE_STOPS);

  // Today's day name in Indonesian
  const dayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  // Sync with parent queueList if available
  useEffect(() => {
    if (queueList && queueList.length > 0) {
      // Merge queueList into route stops
      const startPoint = DEFAULT_ROUTE_STOPS[0];
      const endPoint = DEFAULT_ROUTE_STOPS[DEFAULT_ROUTE_STOPS.length - 1];

      const dynamicPickups = queueList.slice(0, 5).map((q, idx) => {
        const offsetLat = (idx - 2) * 0.0022;
        const offsetLng = ((idx % 2 === 0 ? 1 : -1) * 0.0020);
        return {
          id: `queue-${q.id || idx}`,
          number: String(idx + 2).padStart(2, '0'),
          type: 'pickup',
          title: q.name || `Warga RT 0${idx + 1}`,
          subtitle: q.statusText || 'Penjemputan Terjadwal',
          address: q.address || `${q.kelurahan || wilayahKelurahan}`,
          lat: -7.2485 + offsetLat,
          lng: 112.7245 + offsetLng,
          time: `06:${String(20 + idx * 25).padStart(2, '0')} WIB`,
          status: idx === 0 ? 'current' : 'pending',
          weightKg: q.estimatedKg || (10 + idx * 3.5),
          category: q.category || 'Sampah Terpilah',
          notes: q.notes || 'Penjemputan rutin harian warga SI-PETASAN.',
          qr_code: q.kode || ''
        };
      });

      setRouteStops([startPoint, ...dynamicPickups, endPoint]);
      setSelectedStopId(dynamicPickups[0]?.id || 'stop-1');
    }
  }, [queueList, wilayahKelurahan]);

  // Calculated route statistics
  const routeStats = useMemo(() => {
    const totalStops = routeStops.filter(s => s.type === 'pickup').length;
    const completedStops = routeStops.filter(s => s.type === 'pickup' && s.status === 'done').length;
    const remainingStops = totalStops - completedStops;
    const totalWeight = routeStops
      .filter(s => s.type === 'pickup' && s.status === 'done')
      .reduce((acc, s) => acc + (s.weightKg || 0), 0);
    const estimatedTotalWeight = routeStops
      .filter(s => s.type === 'pickup')
      .reduce((acc, s) => acc + (s.weightKg || 0), 0);

    return {
      totalStops,
      completedStops,
      remainingStops,
      totalWeight: totalWeight.toFixed(1),
      estimatedTotalWeight: estimatedTotalWeight.toFixed(1),
      pctComplete: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
      totalDistanceKm: 4.8,
      estimatedEndTime: '08:30 WIB'
    };
  }, [routeStops]);

  // Filtered stops for list
  const filteredStops = useMemo(() => {
    if (filterMode === 'pending') {
      return routeStops.filter(s => s.status === 'pending' || s.status === 'current');
    }
    if (filterMode === 'done') {
      return routeStops.filter(s => s.status === 'done');
    }
    return routeStops;
  }, [routeStops, filterMode]);

  // Current active / selected stop
  const activeStop = useMemo(() => {
    return routeStops.find(s => s.id === selectedStopId) || routeStops[0];
  }, [routeStops, selectedStopId]);

  // Toggle stop completion status
  const handleToggleStopStatus = (stopId) => {
    setRouteStops(prev => prev.map(s => {
      if (s.id === stopId) {
        const nextStatus = s.status === 'done' ? 'pending' : 'done';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SURABAYA_CENTER,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true
      });

      const tileLayer = L.tileLayer(TILE_URLS[mapType].url, {
        attribution: TILE_URLS[mapType].attribution,
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      mapInstanceRef.current._tileLayer = tileLayer;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer (Standard OSM vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._tileLayer) return;

    map.removeLayer(map._tileLayer);
    const newLayer = L.tileLayer(TILE_URLS[mapType].url, {
      attribution: TILE_URLS[mapType].attribution,
      maxZoom: 19
    }).addTo(map);
    map._tileLayer = newLayer;
  }, [mapType]);

  // Draw Stops, Route Polyline, and Truck Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (truckMarkerRef.current) {
      map.removeLayer(truckMarkerRef.current);
      truckMarkerRef.current = null;
    }

    const latLngs = [];

    // 1. Draw Polyline Rute Jalan (Halo + Solid Line)
    routeStops.forEach(stop => {
      if (stop.lat && stop.lng) {
        latLngs.push([stop.lat, stop.lng]);
      }
    });

    if (latLngs.length > 1) {
      // Glow/Halo underlayer
      L.polyline(latLngs, {
        color: '#15803d',
        weight: 8,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Main Route Line
      polylineRef.current = L.polyline(latLngs, {
        color: '#16a34a',
        weight: 4,
        opacity: 0.95,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 2. Draw Checkpoint Markers
    routeStops.forEach((stop) => {
      if (!stop.lat || !stop.lng) return;

      const isCurrent = stop.status === 'current';
      const isDone = stop.status === 'done';
      const isStart = stop.type === 'start';
      const isTps = stop.type === 'tps';

      const pinBg = isStart
        ? '#0284c7'
        : isTps
        ? '#b91c1c'
        : isDone
        ? '#16a34a'
        : isCurrent
        ? '#2563eb'
        : '#475569';

      const iconHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isCurrent ? '38px' : '32px'};
          height: ${isCurrent ? '38px' : '32px'};
          border-radius: 50%;
          background: ${pinBg};
          color: #ffffff;
          font-weight: 800;
          font-size: ${isCurrent ? '13px' : '11px'};
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2.5px solid #ffffff;
          transition: transform 0.2s ease;
          cursor: pointer;
        ">
          ${isCurrent ? '<div style="position: absolute; inset: -6px; border-radius: 50%; border: 2.5px solid #3b82f6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>' : ''}
          ${isStart ? '★' : isTps ? 'TPS' : isDone ? '✓' : stop.number}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'driver-route-marker',
        iconSize: [isCurrent ? 38 : 32, isCurrent ? 38 : 32],
        iconAnchor: [isCurrent ? 19 : 16, isCurrent ? 19 : 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
      const statusBadge = isDone
        ? '<span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.72rem;">✓ Selesai Diambil</span>'
        : isCurrent
        ? '<span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.72rem;">● Titik Aktif Saat Ini</span>'
        : '<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.72rem;">Menunggu Giliran</span>';

      const popupHtml = `
        <div style="font-family: inherit; min-width: 230px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Stop ${stop.number} &bull; ${stop.time}</span>
            ${statusBadge}
          </div>
          <h4 style="margin: 0 0 4px; font-size: 0.95rem; font-weight: 800; color: #0f172a;">${stop.title}</h4>
          <p style="margin: 0 0 8px; font-size: 0.78rem; color: #475569; line-height: 1.4;">${stop.address}</p>
          
          ${stop.weightKg > 0 ? `
            <div style="background: #f8fafc; padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; margin-bottom: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
              <span>Muatan: <strong>${stop.weightKg} kg</strong></span>
              <span style="color: #166534; font-weight: 600;">${stop.category}</span>
            </div>
          ` : ''}

          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a 
              href="${googleMapsUrl}" 
              target="_blank" 
              rel="noreferrer" 
              style="flex: 1; text-align: center; background: #0284c7; color: #ffffff; text-decoration: none; padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 700;"
            >
              Navigasi GPS &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedStopId(stop.id);
      });

      markersRef.current[stop.id] = marker;
    });

    // 3. Current Live Truck Location Marker (at active stop)
    const currentStop = routeStops.find(s => s.status === 'current') || routeStops[1];
    if (currentStop && currentStop.lat && currentStop.lng) {
      const truckIconHtml = `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(15,23,42,0.4);
          border: 2px solid #22c55e;
          white-space: nowrap;
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
          <span>Truk Armada ${officerName}</span>
        </div>
      `;

      const truckIcon = L.divIcon({
        html: truckIconHtml,
        className: 'driver-truck-label',
        iconSize: [160, 28],
        iconAnchor: [80, 42]
      });

      truckMarkerRef.current = L.marker([currentStop.lat, currentStop.lng], {
        icon: truckIcon,
        zIndexOffset: 1000
      }).addTo(map);
    }

    // Fit bounds to display full route
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [routeStops, mapType, officerName]);

  // Center on selected stop when changed
  const handleSelectStop = (stop) => {
    setSelectedStopId(stop.id);
    const map = mapInstanceRef.current;
    if (map && stop.lat && stop.lng) {
      map.panTo([stop.lat, stop.lng], { animate: true, duration: 0.5 });
      const marker = markersRef.current[stop.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Handle invalidateSize when container mounts / resizes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [height]);

  // Reset to full route view
  const handleResetRouteView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const latLngs = routeStops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 16, animate: true });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Top Route Overview Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#e0f2fe',
                color: '#0284c7',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                RUTE HARI {dayName.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Kel. {wilayahKelurahan} &bull; Kec. {wilayahKecamatan}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Peta Rute Pengambilan Sampah Harian
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Driver: <strong>{officerName}</strong> &bull; Nomor Armada: Truk DLH-04
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <IconCompass size={15} /> Layar Penuh
              </button>
            )}

            <button
              type="button"
              onClick={handleResetRouteView}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Reset pandangan peta ke seluruh rute"
            >
              Reset Peta
            </button>
          </div>
        </div>

        {/* 4 Route Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          background: '#f8fafc',
          padding: '12px 14px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PROGRES PENJEMPUTAN</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {routeStats.completedStops} / {routeStats.totalStops} <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>({routeStats.pctComplete}%)</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>MUATAN SAAT INI</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>
              {routeStats.totalWeight} <span style={{ fontSize: '0.78rem', color: '#64748b' }}>/ {routeStats.estimatedTotalWeight} kg</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TOTAL JARAK RUTE</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
              {routeStats.totalDistanceKm} km
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ESTIMASI SELESAI</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
              {routeStats.estimatedEndTime}
            </div>
          </div>
        </div>
      </div>

            {/* Side-by-Side: Map di Sebelah KIRI, Urutan Titik Penjemputan di Sebelah KANAN */}
      <div
        className="driver-route-columns-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '18px',
          alignItems: 'stretch'
        }}
      >
        {/* LEFT COLUMN: Peta Navigasi Interaktif Leaflet */}
        <div style={{
          position: 'relative',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: height || '520px'
        }}>
        {/* Floating Top Controls over Map */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          pointerEvents: 'none'
        }}>
          {/* Layer Mode Switcher */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '3px',
            display: 'flex',
            gap: '3px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            pointerEvents: 'auto'
          }}>
            <button
              type="button"
              onClick={() => setMapType('osm')}
              style={{
                background: mapType === 'osm' ? '#16a34a' : 'transparent',
                color: mapType === 'osm' ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Standar
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              style={{
                background: mapType === 'satellite' ? '#16a34a' : 'transparent',
                color: mapType === 'satellite' ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Satelit
            </button>
          </div>

          {/* Live Status Badge */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'auto'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></span>
            <span>GPS Tracking Armada Aktif</span>
          </div>
        </div>

        {/* Leaflet Canvas */}
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: height || '520px', minHeight: '440px', flex: 1, background: '#f1f5f9' }}
        />

        {/* Legend Overlay at bottom left of map */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 400,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.72rem',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontWeight: 800, color: '#64748b' }}>LEGENDA:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span> Selesai
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span> Aktif Sekarang
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#475569' }}></span> Menunggu
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b91c1c' }}></span> TPS Akhir
          </span>
        </div>
        </div>

        {/* RIGHT COLUMN: Urutan Titik Penjemputan Rute Hari Ini */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          height: height || '520px',
          minHeight: '460px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Urutan Titik Penjemputan Rute Hari Ini
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Klik lokasi untuk memusatkan peta dan rute Google Maps.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onNavigateScan && (
                <button
                  type="button"
                  onClick={() => onNavigateScan()}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                  }}
                  title="Buka scanner untuk validasi setoran di titik ini"
                >
                  <IconCamera size={14} /> Scan QR Warga
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                background: filterMode === 'all' ? '#16a34a' : '#f1f5f9',
                color: filterMode === 'all' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Semua ({routeStops.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              style={{
                background: filterMode === 'pending' ? '#16a34a' : '#f1f5f9',
                color: filterMode === 'pending' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Belum Selesai ({routeStops.filter(s => s.status !== 'done').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('done')}
              style={{
                background: filterMode === 'done' ? '#16a34a' : '#f1f5f9',
                color: filterMode === 'done' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Selesai ({routeStops.filter(s => s.status === 'done').length})
            </button>
          </div>

          {/* Scrollable Sequential Route Stop Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '4px',
            flex: 1
          }}>

          {filteredStops.map((stop) => {
            const isSelected = stop.id === selectedStopId;
            const isDone = stop.status === 'done';
            const isCurrent = stop.status === 'current';
            const isStart = stop.type === 'start';
            const isTps = stop.type === 'tps';

            return (
              <div
                key={stop.id}
                onClick={() => handleSelectStop(stop)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: isSelected ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0fdf4' : isDone ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                {/* Left: Badge number + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isStart ? '#0284c7' : isTps ? '#b91c1c' : isDone ? '#16a34a' : isCurrent ? '#2563eb' : '#475569',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}>
                    {isDone ? <IconCheck size={14} strokeWidth={2.5} color="#ffffff" /> : stop.number}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.92rem', color: isDone ? '#475569' : '#0f172a' }}>
                        {stop.title}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                        &bull; {stop.time}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      {stop.address}
                    </div>
                  </div>
                </div>

                {/* Middle: Weight info */}
                {stop.weightKg > 0 && (
                  <div style={{ textAlign: 'right', minWidth: '90px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                      {stop.weightKg} kg
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                      {stop.category}
                    </div>
                  </div>
                )}

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Buka panduan rute turn-by-turn di Google Maps"
                  >
                    <IconNavigation size={13} /> Navigasi
                  </a>

                  {stop.type === 'pickup' && onNavigateScan && (
                    <button
                      type="button"
                      onClick={() => onNavigateScan(stop)}
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Buka scanner untuk validasi setoran di titik ini"
                    >
                      Scan QR
                    </button>
                  )}

                  {stop.type === 'pickup' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStopStatus(stop.id)}
                      style={{
                        background: isDone ? '#fee2e2' : '#dcfce7',
                        color: isDone ? '#b91c1c' : '#15803d',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title={isDone ? 'Batal tandai selesai' : 'Tandai titik ini sudah diambil'}
                    >
                      {isDone ? 'Batal' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconCheck size={12} strokeWidth={2.5} /> Selesai</span>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}