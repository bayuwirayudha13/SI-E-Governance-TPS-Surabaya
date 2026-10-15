import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export default function KelurahanMap({
  tpsList = [],
  selectedTpsId,
  onSelectTps,
  selectedKelurahan = 'Tembok Dukuh',
  onSelectKelurahan,
  allKelurahanList = [],
  userRegisteredKelurahan = '',
  currentKecamatan = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerRefsMap = useRef({});

  const [mapType, setMapType] = useState('osm'); // 'osm' | 'satellite'
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Aman' | 'Waspada' | 'Overload'
  const [searchKelInput, setSearchKelInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPlacement, setDropdownPlacement] = useState('left');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isDropdownOpen]);

  // Compute smart dropdown alignment so it never overflows off-screen
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (window.innerWidth - rect.left < 340) {
        setDropdownPlacement('right');
      } else {
        setDropdownPlacement('left');
      }
    }
  }, [isDropdownOpen]);

  // Filter TPS based on status filter
  const filteredTps = useMemo(() => {
    return tpsList.filter((tps) => {
      if (filterStatus === 'Semua') return true;
      if (filterStatus === 'Aman') return (tps.statusColor === 'green' || tps.statusText === 'Aman' || tps.capacity < 75);
      if (filterStatus === 'Waspada') return (tps.statusColor === 'yellow' || tps.statusText === 'Waspada' || (tps.capacity >= 75 && tps.capacity < 90));
      if (filterStatus === 'Overload') return (tps.statusColor === 'red' || tps.statusText === 'Overload' || tps.capacity >= 90);
      return true;
    });
  }, [tpsList, filterStatus]);

  // Filter kelurahan dropdown options based on search input
  const filteredKelurahanOptions = useMemo(() => {
    if (!searchKelInput.trim()) return allKelurahanList.slice(0, 35);
    const q = searchKelInput.toLowerCase();
    return allKelurahanList.filter(
      (k) =>
        k.nama.toLowerCase().includes(q) ||
        (k.kecamatan && k.kecamatan.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [allKelurahanList, searchKelInput]);

  // Active selected TPS object
  const currentSelectedTps = useMemo(() => {
    return tpsList.find((t) => t.id === selectedTpsId) || tpsList[0] || null;
  }, [tpsList, selectedTpsId]);

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
      if (!tps.lat || !tps.lng) return;

      latLngBounds.push([tps.lat, tps.lng]);

      const isCritical = tps.statusColor === 'red' || tps.capacity >= 90;
      const isWarning = tps.statusColor === 'yellow' || (tps.capacity >= 75 && tps.capacity < 90);
      const isInactive = tps.status === 'Tidak Aktif';
      const badgeClass = isInactive ? 'gray' : isCritical ? 'red' : isWarning ? 'yellow' : 'green';
      const pinColor = isInactive ? '#94a3b8' : isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

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
              <span>${isInactive ? 'OFF' : `${tps.capacity || tps.kapasitasPersen}%`}</span>
            </div>
          </div>
        `
      });

      const marker = L.marker([tps.lat, tps.lng], { icon: customIcon });
      markerRefsMap.current[tps.id] = marker;

      // Popup HTML content with real data from Excel
      const popupHtml = `
        <div class="osm-popup-container" style="font-family: inherit; min-width: 250px; padding: 2px;">
          <div class="osm-popup-title-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <h4 class="osm-popup-title" style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">${tps.nama}</h4>
            <span class="map-tooltip-badge ${badgeClass}" style="margin: 0; font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; white-space: nowrap;">
              ${isInactive ? 'Nonaktif' : `${tps.capacity}% • ${tps.statusText}`}
            </span>
          </div>

          <div class="osm-popup-details" style="font-size: 0.8rem; color: #475569; display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
            <p style="margin: 0;"><strong>📍 Lokasi:</strong> ${tps.lokasi}</p>
            <p style="margin: 0;"><strong>🏛️ Kecamatan:</strong> ${tps.kecamatan} (${tps.wilayahKota || 'Surabaya'})</p>
            <p style="margin: 0;"><strong>🏘️ Kelurahan:</strong> ${tps.kelurahanList && tps.kelurahanList.length > 0 ? tps.kelurahanList.join(', ') : selectedKelurahan}</p>
            <p style="margin: 0;"><strong>🚛 Jenis:</strong> ${tps.jenisTps} &bull; ${tps.jumlahContainer}</p>
            <p style="margin: 0;"><strong>📦 Daya Tampung:</strong> ${tps.dayaTampungM3} m&sup3;</p>
            <p style="margin: 0;"><strong>⏰ Jam Operasional:</strong> ${tps.jamOperasional}</p>
          </div>

          <div class="osm-popup-bar-track" style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 10px;">
            <div class="osm-popup-bar-fill ${badgeClass}" style="width: ${tps.capacity}%; height: 100%; background: ${pinColor}; border-radius: 999px;"></div>
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
              🧭 Rute
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
    const validCoords = filteredTps.filter((t) => t.lat && t.lng).map((t) => [t.lat, t.lng]);
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
            <span style={{ fontSize: '1.35rem' }}>🏘️</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Wilayah Kelurahan
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Kelurahan {selectedKelurahan}
                {currentKecamatan ? ` (${currentKecamatan})` : ''}
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
            <span>📍</span>
            <span>{tpsList.length} Titik TPS Melayani</span>
          </div>
        </div>

        {/* Kelurahan Switcher Dropdown & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', flexWrap: 'wrap' }}>
          {userRegisteredKelurahan && userRegisteredKelurahan.toLowerCase() !== selectedKelurahan.toLowerCase() && (
            <button
              type="button"
              onClick={() => onSelectKelurahan && onSelectKelurahan(userRegisteredKelurahan)}
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Kembali ke Kelurahan tempat tinggal Anda"
            >
              🏠 Kelurahan Saya ({userRegisteredKelurahan})
            </button>
          )}

          <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen((prev) => !prev);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1.5px solid #0284c7',
                color: '#0284c7',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(2,132,199,0.1)'
              }}
            >
              <span>🔍 Ganti Kelurahan</span>
              <span style={{ fontSize: '0.7rem' }}>{isDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {isDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  ...(dropdownPlacement === 'right' ? { right: 0 } : { left: 0 }),
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '14px',
                  boxShadow: '0 14px 35px rgba(15, 23, 42, 0.22)',
                  width: '320px',
                  maxWidth: 'min(340px, calc(100vw - 40px))',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  zIndex: 9999,
                  padding: '10px'
                }}
              >
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Cari kelurahan di Surabaya..."
                    value={searchKelInput}
                    onChange={(e) => setSearchKelInput(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#f8fafc'
                    }}
                  />
                  {searchKelInput && (
                    <button
                      type="button"
                      onClick={() => setSearchKelInput('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✖
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, padding: '4px 8px' }}>
                  PILIH DARI {allKelurahanList.length} KELURAHAN SURABAYA:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredKelurahanOptions.map((k) => (
                    <button
                      key={k.id || k.nama}
                      type="button"
                      onClick={() => {
                        if (onSelectKelurahan) onSelectKelurahan(k.nama);
                        setIsDropdownOpen(false);
                        setSearchKelInput('');
                      }}
                      style={{
                        textAlign: 'left',
                        background: k.nama.toLowerCase() === selectedKelurahan.toLowerCase() ? '#f0fdf4' : 'transparent',
                        color: k.nama.toLowerCase() === selectedKelurahan.toLowerCase() ? '#166534' : '#1e293b',
                        fontWeight: k.nama.toLowerCase() === selectedKelurahan.toLowerCase() ? 700 : 500,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>Kel. {k.nama}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Kec. {k.kecamatan}</span>
                    </button>
                  ))}
                  {filteredKelurahanOptions.length === 0 && (
                    <div style={{ padding: '12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                      Kelurahan tidak ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
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
          {/* Row 1: Header & Legend */}
          <div 
            className="map-status-bar"
            style={{
              alignSelf: 'flex-start',
              width: 'fit-content',
              maxWidth: '100%',
              pointerEvents: 'auto'
            }}
          >
            <div className="map-status-title">
              <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                Peta TPS Kel. {selectedKelurahan}
              </span>
            </div>

            {/* Legend Indicators */}
            <div className="map-status-indicators">
              <span title="Daya tampung aman"><span className="status-dot green"></span>Aman (&lt;75%)</span>
              <span title="Mendekati batas"><span className="status-dot yellow"></span>Waspada (75-89%)</span>
              <span title="Perlu penanganan"><span className="status-dot red"></span>Overload (&ge;90%)</span>
            </div>
          </div>

          {/* Row 2: Filter & Layer Controls Overlay */}
          <div className="osm-map-controls-overlay" style={{ pointerEvents: 'auto' }}>
            {/* Layer Mode Switcher: OSM Standard vs Satellite */}
            <div className="osm-mode-switcher">
              <button
                type="button"
                className={`osm-mode-btn ${mapType === 'osm' ? 'active' : ''}`}
                onClick={() => setMapType('osm')}
                title="Tampilkan peta OpenStreetMap standar"
              >
                🗺️ Standar
              </button>
              <button
                type="button"
                className={`osm-mode-btn ${mapType === 'satellite' ? 'active' : ''}`}
                onClick={() => setMapType('satellite')}
                title="Tampilkan peta citra satelit"
              >
                🛰️ Satelit
              </button>
            </div>

            {/* Status Filters */}
            <div className="osm-filter-chips">
              {['Semua', 'Aman', 'Waspada', 'Overload'].map((status) => (
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
                🎯 Reset
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

        {/* Bottom Bar Indicator */}
        <div 
          className="hero-map-bottom-bar-wrap"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: '#ffffff',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          {currentSelectedTps ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentSelectedTps.dotColor || '#10b981' }}></span>
              <span>
                TPS Terpilih: <strong>{currentSelectedTps.nama}</strong> ({currentSelectedTps.capacity}%) &bull; {currentSelectedTps.lokasi}
              </span>
            </div>
          ) : (
            <span>Klik salah satu titik pin di peta untuk melihat detail TPS &amp; membuka rute penjemputan.</span>
          )}

          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${currentSelectedTps ? `${currentSelectedTps.lat},${currentSelectedTps.lng}` : encodeURIComponent(`TPS Kelurahan ${selectedKelurahan} Surabaya`)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#38bdf8',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🗺️ Buka di Google Maps &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
