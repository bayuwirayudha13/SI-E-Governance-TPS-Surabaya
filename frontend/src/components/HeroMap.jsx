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
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selectedTps, setSelectedTps] = useState(null);
  const [tpsList, setTpsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Load TPS from API on mount
  useEffect(() => {
    async function loadPublicTps() {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await fetchPublicTps();
        if (Array.isArray(data)) {
          setTpsList(data);
          if (data.length === 0) setApiError('Belum ada data TPS aktif dari server.');
        } else {
          setTpsList([]);
          setApiError('Gagal memuat data TPS dari server.');
        }
      } catch (error) {
        console.error('Error loading TPS:', error);
        setApiError('Gagal memuat data TPS');
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicTps();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeObserver = null;
    const timers = [];

    // Prevent re-initialization if map already exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: SURABAYA_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: false,
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
      const intervals = [50, 150, 300, 600, 1000];
      intervals.forEach((delay) => {
        const t = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
        timers.push(t);
      });

      // Debounced ResizeObserver to resize map smoothly without infinite loop
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

      // Also listen to window resize
      const handleWindowResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleWindowResize);

      // Return cleanup inside effect
      return () => {
        window.removeEventListener('resize', handleWindowResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (resizeDebounceTimer) {
          clearTimeout(resizeDebounceTimer);
        }
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

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const filtered = tpsList;

    // Render markers only for TPS records with valid coordinates.
    filtered.forEach((tps) => {
      renderSingleMarker(tps, markersGroup);
    });

    function renderSingleMarker(tps, group) {
      if (!Number.isFinite(tps.lat) || !Number.isFinite(tps.lng)) return;

      const isInactive = tps.status === 'Tidak Aktif';
      const badgeClass = 'gray';
      const pinColor = isInactive ? '#94a3b8' : '#64748b';

      // Custom marker identifies the TPS; occupancy is not available in the API data.
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot">
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
            <span class="map-tooltip-badge ${badgeClass}">${isInactive ? 'Nonaktif' : 'Aktif'}</span>
          </div>
          <div class="osm-popup-details">
            <p><strong>Lokasi:</strong> Kec. ${tps.kecamatan || '-'}, Kel. ${tps.kelurahan || '-'}</p>
            <p><strong>Jam Operasional:</strong> ${tps.jamOperasional || 'Belum ada data'}</p>
            <p><strong>📦 Daya Tampung Maksimum:</strong> ${tps.dayaTampungM3 != null ? `${tps.dayaTampungM3} m&sup3;` : 'Belum ada data'}</p>
            <p><strong>Terakhir Diperbarui:</strong> ${tps.terakhirUpdate || 'Belum ada data'}</p>
          </div>
          <p style="font-size: 0.75rem; color: #64748b; margin: 0 0 10px;">Persentase keterisian belum tersedia.</p>
          <button 
            type="button" 
            id="osm-btn-${tps.id}"
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

    if (mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 50);
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
    <div className="hero-map-wrapper" style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
      {/* Top Floating Controls Wrapper (Row 1: Header/Legend, Row 2: Switcher & Filters) */}
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
        {/* Row 1: Header & Legend */}
        <div
          className="map-status-bar"
          style={{
            alignSelf: 'flex-start',
            width: 'fit-content',
            maxWidth: '100%'
          }}
        >
          <div className="map-status-title">
            <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              OpenStreetMap (OSM) Surabaya
            </span>
          </div>

          {/* Legend Indicators */}
          <div className="map-status-indicators">
            <span><span className="status-dot" style={{ background: '#64748b' }}></span>Daya tampung maksimum ditampilkan di detail TPS</span>
            <span>Persentase keterisian belum tersedia</span>
          </div>
        </div>

        {/* Row 2: Filter & Layer Controls Overlay (Never overlaps Row 1) */}
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
        style={{ width: '100%', height: '480px', position: 'relative', zIndex: 1 }}
      />

      {/* Bottom Bar: Interactive TPS Keterangan / Quick Info */}
      <div className="hero-map-bottom-bar-wrap">
        {selectedTps ? (
          <div className="hero-map-bottom-keterangan">
            <div className="hero-map-keterangan-left">
              <span className="status-dot" style={{ background: '#64748b' }}></span>
              <div className="hero-map-keterangan-text">
                <div className="hero-map-keterangan-title">
                  <strong>{selectedTps.nama}</strong>
                  <span className="map-tooltip-badge gray" style={{ margin: 0, padding: '2px 8px', fontSize: '0.72rem' }}>
                    {selectedTps.status || 'Status tidak tersedia'}
                  </span>
                </div>
                <div className="hero-map-keterangan-sub">
                  <span>📍 {selectedTps.lokasi || (selectedTps.kecamatan ? `Kec. ${selectedTps.kecamatan}` : '-')}</span>
                  <span>&bull;</span>
                  <span>⏰ {selectedTps.jamOperasional || 'Jam operasional belum tersedia'}</span>
                  <span>&bull;</span>
                  <span>📦 Daya Tampung Maksimum: {selectedTps.dayaTampungM3 != null ? `${selectedTps.dayaTampungM3} m³` : 'Belum ada data'}</span>
                </div>
              </div>
            </div>

            <div className="hero-map-keterangan-right">
              <button
                type="button"
                className="hero-map-detail-btn"
                onClick={() => onOpenTpsModal && onOpenTpsModal(selectedTps)}
              >
                Lihat Detail & Lapor &rarr;
              </button>
              <button
                type="button"
                className="hero-map-close-btn"
                onClick={() => {
                  setSelectedTps(null);
                  if (mapInstanceRef.current) mapInstanceRef.current.closePopup();
                }}
                title="Tutup Keterangan"
              >
                &times;
              </button>
            </div>
          </div>
        ) : (
          <div className="hero-map-default-bar">
            <span style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconMapPin size={15} />
              <span>{isLoading ? 'Memuat data TPS dari server...' : apiError || `Menampilkan ${tpsList.length} TPS aktif dari server. Klik marker untuk melihat detail.`}</span>
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
        )}
      </div>
    </div>
  );
}
