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
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Aman' | 'Waspada' | 'Kritis'
  const [tpsData, setTpsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load TPS from API on mount
  useEffect(() => {
    async function loadTps() {
      setIsLoading(true);
      try {
        const data = await fetchPublicTps();
        if (Array.isArray(data)) {
          setTpsData(data);
        }
      } catch (error) {
        console.error('Error loading TPS for HeroMap:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTps();
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

  // Update Markers when filterStatus or tpsData changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || isLoading) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const filtered = tpsData.filter((tps) => {
      if (filterStatus === 'Semua') return true;
      if (filterStatus === 'Aman') return tps.status_kapasitas === 'Aman' || tps.status === 'Hijau';
      if (filterStatus === 'Waspada') return tps.status_kapasitas === 'Waspada' || tps.status === 'Kuning';
      if (filterStatus === 'Kritis') return tps.status_kapasitas === 'Kritis' || tps.status === 'Merah';
      return true;
    });

    filtered.forEach((tps) => {
      const lat = parseFloat(tps.latitude || tps.lat);
      const lng = parseFloat(tps.longitude || tps.lng);
      
      if (isNaN(lat) || isNaN(lng)) return;

      const isInactive = tps.status === 'Tidak Aktif';
      const isCritical = tps.status_kapasitas === 'Kritis' || tps.status === 'Merah';
      const isWarning = tps.status_kapasitas === 'Waspada' || tps.status === 'Kuning';
      const badgeClass = isInactive ? 'gray' : isCritical ? 'red' : isWarning ? 'yellow' : 'green';
      const pinColor = isInactive ? '#94a3b8' : isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

      // Custom pulsing HTML marker
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot" style="background: ${pinColor};">
              <span>${isInactive ? 'OFF' : (tps.persentase_kapasitas ?? tps.kapasitasPersen ?? 'TPS')}${!isInactive && (tps.persentase_kapasitas != null || tps.kapasitasPersen != null) ? '%' : ''}</span>
            </div>
          </div>
        `
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Custom popup HTML
      const popupHtml = `
        <div class="osm-popup-container">
          <div class="osm-popup-title-row">
            <h4 class="osm-popup-title">${tps.nama}</h4>
            <span class="map-tooltip-badge ${badgeClass}">${isInactive ? 'Nonaktif' : tps.status_kapasitas || tps.statusText || (isCritical ? 'Kritis' : isWarning ? 'Waspada' : 'Aman')}</span>
          </div>
          <div class="osm-popup-details">
            <p><strong>Lokasi:</strong> ${tps.lokasi || (tps.kecamatan ? `Kec. ${tps.kecamatan}` : '-')}</p>
            <p><strong>Jam Operasional:</strong> ${tps.jamOperasional || '06:00 - 20:00 WIB'}</p>
            <p><strong>Daya Tampung:</strong> ${tps.daya_tampung_m3 || tps.kapasitasM3 || '—'} m&sup3; ${tps.persentase_kapasitas != null || tps.kapasitasPersen != null ? `(${tps.persentase_kapasitas ?? tps.kapasitasPersen}%)` : ''}</p>
            <p><strong>Terakhir Diperbarui:</strong> ${tps.tanggal_update || tps.terakhirUpdate || 'Baru saja'}</p>
          </div>
          ${(tps.persentase_kapasitas != null || tps.kapasitasPersen != null) ? `
          <div class="osm-popup-bar-track">
            <div class="osm-popup-bar-fill ${badgeClass}" style="width: ${tps.persentase_kapasitas ?? tps.kapasitasPersen}%;"></div>
          </div>
          ` : ''}
          <button 
            type="button" 
            id="osm-btn-${tps.id}"
            class="osm-popup-action-btn"
          >
            Lihat Detail & Lapor Kendala &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 290,
        className: 'osm-styled-leaflet-popup'
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

      marker.addTo(markersGroup);
    });
  }, [filterStatus, tpsData, isLoading, onOpenTpsModal]);

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
          <span title="Daya tampung aman"><span className="status-dot green"></span>Aman (&le;60%)</span>
          <span title="Mendekati batas"><span className="status-dot yellow"></span>Waspada (61-79%)</span>
          <span title="Perlu pengangkutan segera"><span className="status-dot red"></span>Kritis (&ge;80%)</span>
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
          {['Semua', 'Aman', 'Waspada', 'Kritis'].map((status) => (
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
          <span>Menampilkan <strong>{tpsData.length} Titik TPA/TPS</strong> di Surabaya via OpenStreetMap</span>
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
