import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconBuilding, IconMapPin } from './common/AppIcons';

// Tile URL layers (Identical to HeroMap on Landing Page)
const TILE_URLS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

const SURABAYA_CENTER = [-7.2650, 112.7450];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

export default function KelurahanMap({
  tpsList = [],
  selectedTpsId,
  onSelectTps,
  selectedKelurahan = '',
  currentKecamatan = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerRefsMap = useRef({});

  const [mapType, setMapType] = useState('osm'); // 'osm' | 'satellite'
  const [filterStatus, setFilterStatus] = useState('Semua'); // Occupancy status filters are unavailable without live fill data.

  // The backend only returns approved occupancy reports.
  const filteredTps = useMemo(() => tpsList, [tpsList]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeObserver = null;
    const timers = [];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SURABAYA_CENTER,
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: false
      });

      // Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Base Tile Layer (Default OSM)
      const baseTile = L.tileLayer(TILE_URLS.osm.url, {
        maxZoom: 19,
        attribution: TILE_URLS.osm.attribution
      }).addTo(map);

      tileLayerRef.current = baseTile;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;

      // Delayed invalidateSize for smooth rendering in tabs
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

  // Update Markers & Auto-fit bounds when filteredTps changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();
    markerRefsMap.current = {};

    if (filteredTps.length === 0) return;

    const latLngBounds = [];

    filteredTps.forEach((tps) => {
      if (!Number.isFinite(tps.lat) || !Number.isFinite(tps.lng)) return;

      latLngBounds.push([tps.lat, tps.lng]);

      const isInactive = tps.status === 'Tidak Aktif';
      const hasVerifiedMonitoring = Number.isFinite(tps.capacity);
      const displayText = isInactive ? 'OFF' : (hasVerifiedMonitoring ? `${Math.round(tps.capacity)}%` : 'TPS');
      const badgeClass = 'gray';
      const pinColor = isInactive || tps.capacity == null
        ? '#94a3b8'
        : tps.statusColor === 'green'
          ? '#16a34a'
          : tps.statusColor === 'yellow'
            ? '#f59e0b'
            : '#ef4444';

      // Custom pulsing HTML marker
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot" style="background: ${pinColor}; width: 28px; height: 28px;">
              <span style="font-size: ${hasVerifiedMonitoring ? '0.72rem' : '0.68rem'}; font-weight: 700; color: #fff;">${displayText}</span>
            </div>
          </div>
        `
      });

      const marker = L.marker([tps.lat, tps.lng], { icon: customIcon });
      markerRefsMap.current[tps.id] = marker;

      const monitoredAt = tps.lastMonitoringAt
        ? new Date(tps.lastMonitoringAt).toLocaleString('id-ID')
        : null;
      const popupHtml = `
        <div class="osm-popup-container" style="font-family: inherit; min-width: 250px; padding: 2px;">
          <div class="osm-popup-title-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <h4 class="osm-popup-title" style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">${escapeHtml(tps.nama)}</h4>
            <span class="map-tooltip-badge ${badgeClass}" style="margin: 0; font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; white-space: nowrap;">
              ${isInactive ? 'Nonaktif' : 'Aktif'}
            </span>
          </div>

          <div class="osm-popup-details" style="font-size: 0.8rem; color: #475569; display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
            <p style="margin: 0;"><strong>Lokasi:</strong> ${escapeHtml(tps.lokasi || 'Belum ada data')}</p>
            <p style="margin: 0;"><strong>Kecamatan:</strong> ${escapeHtml(tps.kecamatan)} (${escapeHtml(tps.wilayahKota || 'Surabaya')})</p>
            <p style="margin: 0;"><strong>Kelurahan:</strong> ${escapeHtml(tps.kelurahanList?.join(', ') || selectedKelurahan || 'Belum ada data')}</p>
            <p style="margin: 0;"><strong>Jenis:</strong> ${escapeHtml(tps.jenisTps || 'Belum ada data')} &bull; ${escapeHtml(tps.jumlahContainer || 'Kontainer belum tersedia')}</p>
            <p style="margin: 0;"><strong>Daya Tampung Maksimum:</strong> ${tps.dayaTampungM3 != null ? `${escapeHtml(tps.dayaTampungM3)} m&sup3;` : 'Belum ada data'}</p>
            <p style="margin: 0;"><strong>Kapasitas terisi:</strong> ${hasVerifiedMonitoring ? `${escapeHtml(tps.capacity)}%` : 'Belum ada laporan terverifikasi'}</p>
            <p style="margin: 0;"><strong>Kapasitas tersisa:</strong> ${tps.remainingPercent != null ? `${escapeHtml(tps.remainingPercent)}%` : 'Belum ada laporan terverifikasi'}</p>
            <p style="margin: 0;"><strong>Volume aktual:</strong> ${tps.volumeActualM3 != null ? `${escapeHtml(tps.volumeActualM3)} m&sup3;` : 'Belum ada laporan terverifikasi'}</p>
            <p style="margin: 0;"><strong>Monitoring terakhir:</strong> ${escapeHtml(monitoredAt || 'Belum ada laporan terverifikasi')}</p>
          </div>

          <div style="display: flex; gap: 6px;">
            <button 
              type="button" 
              id="osm-select-btn-${tps.id}"
              style="flex: 1; background: #16a34a; color: #ffffff; border: none; border-radius: 6px; padding: 7px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer;"
            >
              Pilih TPS Ini &rarr;
            </button>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${tps.lat},${tps.lng}"
              target="_blank"
              rel="noreferrer"
              style="background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 7px 10px; font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center;"
              title="Buka rute navigasi di Google Maps"
            >
              Rute
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'osm-styled-leaflet-popup',
        autoPan: true,
        autoPanPaddingTopLeft: [20, 140],
        autoPanPaddingBottomRight: [20, 80]
      });

      marker.on('click', () => {
        if (onSelectTps) onSelectTps(tps);
      });

      marker.on('popupopen', () => {
        if (onSelectTps) onSelectTps(tps);
        const selectBtn = document.getElementById(`osm-select-btn-${tps.id}`);
        if (selectBtn) {
          selectBtn.onclick = (e) => {
            e.stopPropagation();
            if (onSelectTps) onSelectTps(tps);
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
  }, [filteredTps, selectedKelurahan, onSelectTps]);

  // Center on selectedTpsId if changed from chips or external
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedTpsId) return;
    const marker = markerRefsMap.current[selectedTpsId];
    if (marker) {
      const latlng = marker.getLatLng();
      mapInstanceRef.current.panTo([latlng.lat + 0.003, latlng.lng], { animate: true, duration: 0.4 });
      marker.openPopup();
    }
  }, [selectedTpsId]);

  // Reset view to bounds of current kelurahan's TPS
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const validCoords = filteredTps
      .filter((t) => Number.isFinite(t.lat) && Number.isFinite(t.lng))
      .map((t) => [t.lat, t.lng]);
    if (validCoords.length > 0) {
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 15, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 15, animate: true });
      }
    } else {
      map.setView(SURABAYA_CENTER, 13, { animate: true });
    }
  };

  return (
    <div className="kelurahan-map-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Kelurahan Selection Bar */}
      <div 
        className="kelurahan-selector-bar"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          position: 'relative',
          zIndex: 30
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#16a34a' }}><IconBuilding size={22} /></span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Wilayah Kelurahan &amp; Kecamatan
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Kel. {selectedKelurahan || 'Romokalisari'} <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.88rem' }}>&bull; Kec. {currentKecamatan || 'Surabaya'}</span>
              </div>
            </div>
          </div>

          <span style={{ color: '#cbd5e1' }}>|</span>

          {/* Badge count of serving TPS */}
          <div 
            style={{
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <IconMapPin size={14} />
            <span>{tpsList.length} Titik TPS Melayani</span>
          </div>
        </div>

      </div>

      {/* Main Interactive Map Canvas Wrapper */}
      <div 
        className="hero-map-wrapper kelurahan-interactive-map"
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}
      >
        {/* Floating Top Controls (Matching Landing Page HeroMap style) */}
        <div 
          className="hero-map-header-controls"
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
          {/* Filter & Layer Controls Overlay */}
          <div className="osm-map-controls-overlay" style={{ pointerEvents: 'auto' }}>
            {/* Layer Mode Switcher: OSM Standard vs Satellite */}
            <div className="osm-mode-switcher">
              <button
                type="button"
                className={`osm-mode-btn ${mapType === 'osm' ? 'active' : ''}`}
                onClick={() => setMapType('osm')}
                title="Tampilkan peta OpenStreetMap standar"
              >
                Standar
              </button>
              <button
                type="button"
                className={`osm-mode-btn ${mapType === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapType('satellite')}
                title="Tampilkan peta citra satelit"
              >
                Satelit
              </button>
            </div>

            {/* Status Filters */}
            <div className="osm-filter-chips">
              {['Semua'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`osm-filter-chip ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </button>
              ))}
              <button
                type="button"
                className="osm-reset-btn"
                onClick={handleResetView}
                title="Kembalikan posisi peta ke titik TPS kelurahan ini"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Leaflet Map Div */}
        <div
          ref={mapContainerRef}
          className="hero-osm-map-canvas"
          style={{ width: '100%', height: '480px', position: 'relative', zIndex: 1 }}
        />

      </div>
    </div>
  );
}
