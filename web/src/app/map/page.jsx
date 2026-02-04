'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import styles from './map.module.css';

let L;

const MumbaiMapContent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [loadingLayers, setLoadingLayers] = useState({});
  const [visibleLayers, setVisibleLayers] = useState({
    hospitals: true,
    schools: true,
    police: true,
    water: true,
    bmc: true,
    highways: true
  });

  // Define data sources and their styling
  const dataLayers = {
    hospitals: {
      label: '🏥 Hospitals',
      color: '#FF6B6B',
      endpoint: '/api/data/hospital',
      icon: 'hospital'
    },
    schools: {
      label: '� Schools & Bus Stops',
      color: '#4ECDC4',
      endpoint: '/api/data/school',
      icon: 'school'
    },
    police: {
      label: '� Police & Fire Station',
      color: '#FFE66D',
      endpoint: '/api/data/police',
      icon: 'police'
    },
    water: {
      label: '💧 Water & Waste',
      color: '#95E1D3',
      endpoint: '/api/data/water',
      icon: 'water'
    },
    bmc: {
      label: '� BMC Services',
      color: '#C7CEEA',
      endpoint: '/api/data/bmc',
      icon: 'bmc'
    },
    highways: {
      label: '�️ Highways & Bridges',
      color: '#FFA07A',
      endpoint: '/api/data/highway',
      icon: 'highway'
    }
  };

  useEffect(() => {
    // Initialize map - load Leaflet dynamically for client-side only
    const initMap = async () => {
      if (!L) {
        const leaflet = await import('leaflet');
        L = leaflet.default || leaflet;
      }

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current).setView([19.0760, 72.8777], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      loadData();
    };

    if (typeof window !== 'undefined') {
      initMap();
    }
  }, []);

  // Load all data files via API
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load each data layer
      for (const [key, config] of Object.entries(dataLayers)) {
        loadLayerData(key, config);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading map data:', error);
      setLoading(false);
    }
  };

  // Load individual layer data via API
  const loadLayerData = async (layerKey, config) => {
    try {
      setLoadingLayers(prev => ({ ...prev, [layerKey]: true }));

      // Fetch data from API endpoint
      const response = await fetch(config.endpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        console.log(`No elements found for ${layerKey}`);
        setLoadingLayers(prev => ({ ...prev, [layerKey]: false }));
        return;
      }

      // Filter and add markers - optimized with limit
      const markers = L.featureGroup();
      const validElements = data.elements.filter(el => el.lat && el.lon && el.tags);
      
      // Limit to 500 markers per layer for better coverage
      const limitedElements = validElements.slice(0, 500);

      limitedElements.forEach((element) => {
        // Only add relevant elements
        if (!shouldAddMarker(element, layerKey)) return;

        const popup = createPopupContent(element, layerKey);
        const emoji = getEmojiFromLabel(config.label);
        const markerIcon = createEmojiMarker(emoji, config.color);

        const marker = L.marker(
          [element.lat, element.lon],
          { icon: markerIcon }
        ).bindPopup(popup);

        markers.addLayer(marker);
      });

      // Store the layer
      if (!markersRef.current[layerKey]) {
        markersRef.current[layerKey] = markers;
      }

      // Add to map only if layer is visible
      if (mapInstanceRef.current && visibleLayers[layerKey]) {
        markers.addTo(mapInstanceRef.current);
      }

      setLoadingLayers(prev => ({ ...prev, [layerKey]: false }));
    } catch (error) {
      console.warn(`Could not load data for ${layerKey}:`, error);
      setLoadingLayers(prev => ({ ...prev, [layerKey]: false }));
    }
  };

  // Extract emoji from label
  const getEmojiFromLabel = (label) => {
    const match = label.match(/^([^\s]*)/);
    return match ? match[1] : '📍';
  };

  // Create custom emoji marker icon
  const createEmojiMarker = (emoji, color) => {
    const html = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        font-size: 18px;
        cursor: pointer;
      ">
        ${emoji}
      </div>
    `;

    return L.divIcon({
      html,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
      className: 'emoji-marker'
    });
  };

  // Update marker sizes on zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const onZoom = () => {
      const zoom = mapInstanceRef.current.getZoom();
      let size = 28;
      let fontSize = 14;

      if (zoom >= 15) {
        size = 44;
        fontSize = 24;
      } else if (zoom >= 14) {
        size = 40;
        fontSize = 22;
      } else if (zoom >= 13) {
        size = 36;
        fontSize = 18;
      } else if (zoom >= 12) {
        size = 32;
        fontSize = 16;
      } else if (zoom >= 11) {
        size = 28;
        fontSize = 14;
      } else {
        size = 24;
        fontSize = 12;
      }

      // Update all markers
      Object.values(markersRef.current).forEach(layerGroup => {
        layerGroup.eachLayer(marker => {
          if (marker.setIcon) {
            const icon = marker.getIcon();
            if (icon && icon.options.className === 'emoji-marker') {
              const html = icon.options.html;
              const emoji = html.match(/>(.*?)<\/div>/)?.[1] || '📍';
              const colorMatch = html.match(/background-color:\s*([^;]+)/);
              const bgColor = colorMatch?.[1] || '#FF6B6B';

              const newHtml = `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: ${bgColor};
                  width: ${size}px;
                  height: ${size}px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                  font-size: ${fontSize}px;
                  cursor: pointer;
                ">
                  ${emoji}
                </div>
              `;

              const newIcon = L.divIcon({
                html: newHtml,
                iconSize: [size, size],
                iconAnchor: [size / 2, size],
                popupAnchor: [0, -size],
                className: 'emoji-marker'
              });

              marker.setIcon(newIcon);
            }
          }
        });
      });
    };

    mapInstanceRef.current.on('zoomend', onZoom);
    return () => mapInstanceRef.current?.off('zoomend', onZoom);
  }, []);

  const shouldAddMarker = (element, layerKey) => {
    const tags = element.tags || {};
    
    switch (layerKey) {
      case 'hospitals':
        return tags.amenity === 'hospital' || tags.healthcare === 'hospital';
      case 'schools':
        return tags.amenity === 'school' || tags.amenity === 'bus_station';
      case 'police':
        return tags.amenity === 'police' || tags.amenity === 'fire_station';
      case 'water':
        return tags.amenity === 'toilets' || tags.amenity === 'drinking_water' || tags.amenity === 'waste';
      case 'bmc':
        return tags.operator?.includes('BMC') || tags.operator?.includes('Municipal');
      case 'highways':
        return tags.highway || tags.bridge;
      default:
        return true;
    }
  };

  // Create popup content
  const createPopupContent = (element, layerKey) => {
    const tags = element.tags || {};
    const name = tags.name || 'Unnamed';
    const description = tags.description || tags.amenity || 'No description';
    const addr = tags['addr:full'] || `${tags['addr:street'] || ''} ${tags['addr:housenumber'] || ''}`.trim() || 'No address';

    return `
      <div style="font-size: 12px; max-width: 250px;">
        <strong>${name}</strong><br/>
        <small>Type: ${description}</small><br/>
        <small>Address: ${addr}</small><br/>
        <small>Lat: ${element.lat.toFixed(4)}, Lon: ${element.lon.toFixed(4)}</small>
      </div>
    `;
  };

  // Handle layer visibility toggle
  const toggleLayer = (layerKey) => {
    const newVisibleState = !visibleLayers[layerKey];
    setVisibleLayers(prev => ({ ...prev, [layerKey]: newVisibleState }));

    const markers = markersRef.current[layerKey];
    if (!markers || !mapInstanceRef.current) {
      console.warn(`Cannot toggle layer ${layerKey}: markers or map not ready`);
      return;
    }

    if (newVisibleState) {
      mapInstanceRef.current.addLayer(markers);
      console.log(`✓ Shown layer: ${layerKey}`);
    } else {
      mapInstanceRef.current.removeLayer(markers);
      console.log(`✗ Hidden layer: ${layerKey}`);
    }
  };

  // Toggle all layers
  const toggleAllLayers = (show) => {
    const newState = {};
    Object.keys(dataLayers).forEach(key => {
      newState[key] = show;
    });
    setVisibleLayers(newState);

    Object.entries(markersRef.current).forEach(([key, markers]) => {
      if (show) {
        if (!mapInstanceRef.current.hasLayer(markers)) {
          mapInstanceRef.current.addLayer(markers);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(markers)) {
          mapInstanceRef.current.removeLayer(markers);
        }
      }
    });
    console.log(show ? '✓ Showing all layers' : '✗ Hiding all layers');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🗺️ Mumbai Infrastructure Map</h1>
        <p>Interactive map of Mumbai with infrastructure assets and services</p>
      </div>

      <div className={styles.controls}>
        <button onClick={() => toggleAllLayers(true)} className={styles.btn}>
          Show All
        </button>
        <button onClick={() => toggleAllLayers(false)} className={styles.btn}>
          Hide All
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3>Legend</h3>
          <div className={styles.legend}>
            {Object.entries(dataLayers).map(([key, config]) => {
              // Extract emoji from label
              const emojiMatch = config.label.match(/^([^\s]*)/);
              const emoji = emojiMatch ? emojiMatch[1] : '📍';
              const labelText = config.label.replace(/^[^\s]*\s*/, '');
              
              return (
                <label key={key} className={styles.legendItem}>
                  <input
                    type="checkbox"
                    checked={visibleLayers[key]}
                    onChange={() => toggleLayer(key)}
                  />
                  <span
                    className={styles.iconBox}
                    style={{
                      backgroundColor: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      opacity: visibleLayers[key] ? 1 : 0.5
                    }}
                  >
                    {emoji}
                  </span>
                  <span style={{ marginLeft: '8px', flex: 1, opacity: visibleLayers[key] ? 1 : 0.6 }}>{labelText}</span>
                  {loadingLayers[key] && <span className={styles.loading}>⏳</span>}
                </label>
              );
            })}
          </div>

          <div className={styles.info}>
            <h4>About</h4>
            <p>This map displays various infrastructure assets across Mumbai including hospitals, schools, police stations, water facilities, BMC services, and highways.</p>
            <p><strong>Data Source:</strong> OpenStreetMap (Overpass API)</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Markers/Layer:</strong> Up to 500</p>
          </div>
        </div>

        <div className={styles.mapContainer}>
          {loading && <div className={styles.loader}>Loading map data...</div>}
          <div ref={mapRef} className={styles.map}></div>
        </div>
      </div>
    </div>
  );
};

// Export with dynamic import to avoid SSR issues with Leaflet
export default dynamic(() => Promise.resolve(MumbaiMapContent), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading map...</div>
});
