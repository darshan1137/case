'use client';

import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import dynamic from 'next/dynamic';
import { mockBuildings, calculateViolation, getTotalRevenueLeak } from '@/lib/constants/mockBuildings';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import 'leaflet/dist/leaflet.css';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function RevenueAuditPage() {
  const { userData } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showViolation, setShowViolation] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [violation, setViolation] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runAIAudit = () => {
    setIsAnalyzing(true);
    setShowViolation(false);
    setAnalysisProgress(0);

    // Simulate AI processing stages
    const stages = [
      { progress: 20, message: "Fetching satellite imagery..." },
      { progress: 40, message: "Running Segment Anything Model..." },
      { progress: 60, message: "Analyzing shadow geometry..." },
      { progress: 80, message: "Calculating encroachment..." },
      { progress: 100, message: "Generating violation report..." }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setAnalysisProgress(stages[currentStage].progress);
        currentStage++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          setShowViolation(true);
          const calculatedViolation = calculateViolation(selectedBuilding);
          setViolation(calculatedViolation);
        }, 300);
      }
    }, 600);
  };

  const resetAudit = () => {
    setShowViolation(false);
    setViolation(null);
    setAnalysisProgress(0);
  };

  const selectBuilding = (building) => {
    setSelectedBuilding(building);
    resetAudit();
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading Revenue Guard AI...</p>
        </div>
      </div>
    );
  }

  const totalLeak = getTotalRevenueLeak();

  // Get navigation based on role
  const getNavigation = (role) => {
    const baseNav = {
      class_a: [
        { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
        { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
        { name: 'Reports', href: '/officer/reports', icon: '📋' },
        { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
        { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
        { name: '➕ Add Contractor', href: '/officer/contractors/add', icon: '➕' },
        { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
        { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
        { name: 'Revenue Guard AI', href: '/revenue-audit', icon: '🏛️' },
        { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
        { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
        { name: 'Team', href: '/officer/team', icon: '👥' },
        { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
        { name: 'Profile', href: '/officer/profile', icon: '👤' },
      ],
      class_b: [
        { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
        { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
        { name: 'Reports', href: '/officer/reports', icon: '📋' },
        { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
        { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
        { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
        { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
        { name: 'Revenue Guard AI', href: '/revenue-audit', icon: '🏛️' },
        { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
        { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
        { name: 'Team', href: '/officer/team', icon: '👥' },
        { name: 'Budgets', href: '/officer/budgets', icon: '💰' },
        { name: 'Profile', href: '/officer/profile', icon: '👤' },
      ],
      class_c: [
        { name: 'Dashboard', href: '/officer/dashboard', icon: '📊' },
        { name: 'Tickets', href: '/officer/tickets', icon: '🎫' },
        { name: 'Reports', href: '/officer/reports', icon: '📋' },
        { name: 'Work Orders', href: '/officer/work-orders', icon: '🔧' },
        { name: 'Contractors', href: '/officer/contractors', icon: '👷' },
        { name: 'Infrastructure Map', href: '/map', icon: '🗺️' },
        { name: 'Route Optimizer', href: '/route', icon: '🛣️' },
        { name: 'Assets', href: '/officer/assets', icon: '🏗️' },
        { name: 'Analytics', href: '/officer/analytics', icon: '📈' },
        { name: 'Profile', href: '/officer/profile', icon: '👤' },
      ]
    };
    return baseNav[role] || baseNav.class_c;
  };

  const navigation = getNavigation(userData?.role);

  const contentUI = (
    <div className="flex bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 overflow-hidden h-full">
      {/* Sidebar */}
      <div className="w-96 flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <span className="text-3xl">🏛️</span>
              Revenue Guard AI
            </h1>
            <p className="text-gray-400 text-sm">
              BMC Illegal Construction Tracker
            </p>
            <Badge className="mt-2 bg-red-600 hover:bg-red-600">
              {mockBuildings.length} Buildings Under Watch
            </Badge>
          </div>

          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue Leak Detected</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              ₹{(totalLeak / 10000000).toFixed(2)}Cr
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across {mockBuildings.length} properties
            </div>
          </div>

          <hr className="border-gray-300 dark:border-gray-700 mb-6" />

          {/* Building Info */}
          {selectedBuilding ? (
            <div className="space-y-4">
              <Card className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    {selectedBuilding.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBuilding.address}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {selectedBuilding.id}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Owner:</span>
                    <span className="text-gray-900 dark:text-white">{selectedBuilding.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ward:</span>
                    <span className="text-gray-900 dark:text-white">{selectedBuilding.ward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Inspection:</span>
                    <span className="text-gray-900 dark:text-white">{selectedBuilding.lastInspection}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Run Audit Button */}
              <Button
                onClick={runAIAudit}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Scanning via Satellite...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>🛰️</span>
                    Run AI Audit
                  </span>
                )}
              </Button>

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="bg-gray-300 dark:bg-gray-700 rounded-lg p-4">
                  <div className="w-full bg-gray-400 dark:bg-gray-600 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {analysisProgress}% Complete
                  </p>
                </div>
              )}

              {/* Violation Report */}
              {showViolation && violation && (
                <Card className="bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 animate-pulse-slow">
                  <CardHeader>
                    <CardTitle className="text-xl text-red-700 dark:text-red-300 flex items-center gap-2">
                      <span>⚠️</span>
                      VIOLATION DETECTED
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Violation Type */}
                    <div className="bg-red-200 dark:bg-red-800 rounded p-3">
                      <div className="text-xs text-red-700 dark:text-red-300 mb-1">Violation Type</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {violation.violationType}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-200 dark:bg-gray-800 rounded p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Extra Area</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {violation.extraArea} m²
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{violation.encroachmentPercent}%
                        </div>
                      </div>

                      <div className="bg-gray-200 dark:bg-gray-800 rounded p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Extra Floors</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {violation.extraFloors}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Unauthorized
                        </div>
                      </div>
                    </div>

                    {/* Height Analysis */}
                    <div className="bg-gray-200 dark:bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Shadow-Height Analysis</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expected:</span>
                          <span className="text-gray-900 dark:text-white">{violation.expectedHeight}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Detected:</span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            {violation.actualHeight}m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Shadow Length:</span>
                          <span className="text-gray-900 dark:text-white">{selectedBuilding.shadowLength}m</span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-red-300 dark:border-red-700" />

                    {/* Fine Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Horizontal Fine:</span>
                        <span className="text-white">
                          ₹{violation.horizontalFine.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Vertical Fine:</span>
                        <span className="text-white">
                          ₹{violation.verticalFine.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tax Evaded:</span>
                        <span className="text-yellow-400">
                          ₹{violation.taxEvaded.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Total Fine */}
                    <div className="bg-green-900 rounded-lg p-4 text-center">
                      <div className="text-xs text-green-300 mb-1">TOTAL PENALTY</div>
                      <div className="text-3xl font-bold text-green-400">
                        ₹{violation.totalFine.toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button className="w-full bg-gray-700 hover:bg-gray-600">
                      📄 Generate Legal Notice
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="py-8 text-center">
                <p className="text-gray-400 mb-4">
                  Select a building on the map to begin tax audit
                </p>
                <div className="text-5xl mb-4">🗺️</div>
                <p className="text-sm text-gray-500">
                  Click any green polygon to inspect property
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">
              💡 How It Works
            </h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Green = Official registered footprint</li>
              <li>• Red = AI-detected actual footprint</li>
              <li>• Click building → Run AI Audit</li>
              <li>• System analyzes satellite imagery</li>
              <li>• Calculates fines automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {mounted && (
          <MapContainer
            center={[19.0760, 72.8777]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            {/* Satellite Tile Layer */}
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              attribution='Imagery © Google'
            />

            {/* Render all buildings */}
            {mockBuildings.map((building) => (
              <Fragment key={building.id}>
                {/* Official Footprint (Green) */}
                <Polygon
                  positions={building.officialCoords}
                  pathOptions={{
                    color: selectedBuilding?.id === building.id ? '#10b981' : '#22c55e',
                    fillColor: '#22c55e',
                    fillOpacity: 0.5,
                    weight: selectedBuilding?.id === building.id ? 4 : 3,
                  }}
                  eventHandlers={{
                    click: () => selectBuilding(building),
                  }}
                >
                  <Popup>
                    <div className="text-gray-900">
                      <h3 className="font-bold">{building.name}</h3>
                      <p className="text-sm">{building.address}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Click "Run AI Audit" to analyze
                      </p>
                    </div>
                  </Popup>
                </Polygon>

                {/* Detected Footprint (Red) - Only shown after audit */}
                {showViolation && selectedBuilding?.id === building.id && (
                  <Polygon
                    positions={building.detectedCoords}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#dc2626',
                      fillOpacity: 0.4,
                      weight: 4,
                      dashArray: '10, 10',
                    }}
                  >
                    <Popup>
                      <div className="text-gray-900">
                        <h3 className="font-bold text-red-600">Violation Detected!</h3>
                        <p className="text-sm">Encroachment Area</p>
                      </div>
                    </Popup>
                  </Polygon>
                )}
              </Fragment>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-gray-800 bg-opacity-95 rounded-lg p-4 shadow-xl border border-gray-700" style={{ zIndex: 1000 }}>
          <h4 className="text-sm font-semibold mb-3 text-white">Map Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-green-500 rounded border-2 border-green-600"></div>
              <span className="text-gray-300">Official Footprint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-red-500 rounded border-2 border-red-600 opacity-50" 
                   style={{ borderStyle: 'dashed' }}></div>
              <span className="text-gray-300">Detected Encroachment</span>
            </div>
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-6 right-6 bg-gray-800 bg-opacity-95 rounded-lg p-4 shadow-xl border border-gray-700" style={{ zIndex: 1000 }}>
          <h4 className="text-sm font-semibold mb-3 text-white">System Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Properties Scanned:</span>
              <span className="text-green-400 font-semibold">{mockBuildings.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Violations Found:</span>
              <span className="text-red-400 font-semibold">{mockBuildings.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">AI Accuracy:</span>
              <span className="text-blue-400 font-semibold">94.7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout navigation={navigation} title="Revenue Guard AI">
      <div className="h-full">
        {contentUI}
      </div>
    </DashboardLayout>
  );
}
