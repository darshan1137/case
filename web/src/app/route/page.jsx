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
  const routingControlRef = useRef(null);

  const GRAPHHOPPER_API_KEY = '8547d773-acee-4b26-86bb-ba4f1101fc62';

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
          <p className={styles.hint}>💡 Click map to set Point B</p>
        </div>

        <button
          className={styles.findRouteButton}
          onClick={loadRoute}
          disabled={loading}
        >
          {loading ? '🔄 Loading' : '🚀 Find Route'}
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
          </div>
        )}

        <div className={styles.info}>
          <h4>How to use:</h4>
          <ul>
            <li>Enter coordinates</li>
            <li>Click map to set end point</li>
            <li>Click "Find Route"</li>
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
