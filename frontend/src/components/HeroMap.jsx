import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tpsList as mockTpsList } from '../data/mockData';
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
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Aman' | 'Waspada' | 'Overload'
  const [selectedTps, setSelectedTps] = useState(null);
  const [tpsList, setTpsList] = useState(mockTpsList);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Load TPS from API on mount
  useEffect(() => {
    async function loadPublicTps() {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await fetchPublicTps();
        if (data && data.length > 0) {
          setTpsList(data);
        } else if (data === null) {
          console.warn('Failed to load from API, using mock data');
          setApiError('API tidak tersedia, menampilkan data lokal');
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

  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  // Track map zoom level
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const onZoom = () => {
      setCurrentZoom(map.getZoom());
    };
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, []);

  // Update Markers & Clusters when filterStatus, tpsList, zoom, or clustering toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const filtered = tpsList.filter((tps) => {
      if (filterStatus === 'Semua') return true;
      if (filterStatus === 'Aman') return tps.statusColor === 'green' || tps.capacity < 75;
      if (filterStatus === 'Waspada') return tps.statusColor === 'yellow' || (tps.capacity >= 75 && tps.capacity < 90);
      if (filterStatus === 'Kritis') return tps.statusColor === 'red' || tps.capacity >= 90;
      return true;
    });

    const zoom = map.getZoom();
    const shouldCluster = isClusteringEnabled && zoom <= 13;

    if (shouldCluster) {
      // Spatial grid clustering algorithm based on current zoom
      const gridSize = zoom <= 11 ? 0.055 : zoom === 12 ? 0.035 : 0.020;
      const clusters = {};

      filtered.forEach((tps) => {
        if (!tps.lat || !tps.lng) return;
        const gridKey = `${Math.floor(tps.lat / gridSize)}_${Math.floor(tps.lng / gridSize)}`;
        if (!clusters[gridKey]) {
          clusters[gridKey] = {
            items: [],
            sumLat: 0,
            sumLng: 0,
            hasCritical: false,
            hasWarning: false,
          };
        }
        clusters[gridKey].items.push(tps);
        clusters[gridKey].sumLat += tps.lat;
        clusters[gridKey].sumLng += tps.lng;
        const pct = tps.kapasitasPersen ?? 50;
        if (pct >= 80 || tps.status === 'Kritis' || tps.status === 'Merah') {
          clusters[gridKey].hasCritical = true;
        } else if (pct >= 60 || tps.status === 'Waspada' || tps.status === 'Kuning') {
          clusters[gridKey].hasWarning = true;
        }
      });

      Object.values(clusters).forEach((c) => {
        const count = c.items.length;
        const centerLat = c.sumLat / count;
        const centerLng = c.sumLng / count;

        if (count === 1) {
          renderSingleMarker(c.items[0], markersGroup);
        } else {
          // Render Cluster Bubble Marker
          const haloColor = c.hasCritical ? '#ef4444' : c.hasWarning ? '#f59e0b' : '#10b981';
          const size = Math.min(56, 38 + Math.floor(Math.log2(count) * 4));

          const clusterIcon = L.divIcon({
            className: 'osm-cluster-marker-wrapper',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${haloColor};
                color: #ffffff;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justifyContent: center;
                box-shadow: 0 4px 14px rgba(0,0,0,0.35), 0 0 0 4px rgba(255,255,255,0.85);
                font-family: inherit;
                font-weight: 800;
                cursor: pointer;
                border: 2px solid #ffffff;
                animation: pulseCluster 2.5s infinite;
              ">
                <span style="font-size: ${size > 44 ? '0.85rem' : '0.78rem'}; line-height: 1;">${count}</span>
                <span style="font-size: 0.6rem; font-weight: 700; opacity: 0.95; line-height: 1; margin-top: 2px;">TPS</span>
              </div>
            `,
          });

          const clusterMarker = L.marker([centerLat, centerLng], { icon: clusterIcon });

          // Tooltip on cluster hover
          const sampleNames = c.items.slice(0, 3).map((x) => x.nama).join(', ');
          clusterMarker.bindTooltip(
            `<strong>Kluster ${count} TPS</strong><br/><span style="font-size:0.75rem">${sampleNames}${count > 3 ? ` +${count - 3} lainnya` : ''}</span><br/><em style="font-size:0.7rem; color:#059669">Klik untuk memperbesar peta</em>`,
            { direction: 'top', offset: [0, -size / 2] }
          );

          // Click cluster -> Smooth Zoom In
          clusterMarker.on('click', () => {
            const nextZoom = Math.min(16, map.getZoom() + 2);
            map.flyTo([centerLat, centerLng], nextZoom, { duration: 0.5 });
          });

          clusterMarker.addTo(markersGroup);
        }
      });
    } else {
      // Zoomed in (>=14) or clustering disabled: Render all individual markers
      filtered.forEach((tps) => {
        renderSingleMarker(tps, markersGroup);
      });
    }

    function renderSingleMarker(tps, group) {
      if (!tps.lat || !tps.lng) return;

      const isCritical = tps.status === 'Merah';
      const isWarning = tps.status === 'Kuning';
      const badgeClass = isCritical ? 'red' : isWarning ? 'yellow' : 'green';
      const pinColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

      // Custom pulsing HTML marker
      const customIcon = L.divIcon({
        className: 'osm-custom-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
        html: `
          <div class="osm-marker-pin" style="--marker-color: ${pinColor}">
            <div class="osm-marker-pulse"></div>
            <div class="osm-marker-dot">
              <span>${tps.kapasitasPersen}%</span>
            </div>
          </div>
        `,
      });

      const marker = L.marker([tps.lat, tps.lng], { icon: customIcon });

      // Custom popup HTML
      const popupHtml = `
        <div class="osm-popup-container">
          <div class="osm-popup-title-row">
            <h4 class="osm-popup-title">${tps.nama}</h4>
            <span class="map-tooltip-badge ${badgeClass}">${tps.kapasitasPersen}% &bull; ${tps.statusText ? tps.statusText.split(' ')[0] : tps.status}</span>
          </div>
          <div class="osm-popup-details">
            <p><strong>📍 Lokasi:</strong> Kec. ${tps.kecamatan}, Kel. ${tps.kelurahan}</p>
            <p><strong>⏰ Jam Operasional:</strong> ${tps.jamOperasional}</p>
            <p><strong>📦 Daya Tampung:</strong> ${tps.kapasitasM3 || '-'} m&sup3;</p>
            <p><strong>⏱️ Terakhir Diperbarui:</strong> ${tps.terakhirUpdate}</p>
          </div>
          <div class="osm-popup-bar-track">
            <div class="osm-popup-bar-fill ${badgeClass}" style="width: ${tps.kapasitasPersen}%;"></div>
          </div>
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
  }, [filterStatus, onOpenTpsModal]);

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
            <span title="Daya tampung aman"><span className="status-dot green"></span>Aman (&le;60%)</span>
            <span title="Mendekati batas"><span className="status-dot yellow"></span>Waspada (61-79%)</span>
            <span title="Perlu pengangkutan segera"><span className="status-dot red"></span>Kritis (&ge;80%)</span>
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
              🗺️ OSM Standar
            </button>
            <button
              type="button"
              className={`osm-mode-btn ${mapType === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapType('satellite')}
              title="Tampilkan peta citra satelit OpenStreetMap"
            >
              🛰️ OSM Satelit
            </button>
          </div>

          {/* Status Filters & Cluster Toggle */}
          <div className="osm-filter-chips">
            <button
              type="button"
              className={`osm-filter-chip ${isClusteringEnabled ? 'active' : ''}`}
              onClick={() => setIsClusteringEnabled(!isClusteringEnabled)}
              title="Aktifkan/Nonaktifkan pengelompokan (clustering) marker TPS"
              style={{
                background: isClusteringEnabled ? '#047857' : 'rgba(255,255,255,0.9)',
                color: isClusteringEnabled ? '#ffffff' : '#1e293b',
                fontWeight: 700,
                border: '1px solid #10b981'
              }}
            >
              🧩 Kluster: {isClusteringEnabled ? 'ON' : 'OFF'}
            </button>
            {['Semua', 'Aman', 'Waspada', 'Kritis'].map((status) => (
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
              🎯 Reset
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
              <span className={`status-dot ${selectedTps.statusColor === 'red' ? 'red' : selectedTps.statusColor === 'yellow' ? 'yellow' : 'green'}`}></span>
              <div className="hero-map-keterangan-text">
                <div className="hero-map-keterangan-title">
                  <strong>{selectedTps.nama}</strong>
                  <span className={`map-tooltip-badge ${selectedTps.statusColor || 'green'}`} style={{ margin: 0, padding: '2px 8px', fontSize: '0.72rem' }}>
                    {selectedTps.capacity || selectedTps.kapasitasPersen}% &bull; {selectedTps.statusText || 'Aman'}
                  </span>
                </div>
                <div className="hero-map-keterangan-sub">
                  <span>📍 ${selectedTps.lokasi || (selectedTps.kecamatan ? `Kec. ${selectedTps.kecamatan}` : '-')}</span>
                  <span>&bull;</span>
                  <span>⏰ {selectedTps.jamOperasional}</span>
                  <span>&bull;</span>
                  <span>📦 Daya Tampung: {selectedTps.dayaTampungM3 || selectedTps.kapasitasM3 || '-'} m&sup3;</span>
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
              <span>📍</span>
              <span>Menampilkan <strong>{tpsList.length} Titik TPS</strong> di Surabaya via OpenStreetMap (Klik titik untuk info detail)</span>
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
