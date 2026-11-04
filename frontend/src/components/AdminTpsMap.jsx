import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TPS_SURABAYA_ALL } from '../data/tpsSurabayaData';
import { fetchPublicTps } from '../api/tps';

// Stable module-level constants
const SURABAYA_CENTER = [-7.2650, 112.7450];
const DEFAULT_ZOOM = 12;

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

export default function AdminTpsMap({ onOpenTpsModal, height = '560px' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [mapType, setMapType] = useState('osm'); // 'osm' | 'satellite'
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selectedTps, setSelectedTps] = useState(null);
  const [tpsList, setTpsList] = useState(TPS_SURABAYA_ALL);
  const [isLoading, setIsLoading] = useState(true);

  // Load TPS from API on mount, enriched with verified 231 Surabaya TPS dataset
  useEffect(() => {
    async function loadPublicTps() {
      setIsLoading(true);
      try {
        const data = await fetchPublicTps();
        if (Array.isArray(data) && data.length > 0) {
          const apiMap = new Map();
          data.forEach((item) => {
            if (item.id) apiMap.set(String(item.id).toLowerCase(), item);
            if (item.nama) apiMap.set(String(item.nama).toLowerCase(), item);
          });
          const merged = TPS_SURABAYA_ALL.map((base) => {
            const apiMatch = apiMap.get(String(base.id).toLowerCase()) || apiMap.get(String(base.nama).toLowerCase());
            return apiMatch
              ? {
                  ...base,
                  ...apiMatch,
                  lat: Number.isFinite(apiMatch.lat) ? apiMatch.lat : base.lat,
                  lng: Number.isFinite(apiMatch.lng) ? apiMatch.lng : base.lng,
                }
              : base;
          });
          setTpsList(merged);
        } else {
          setTpsList(TPS_SURABAYA_ALL);
        }
      } catch (error) {
        console.error('Error loading TPS in AdminTpsMap:', error);
        setTpsList(TPS_SURABAYA_ALL);
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicTps();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SURABAYA_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true,
        zoomControl: false
      });

      // Add Zoom Control to Top Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Base Tile Layer (Default OSM)
      const baseTile = L.tileLayer(TILE_URLS.osm.url, {
        maxZoom: 19,
        attribution: TILE_URLS.osm.attribution
      }).addTo(map);

      tileLayerRef.current = baseTile;

      // Layer group for TPS markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;

      // Invalidate size in stages to ensure full canvas coverage
      const timers = [50, 150, 300, 600, 1000].map((delay) =>
        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, delay)
      );

      return () => {
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

  // Update Markers when filterStatus or tpsList changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const filtered = tpsList;

    // Render markers for all TPS records with valid coordinates
    filtered.forEach((tps) => {
      renderSingleMarker(tps, markersGroup);
    });

    function renderSingleMarker(tps, group) {
      if (!Number.isFinite(tps.lat) || !Number.isFinite(tps.lng)) return;

      const isInactive = tps.status === 'Tidak Aktif';
      const isCritical = tps.statusColor === 'red' || (tps.capacity || tps.kapasitasPersen || 0) >= 80 || tps.status === 'Merah' || tps.status === 'Kritis';
      const isWarning = tps.statusColor === 'yellow' || ((tps.capacity || tps.kapasitasPersen || 0) >= 60 && (tps.capacity || tps.kapasitasPersen || 0) < 80) || tps.status === 'Kuning' || tps.status === 'Waspada';
      const badgeClass = isInactive ? 'gray' : isCritical ? 'red' : isWarning ? 'yellow' : 'green';
      const pinColor = isInactive ? '#94a3b8' : isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

      // Custom pulsing HTML marker matching landing page design with TPS text
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot" style="background: ${pinColor};">
              <span>${isInactive ? 'OFF' : 'TPS'}</span>
            </div>
          </div>
        `,
      });

      const marker = L.marker([tps.lat, tps.lng], { icon: customIcon });

      // Custom popup HTML with full TPS details
      const popupHtml = `
        <div class="osm-popup-container">
          <div class="osm-popup-title-row">
            <h4 class="osm-popup-title">${tps.nama}</h4>
            <span class="map-tooltip-badge ${badgeClass}">${isInactive ? 'Nonaktif' : isCritical ? 'Overload' : isWarning ? 'Waspada' : 'Aman'}</span>
          </div>
          <div class="osm-popup-details">
            <p><strong>Lokasi:</strong> ${tps.lokasi || (tps.kecamatan ? `Kec. ${tps.kecamatan}` : '-')}</p>
            <p><strong>Kecamatan:</strong> ${tps.kecamatan || '-'}</p>
            <p><strong>Jam Operasional:</strong> ${tps.jamOperasional || '06:00 - 20:00 WIB'}</p>
            <p><strong>📦 Daya Tampung Maksimum:</strong> ${tps.dayaTampungM3 != null ? `${tps.dayaTampungM3} m&sup3;` : 'Belum ada data'}</p>
          </div>
          <button 
            type="button" 
            id="admin-osm-btn-${tps.id}"
            class="osm-popup-action-btn"
          >
            Buka Detail Lengkap TPS &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 300,
        className: 'osm-styled-leaflet-popup',
        autoPan: true,
        autoPanPaddingTopLeft: [20, 135],
        autoPanPaddingBottomRight: [20, 70],
      });

      marker.on('click', () => {
        setSelectedTps(tps);
        marker.openPopup();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([tps.lat + 0.015, tps.lng], { animate: true, duration: 0.35 });
        }
      });

      marker.on('popupopen', () => {
        setSelectedTps(tps);
        const actionBtn = document.getElementById(`admin-osm-btn-${tps.id}`);
        if (actionBtn) {
          actionBtn.onclick = (e) => {
            e.stopPropagation();
            if (onOpenTpsModal) onOpenTpsModal(tps);
          };
        }
      });

      marker.addTo(group);
    }
  }, [filterStatus, tpsList, onOpenTpsModal]);

  // Reset view to center of Surabaya
  const handleResetView = () => {
    setSelectedTps(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.closePopup();
      mapInstanceRef.current.flyTo(SURABAYA_CENTER, DEFAULT_ZOOM, {
        duration: 1.2
      });
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  };

  return (
    <div className="hero-map-wrapper" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Floating Controls Overlay (No status bar, No bottom bar) */}
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
        <div className="osm-map-controls-overlay" style={{ pointerEvents: 'auto' }}>
          {/* Layer Mode Switcher: OSM Standard vs Satellite */}
          <div className="osm-mode-switcher">
            <button
              type="button"
              className={`osm-mode-btn ${mapType === 'osm' ? 'active' : ''}`}
              onClick={() => setMapType('osm')}
              title="Tampilkan peta OpenStreetMap standar"
            >
              OSM Standar
            </button>
            <button
              type="button"
              className={`osm-mode-btn ${mapType === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapType('satellite')}
              title="Tampilkan peta citra satelit OpenStreetMap"
            >
              OSM Satelit
            </button>
          </div>

          {/* Status Filters */}
          <div className="osm-filter-chips">
            {['Semua'].map((status) => (
              <button
                key={status}
                type="button"
                className={`osm-filter-chip ${filterStatus === status ? 'active' : ''}`}
                onClick={() => {
                  setFilterStatus(status);
                  setSelectedTps(null);
                }}
              >
                {status}
              </button>
            ))}
            <button
              type="button"
              className="osm-reset-btn"
              onClick={handleResetView}
              title="Kembalikan posisi peta ke pusat Kota Surabaya"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet OpenStreetMap Container */}
      <div
        ref={mapContainerRef}
        className="hero-osm-map-canvas"
        style={{ width: '100%', height: height || '560px', position: 'relative', zIndex: 1 }}
      />
    </div>
  );
}
