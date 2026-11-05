import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconMapPin } from './common/AppIcons';
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

export default function HeroMap({ onOpenTpsModal }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [mapType, setMapType] = useState('osm'); // 'osm' | 'satellite'
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Aktif' | 'Tidak Aktif'
  const [tpsList, setTpsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load TPS from API only (same as Superadmin TpsMapSuperadmin)
  useEffect(() => {
    async function loadPublicTps() {
      setIsLoading(true);
      try {
        const data = await fetchPublicTps();
        if (Array.isArray(data) && data.length > 0) {
          setTpsList(data);
        } else {
          setTpsList([]);
        }
      } catch (error) {
        console.error('Error loading TPS in HeroMap:', error);
        setTpsList([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicTps();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization if map already exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SURABAYA_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true,
        zoomControl: false // Custom placement
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
      const timers = [50, 150, 300, 600].map((delay) =>
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

    // Filter TPS by status (same as TpsMapSuperadmin)
    const filtered = filterStatus === 'Semua'
      ? tpsList
      : tpsList.filter(tps => tps.status === filterStatus);

    // Render markers for filtered TPS records with valid coordinates
    filtered.forEach((tps) => {
      renderSingleMarker(tps, markersGroup);
    });

    function renderSingleMarker(tps, group) {
      // Use latitude/longitude from API (normalizeTpsData provides both lat/lng and latitude/longitude)
      const lat = Number.isFinite(tps.lat) ? tps.lat : (Number.isFinite(tps.latitude) ? tps.latitude : null);
      const lng = Number.isFinite(tps.lng) ? tps.lng : (Number.isFinite(tps.longitude) ? tps.longitude : null);
      
      if (lat === null || lng === null) return;

      const isInactive = tps.status === 'Tidak Aktif';
      const pinColor = isInactive ? '#94a3b8' : '#16a34a';
      const badgeText = isInactive ? 'Nonaktif' : 'Aktif';
      const badgeClass = isInactive ? 'gray' : 'green';

      // Custom pulsing HTML marker matching superadmin design
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot" style="background: ${pinColor}; width: 28px; height: 28px;">
              <span style="font-size: 0.7rem; font-weight: 700; color: #fff;">${isInactive ? 'OFF' : 'TPS'}</span>
            </div>
          </div>
        `,
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Custom popup HTML matching TpsMapSuperadmin
      const popupHtml = `
        <div class="osm-popup-container" style="font-family: inherit; min-width: 280px; padding: 2px;">
          <div class="osm-popup-title-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
            <h4 class="osm-popup-title" style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a;">${tps.nama}</h4>
            <span class="map-tooltip-badge ${badgeClass}" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; white-space: nowrap; background: ${isInactive ? '#f1f5f9' : '#dcfce7'}; color: ${isInactive ? '#64748b' : '#166534'}; font-weight: 700;">
              ${badgeText}
            </span>
          </div>
          <div class="osm-popup-details" style="font-size: 0.82rem; color: #334155; line-height: 1.6;">
            <p style="margin: 4px 0;"><strong>Lokasi:</strong> ${tps.lokasi || tps.kecamatan || '-'}</p>
            <p style="margin: 4px 0;"><strong>Kecamatan:</strong> ${tps.kecamatan || '-'}</p>
            <p style="margin: 4px 0;"><strong>Jam Operasional:</strong> ${tps.jamOperasional || '06:00 - 20:00 WIB'}</p>
            <p style="margin: 4px 0;"><strong>📦 Daya Tampung Maksimum:</strong> ${tps.dayaTampungM3 != null ? `${tps.dayaTampungM3} m&sup3;` : 'Belum ada data'}</p>
          </div>
          <button 
            type="button" 
            id="osm-btn-${tps.id}"
            class="osm-popup-action-btn"
            style="margin-top: 10px; width: 100%; padding: 8px 12px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
          >
            Lihat Detail & Lapor Kendala &rarr;
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
        marker.openPopup();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat + 0.015, lng], { animate: true, duration: 0.35 });
        }
      });

      marker.on('popupopen', () => {
        const actionBtn = document.getElementById(`osm-btn-${tps.id}`);
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
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(SURABAYA_CENTER, DEFAULT_ZOOM, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="hero-map-wrapper">
      {/* Top Floating Bar: Status Legend & Layer Switcher */}
      <div className="map-status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            OpenStreetMap (OSM) Surabaya
          </span>
        </div>

        {/* Legend Indicators */}
        <div className="map-status-indicators" style={{ fontSize: '0.76rem' }}>
          <span title="TPS Aktif"><span className="status-dot green"></span>Aktif</span>
          <span title="TPS Nonaktif"><span className="status-dot gray"></span>Nonaktif</span>
        </div>
      </div>

      {/* Filter & Layer Controls Overlay */}
      <div className="osm-map-controls-overlay">
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
          {['Semua', 'Aktif', 'Tidak Aktif'].map((status) => (
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
            title="Kembalikan posisi peta ke pusat Kota Surabaya"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Leaflet OpenStreetMap Container */}
      <div
        ref={mapContainerRef}
        className="hero-osm-map-canvas"
        style={{ width: '100%', height: '480px', position: 'relative', zIndex: 1 }}
      />

      {/* Bottom Bar: Quick Info & Modal Trigger */}
      <div
        style={{
          padding: '12px 18px',
          background: 'rgba(7, 24, 16, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          zIndex: 5
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconMapPin size={15} />
          <span>Menampilkan <strong>{tpsList.length} Titik TPA/TPS</strong> di Surabaya via OpenStreetMap</span>
        </span>
        <button
          type="button"
          onClick={onOpenTpsModal}
          style={{
            color: '#4ade80',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span>Buka Direktori Lengkap</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}
