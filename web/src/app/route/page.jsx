'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import 'leaflet/dist/leaflet.css';
import styles from './route.module.css';

// Get navigation based on role
const getNavigation = (role) => {
  const baseNav = {
    citizen: [
      { name: 'Dashboard', href: '/citizen/dashboard', icon: '📊' },
      { name: 'New Report', href: '/citizen/reports/new', icon: '📝' },
      { name: 'My Reports', href: '/citizen/reports', icon: '📋' },
      { name: 'Track Status', href: '/citizen/track', icon: '🔍' },
      { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
      { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
      { name: 'Profile', href: '/citizen/profile', icon: '👤' },
    ],
    contractor: [
      { name: 'Dashboard', href: '/contractor/dashboard', icon: '📊' },
      { name: 'Assigned Jobs', href: '/contractor/jobs', icon: '📋' },
      { name: 'Active Jobs', href: '/contractor/jobs/active', icon: '🔨' },
      { name: 'Completed', href: '/contractor/jobs/completed', icon: '✅' },
      { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
      { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
      { name: 'Performance', href: '/contractor/performance', icon: '📈' },
      { name: 'Profile', href: '/contractor/profile', icon: '👤' },
    ],
    class_a: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { name: 'Reports', href: '/admin/reports', icon: '📋' },
      { name: 'Work Orders', href: '/admin/work-orders', icon: '🔧' },
      { name: 'Users', href: '/admin/users', icon: '👥' },
      { name: 'Contractors', href: '/admin/contractors', icon: '👷' },
      { name: 'Departments', href: '/admin/departments', icon: '🏛️' },
      { name: 'Infrastructure Map', href: '/map', icon: '🌍' },
      { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
      { name: 'Assets', href: '/admin/assets', icon: '🏗️' },
      { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
      { name: 'SLA Config', href: '/admin/sla', icon: '⏱️' },
      { name: 'Audit Logs', href: '/admin/audit', icon: '📝' },
      { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ],
  };
  return baseNav[role] || [];
};

const OptimizedRouteContent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [pointA, setPointA] = useState({ lat: 19.0760, lng: 72.8777 });
  const [pointB, setPointB] = useState({ lat: 19.1234, lng: 72.9876 });
  const [loading, setLoading] = useState(true);
  const [routeLoaded, setRouteLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState('');
  const [simulationMode, setSimulationMode] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const routingControlRef = useRef(null);

  const GRAPHHOPPER_API_KEY = '8547d773-acee-4b26-86bb-ba4f1101fc62';

  // Mumbai simulation scenarios
  const scenarios = {
    normal: {
      name: 'Normal Traffic',
      description: 'Regular traffic conditions with optimal route selection',
      reason: 'Fastest route with minimal congestion',
      routes: [
        {
          coordinates: [
            [72.8777, 19.0760], [72.8800, 19.0780], [72.8850, 19.0820],
            [72.8900, 19.0870], [72.8950, 19.0920], [72.9000, 19.0980],
            [72.9050, 19.1050], [72.9100, 19.1120], [72.9150, 19.1180],
            [72.9876, 19.1234]
          ],
          distance: 8.5,
          time: 25,
          color: '#1a73e8'
        }
      ]
    },
    festival: {
      name: 'Festival/Event',
      description: 'Ganesh Chaturthi procession blocking main roads',
      reason: 'Avoiding Dadar and Parel due to festival processions. Rerouting via Eastern Express Highway.',
      routes: [
        {
          coordinates: [
            [72.8777, 19.0760], [72.8820, 19.0740], [72.8900, 19.0720],
            [72.8980, 19.0710], [72.9100, 19.0720], [72.9250, 19.0780],
            [72.9400, 19.0860], [72.9550, 19.0950], [72.9700, 19.1070],
            [72.9800, 19.1150], [72.9876, 19.1234]
          ],
          distance: 12.3,
          time: 38,
          color: '#ff6f00'
        }
      ]
    },
    roadwork: {
      name: 'Road Construction',
      description: 'BMC road repair work on Western Express Highway',
      reason: 'Western Express Highway closed for metro construction. Using Andheri-Ghatkopar Link Road instead.',
      routes: [
        {
          coordinates: [
            [72.8777, 19.0760], [72.8750, 19.0800], [72.8720, 19.0860],
            [72.8700, 19.0920], [72.8720, 19.1000], [72.8780, 19.1080],
            [72.8900, 19.1130], [72.9100, 19.1170], [72.9350, 19.1200],
            [72.9600, 19.1220], [72.9876, 19.1234]
          ],
          distance: 10.8,
          time: 42,
          color: '#ff9800'
        }
      ]
    },
    flooding: {
      name: 'Monsoon Flooding',
      description: 'Heavy rainfall causing waterlogging in low-lying areas',
      reason: 'Avoiding Hindmata, Sion and Kings Circle due to severe waterlogging. Taking elevated routes.',
      routes: [
        {
          coordinates: [
            [72.8777, 19.0760], [72.8850, 19.0750], [72.8950, 19.0760],
            [72.9050, 19.0800], [72.9150, 19.0880], [72.9250, 19.0970],
            [72.9350, 19.1050], [72.9500, 19.1100], [72.9650, 19.1150],
            [72.9750, 19.1190], [72.9876, 19.1234]
          ],
          distance: 11.5,
          time: 48,
          color: '#2196f3'
        }
      ]
    },
    accident: {
      name: 'Traffic Accident',
      description: 'Multi-vehicle collision on Santacruz-Chembur Link Road',
      reason: 'Major accident at Kurla junction causing 2+ hour delays. Rerouting via Jogeshwari-Vikhroli Link Road.',
      routes: [
        {
          coordinates: [
            [72.8777, 19.0760], [72.8800, 19.0820], [72.8850, 19.0900],
            [72.8950, 19.0980], [72.9100, 19.1020], [72.9300, 19.1050],
            [72.9500, 19.1100], [72.9650, 19.1160], [72.9750, 19.1200],
            [72.9876, 19.1234]
          ],
          distance: 9.8,
          time: 35,
          color: '#d32f2f'
        }
      ]
    },
    vip_movement: {
      name: 'VIP Movement',
      description: 'High-security convoy route closure',
      reason: 'Mumbai-Pune Expressway entry restricted due to VIP movement. Using local arterial roads.',
      routes: [
        {
          coordinates: [
            [72.8777, 19.0760], [72.8820, 19.0790], [72.8880, 19.0840],
            [72.8920, 19.0900], [72.8980, 19.0970], [72.9080, 19.1040],
            [72.9200, 19.1090], [72.9400, 19.1140], [72.9600, 19.1180],
            [72.9750, 19.1210], [72.9876, 19.1234]
          ],
          distance: 10.2,
          time: 40,
          color: '#9c27b0'
        }
      ]
    }
  };

  useEffect(() => {
    const initMap = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Import Leaflet
        const leaflet = await import('leaflet');
        const L = leaflet.default;
        
        // Make L available globally BEFORE importing plugins
        window.L = L;

        // Import Leaflet Routing Machine
        await import('leaflet-routing-machine');
        // Import GraphHopper router
        await import('lrm-graphhopper');

        // Load CSS
        await import('leaflet-routing-machine/dist/leaflet-routing-machine.css');

        // Note: L.Routing is now populated by the plugin on the global L object

        if (mapInstanceRef.current) {
          setLoading(false);
          return;
        }

        // Initialize map
        const map = L.map(mapRef.current).setView([19.0760, 72.8777], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setLoading(false);

        // Add click handler
        map.on('click', (e) => {
          setPointB({
            lat: parseFloat(e.latlng.lat.toFixed(4)),
            lng: parseFloat(e.latlng.lng.toFixed(4)),
          });
        });
      } catch (err) {
        console.error('Map initialization error:', err);
        setError(`Failed to load map: ${err.message}`);
        setLoading(false);
      }
    };

    initMap();
  }, []);

  const loadRoute = async () => {
    if (!mapInstanceRef.current) return;

    try {
      setError('');
      setLoading(true);

      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      const L = window.L;

      if (!L.Routing) {
        throw new Error('Routing library not loaded');
      }

      // Simulation mode
      if (simulationMode) {
        const scenario = scenarios[selectedScenario];
        
        // Clear existing routes
        mapInstanceRef.current.eachLayer((layer) => {
          if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });

        // Add markers for start and end
        L.marker([pointA.lat, pointA.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #4CAF50; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">A</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapInstanceRef.current).bindPopup('Start Point');

        L.marker([pointB.lat, pointB.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #f44336; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">B</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapInstanceRef.current).bindPopup('End Point');

        // Draw simulated routes
        scenario.routes.forEach((route, idx) => {
          const polyline = L.polyline(
            route.coordinates.map(coord => [coord[1], coord[0]]),
            {
              color: route.color,
              weight: 5,
              opacity: 0.7,
              smoothFactor: 1
            }
          ).addTo(mapInstanceRef.current);

          // Add popup to route
          polyline.bindPopup(`
            <div style="font-size: 13px;">
              <strong>${scenario.name}</strong><br/>
              <strong>Distance:</strong> ${route.distance} km<br/>
              <strong>Time:</strong> ${route.time} min<br/>
              <strong>Reason:</strong> ${scenario.reason}
            </div>
          `);
        });

        // Set route info
        setRouteInfo({
          distance: scenario.routes[0].distance.toFixed(2),
          time: scenario.routes[0].time,
          scenario: scenario.name,
          reason: scenario.reason
        });

        setRouteLoaded(true);
        setLoading(false);

        // Fit bounds
        const bounds = L.latLngBounds([
          [pointA.lat, pointA.lng],
          [pointB.lat, pointB.lng]
        ]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [100, 100] });

        return;
      }

      // Real mode with GraphHopper
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(pointA.lat, pointA.lng),
          L.latLng(pointB.lat, pointB.lng),
        ],
        router: L.Routing.graphHopper(GRAPHHOPPER_API_KEY),
        routeWhileDragging: true,
        showAlternatives: false,
        lineOptions: {
          styles: [
            { color: '#1a73e8', opacity: 0.7, weight: 5 }
          ]
        }
      });

      routingControlRef.current.on('routesfound', (e) => {
        if (e.routes && e.routes.length > 0) {
          const route = e.routes[0];
          const distance = (route.summary.totalDistance / 1000).toFixed(2);
          const time = Math.round(route.summary.totalTime / 60);

          setRouteInfo({
            distance,
            time,
            instructions: route.instructions || [],
          });
          setRouteLoaded(true);
        }
      });

      routingControlRef.current.on('routingerror', (e) => {
        console.error('Routing error:', e);
        setError('Unable to find route. Check coordinates.');
        setRouteLoaded(false);
      });

      routingControlRef.current.addTo(mapInstanceRef.current);

      const bounds = L.latLngBounds([
        [pointA.lat, pointA.lng],
        [pointB.lat, pointB.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [100, 100] });
    } catch (err) {
      console.error('Route error:', err);
      setError(`Error: ${err.message}`);
      setRouteLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePointAChange = (field, value) => {
    setPointA((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handlePointBChange = (field, value) => {
    setPointB((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const swapPoints = () => {
    const temp = pointA;
    setPointA(pointB);
    setPointB(temp);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPointA({
          lat: parseFloat(position.coords.latitude.toFixed(4)),
          lng: parseFloat(position.coords.longitude.toFixed(4)),
        });
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      }
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h1>🗺️ Optimized Route</h1>
          <p>Fastest path between two points</p>
        </div>

        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${!simulationMode ? styles.active : ''}`}
            onClick={() => {
              setSimulationMode(false);
              setRouteLoaded(false);
              setRouteInfo(null);
            }}
          >
            🌐 Real Mode
          </button>
          <button
            className={`${styles.modeButton} ${simulationMode ? styles.active : ''}`}
            onClick={() => {
              setSimulationMode(true);
              setRouteLoaded(false);
              setRouteInfo(null);
            }}
          >
            🎮 Simulation
          </button>
        </div>

        {simulationMode && (
          <div className={styles.scenarioSelect}>
            <label>Select Scenario</label>
            <select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                setRouteLoaded(false);
                setRouteInfo(null);
              }}
            >
              <option value="normal">Normal Traffic</option>
              <option value="festival">Festival/Event</option>
              <option value="roadwork">Road Construction</option>
              <option value="flooding">Monsoon Flooding</option>
              <option value="accident">Traffic Accident</option>
              <option value="vip_movement">VIP Movement</option>
            </select>
            {scenarios[selectedScenario] && (
              <div className={styles.scenarioInfo}>
                <h4>📋 {scenarios[selectedScenario].name}</h4>
                <p>{scenarios[selectedScenario].description}</p>
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <h3>Point A (Start)</h3>
          <div className={styles.inputGroup}>
            <label>Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={pointA.lat}
              onChange={(e) => handlePointAChange('lat', e.target.value)}
              placeholder="19.0760"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={pointA.lng}
              onChange={(e) => handlePointAChange('lng', e.target.value)}
              placeholder="72.8777"
            />
          </div>
          <button className={styles.button} onClick={useCurrentLocation}>
            📍 Current Location
          </button>
        </div>

        <div className={styles.swapContainer}>
          <button className={styles.swapButton} onClick={swapPoints}>
            ⇅ Swap
          </button>
        </div>

        <div className={styles.section}>
          <h3>Point B (End)</h3>
          <div className={styles.inputGroup}>
            <label>Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={pointB.lat}
              onChange={(e) => handlePointBChange('lat', e.target.value)}
              placeholder="19.1234"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={pointB.lng}
              onChange={(e) => handlePointBChange('lng', e.target.value)}
              placeholder="72.9876"
            />
          </div>
          {!simulationMode && <p className={styles.hint}>💡 Click map to set Point B</p>}
        </div>

        <button
          className={styles.findRouteButton}
          onClick={loadRoute}
          disabled={loading}
        >
          {loading ? '🔄 Loading' : simulationMode ? '🎮 Run Simulation' : '🚀 Find Route'}
        </button>

        {error && <div className={styles.error}>{error}</div>}

        {routeLoaded && routeInfo && (
          <div className={styles.routeInfo}>
            <h3>Route Details</h3>
            <div className={styles.stat}>
              <span>📏 Distance:</span>
              <strong>{routeInfo.distance} km</strong>
            </div>
            <div className={styles.stat}>
              <span>⏱️ Duration:</span>
              <strong>{routeInfo.time} min</strong>
            </div>
            {simulationMode && routeInfo.scenario && (
              <>
                <div className={styles.stat}>
                  <span>📊 Scenario:</span>
                  <strong>{routeInfo.scenario}</strong>
                </div>
                <div className={styles.scenarioInfo} style={{ marginTop: '10px' }}>
                  <h4>🎯 Route Selection Reason</h4>
                  <p>{routeInfo.reason}</p>
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.info}>
          <h4>How to use:</h4>
          <ul>
            <li>Toggle between Real and Simulation mode</li>
            <li>Enter coordinates or click map</li>
            <li>In Simulation: Select traffic scenario</li>
            <li>Click "Find Route" or "Run Simulation"</li>
          </ul>
        </div>
      </div>

      <div className={styles.mapContainer}>
        {loading && <div className={styles.loader}>Loading map...</div>}
        <div ref={mapRef} className={styles.map} />
      </div>
    </div>
  );
};

const RoutePage = () => {
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/auth/login');
    }
  }, [userData, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const navigation = getNavigation(userData.role);

  return (
    <DashboardLayout navigation={navigation} title="Route Optimizer">
      <OptimizedRouteContent />
    </DashboardLayout>
  );
};

export default dynamic(() => Promise.resolve(RoutePage), {
  ssr: false,
  loading: () => <div style={{ padding: '20px' }}>Loading...</div>,
});
