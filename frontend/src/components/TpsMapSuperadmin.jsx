import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URLS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

const SURABAYA_CENTER = [-7.2650, 112.7450];

export default function TpsMapSuperadmin({ tpsList = [], onTpsClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerRefsMap = useRef({});

  const [mapType, setMapType] = useState('osm');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [isLoading, setIsLoading] = useState(false);

  // Filter TPS berdasarkan status
  const filteredTps = useMemo(() => {
    if (filterStatus === 'Semua') return tpsList;
    return tpsList.filter(t => t.status === filterStatus);
  }, [tpsList, filterStatus]);

  // Count TPS by status
  const tpsStats = useMemo(() => {
    const aktif = tpsList.filter(t => t.status === 'Aktif').length;
    const nonaktif = tpsList.filter(t => t.status === 'Tidak Aktif').length;
    const withCoords = tpsList.filter(t => t.latitude && t.longitude).length;
    return { aktif, nonaktif, total: tpsList.length, withCoords };
  }, [tpsList]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeObserver = null;
    const timers = [];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SURABAYA_CENTER,
        zoom: 12,
        scrollWheelZoom: true,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const baseTile = L.tileLayer(TILE_URLS.osm.url, {
        maxZoom: 19,
        attribution: TILE_URLS.osm.attribution
      }).addTo(map);

      tileLayerRef.current = baseTile;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;

      // Delayed invalidateSize
      const intervals = [60, 180, 350, 700, 1200];
      intervals.forEach((delay) => {
        const t = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
        timers.push(t);
      });

      let resizeDebounceTimer = null;
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
          resizeDebounceTimer = setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 150);
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      const handleWindowResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleWindowResize);

      return () => {
        window.removeEventListener('resize', handleWindowResize);
        if (resizeObserver) resizeObserver.disconnect();
        if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
        timers.forEach((t) => clearTimeout(t));
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          tileLayerRef.current = null;
          markersLayerRef.current = null;
        }
      };
    }
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const currentTileConfig = TILE_URLS[mapType] || TILE_URLS.osm;
    const newTile = L.tileLayer(currentTileConfig.url, {
      maxZoom: 19,
      attribution: currentTileConfig.attribution
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [mapType]);

  // Update Markers when filteredTps changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();
    markerRefsMap.current = {};

    if (filteredTps.length === 0) {
      map.setView(SURABAYA_CENTER, 12, { animate: true });
      return;
    }

    const latLngBounds = [];

    filteredTps.forEach((tps) => {
      // Cek koordinat valid - gunakan field latitude/longitude dari API
      const lat = parseFloat(tps.latitude);
      const lng = parseFloat(tps.longitude);
      
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      latLngBounds.push([lat, lng]);

      const isInactive = tps.status === 'Tidak Aktif';
      const pinColor = isInactive ? '#94a3b8' : '#16a34a';
      const badgeText = isInactive ? 'Nonaktif' : 'Aktif';
      const badgeClass = isInactive ? 'gray' : 'green';

      // Custom HTML marker
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot" style="background: ${pinColor}; width: 28px; height: 28px;">
              <span style="font-size: 0.7rem; font-weight: 700; color: #fff;">${isInactive ? 'OFF' : 'TPS'}</span>
            </div>
          </div>
        `
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      markerRefsMap.current[tps.id] = marker;

      // Popup HTML
      const popupHtml = `
        <div class="osm-popup-container" style="font-family: inherit; min-width: 280px; padding: 2px;">
          <div class="osm-popup-title-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
            <h4 class="osm-popup-title" style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a;">${tps.nama}</h4>
            <span class="map-tooltip-badge ${badgeClass}" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; white-space: nowrap; background: ${isInactive ? '#f1f5f9' : '#dcfce7'}; color: ${isInactive ? '#64748b' : '#166534'}; font-weight: 700;">
              ${badgeText}
            </span>
          </div>

          <div class="osm-popup-details" style="font-size: 0.82rem; color: #475569; display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px;">
            <p style="margin: 0;"><strong>🏛️ Kecamatan:</strong> ${tps.kecamatan}</p>
            <p style="margin: 0;"><strong>🗺️ Wilayah Kota:</strong> ${tps.wilayah_kota}</p>
            <p style="margin: 0;"><strong>📍 Lokasi:</strong> ${tps.lokasi || '—'}</p>
            <p style="margin: 0;"><strong>👉 Koordinat:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            <p style="margin: 0;"><strong>🚛 Jenis TPS:</strong> ${tps.jenis_tps || '—'}</p>
            <p style="margin: 0;"><strong>📦 Jumlah Container:</strong> ${tps.jumlah_container || '—'}</p>
            <p style="margin: 0;"><strong>⚖️ Daya Tampung:</strong> ${tps.daya_tampung_m3 != null ? `${tps.daya_tampung_m3} m³` : '—'}</p>
            <p style="margin: 0;"><strong>🔖 Status:</strong> ${tps.status}</p>
          </div>

          <div style="display: flex; gap: 6px;">
            <button 
              type="button" 
              id="osm-view-btn-${tps.id}"
              style="flex: 1; background: #0284c7; color: #ffffff; border: none; border-radius: 6px; padding: 8px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer;"
            >
              👁️ Lihat Detail
            </button>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
              target="_blank"
              rel="noreferrer"
              style="background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 8px 12px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center;"
              title="Buka rute navigasi di Google Maps"
            >
              🧭 Rute
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 350,
        className: 'osm-styled-leaflet-popup',
        autoPan: true,
        autoPanPaddingTopLeft: [20, 140],
        autoPanPaddingBottomRight: [20, 80]
      });

      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`osm-view-btn-${tps.id}`);
        if (viewBtn) {
          viewBtn.onclick = (e) => {
            e.stopPropagation();
            if (onTpsClick) onTpsClick(tps);
          };
        }
      });

      marker.addTo(markersGroup);
    });

    // Auto fit map view to markers
    if (latLngBounds.length > 0) {
      if (latLngBounds.length === 1) {
        map.setView(latLngBounds[0], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(latLngBounds);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true
        });
      }
    }
  }, [filteredTps, onTpsClick]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const validCoords = filteredTps
      .filter((t) => {
        const lat = parseFloat(t.latitude);
        const lng = parseFloat(t.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      })
      .map((t) => [parseFloat(t.latitude), parseFloat(t.longitude)]);
    
    if (validCoords.length > 0) {
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 15, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 15, animate: true });
      }
    } else {
      map.setView(SURABAYA_CENTER, 12, { animate: true });
    }
  };

  return (
    <div className="admin-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 className="admin-card-title" style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            🗺️ Peta Lokasi TPS
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Sebaran geografis {tpsStats.total} TPS di Surabaya ({tpsStats.withCoords} memiliki koordinat)
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }}></span>
              <strong style={{ color: '#0f172a' }}>{tpsStats.aktif}</strong> Aktif
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }}></span>
              <strong style={{ color: '#0f172a' }}>{tpsStats.nonaktif}</strong> Nonaktif
            </span>
          </div>
        </div>
      </div>

      {/* Map Canvas Wrapper */}
      <div 
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        {/* Floating Controls */}
        <div 
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none'
          }}
        >
          {/* Header Bar */}
          <div 
            className="map-status-bar"
            style={{
              alignSelf: 'flex-start',
              width: 'fit-content',
              maxWidth: '100%',
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            📍 Peta TPS Surabaya - {filteredTps.length} TPS Ditampilkan
          </div>

          {/* Controls Overlay */}
          <div className="osm-map-controls-overlay" style={{ pointerEvents: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Layer Switcher */}
            <div className="osm-mode-switcher" style={{ display: 'flex', background: '#ffffff', borderRadius: '8px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <button
                type="button"
                className={`osm-mode-btn ${mapType === 'osm' ? 'active' : ''}`}
                onClick={() => setMapType('osm')}
                title="Peta OpenStreetMap standar"
                style={{
                  background: mapType === 'osm' ? '#0284c7' : 'transparent',
                  color: mapType === 'osm' ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🗺️ Standar
              </button>
              <button
                type="button"
                className={`osm-mode-btn ${mapType === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapType('satellite')}
                title="Peta citra satelit"
                style={{
                  background: mapType === 'satellite' ? '#0284c7' : 'transparent',
                  color: mapType === 'satellite' ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🛰️ Satelit
              </button>
            </div>

            {/* Status Filters */}
            <div className="osm-filter-chips" style={{ display: 'flex', background: '#ffffff', borderRadius: '8px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', gap: '4px' }}>
              {['Semua', 'Aktif', 'Tidak Aktif'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  style={{
                    background: filterStatus === status ? '#16a34a' : 'transparent',
                    color: filterStatus === status ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {status}
                </button>
              ))}
              <button
                type="button"
                onClick={handleResetView}
                title="Reset posisi peta"
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🎯 Reset
              </button>
            </div>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="hero-osm-map-canvas"
          style={{ width: '100%', height: '500px', position: 'relative', zIndex: 1 }}
        />

        {/* Bottom Info Bar */}
        {tpsList.length === 0 && (
          <div 
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '0.82rem',
              textAlign: 'center'
            }}
          >
            ℹ️ Belum ada data TPS. Silakan tambahkan TPS baru menggunakan tombol "+ Tambah TPS" di bawah.
          </div>
        )}
        
        {tpsList.length > 0 && tpsStats.withCoords === 0 && (
          <div 
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(245, 158, 11, 0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '0.82rem',
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            ⚠️ {tpsList.length} TPS tersedia tetapi tidak memiliki koordinat. Edit TPS untuk menambahkan latitude & longitude.
          </div>
        )}
      </div>
    </div>
  );
}
