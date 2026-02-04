/**
 * Mock Building Database for Revenue-Leak AI
 * Simulates buildings with official vs detected footprints for tax violation detection
 */

export const mockBuildings = [
  {
    id: "BMC-8821",
    name: "Regency Heights",
    address: "Bandra West, Mumbai",
    center: [19.0760, 72.8777],
    
    // Official registered data
    officialFloors: 4,
    officialArea: 450, // sqm
    registeredYear: 2018,
    
    // AI detected data
    detectedFloors: 6, // Vertical violation: 2 extra floors
    detectedArea: 580, // sqm - Horizontal encroachment
    
    // Polygon coordinates for map visualization
    officialCoords: [
      [19.0762, 72.8775],
      [19.0765, 72.8775],
      [19.0765, 72.8780],
      [19.0762, 72.8780]
    ],
    detectedCoords: [
      [19.0762, 72.8774], // Extended boundaries
      [19.0766, 72.8774],
      [19.0766, 72.8782],
      [19.0762, 72.8782]
    ],
    
    // Financial data
    marketRate: 12000, // INR per sqm
    propertyTaxPaid: 54000, // Annual tax based on official area
    
    // Metadata
    ownerName: "Regency Builders Ltd",
    ward: "H/West",
    zone: "Zone 2",
    lastInspection: "2020-03-15",
    
    // AI Analysis metadata
    satelliteImageDate: "2024-12-10",
    shadowLength: 18, // meters (indicates height)
    sunAngle: 45, // degrees at time of capture
  },
  
  {
    id: "BMC-9547",
    name: "Ocean View Apartments",
    address: "Juhu, Mumbai",
    center: [19.1075, 72.8263],
    
    officialFloors: 5,
    officialArea: 680,
    registeredYear: 2016,
    
    detectedFloors: 7, // 2 extra floors
    detectedArea: 820, // Expanded footprint
    
    officialCoords: [
      [19.1077, 72.8261],
      [19.1080, 72.8261],
      [19.1080, 72.8266],
      [19.1077, 72.8266]
    ],
    detectedCoords: [
      [19.1076, 72.8260], // Encroachment on all sides
      [19.1081, 72.8260],
      [19.1081, 72.8268],
      [19.1076, 72.8268]
    ],
    
    marketRate: 15000,
    propertyTaxPaid: 102000,
    
    ownerName: "Ocean Developers Pvt Ltd",
    ward: "H/East",
    zone: "Zone 2",
    lastInspection: "2019-08-22",
    
    satelliteImageDate: "2024-12-08",
    shadowLength: 21,
    sunAngle: 42,
  },
  
  {
    id: "BMC-7234",
    name: "Skyline Tower",
    address: "Andheri East, Mumbai",
    center: [19.1136, 72.8697],
    
    officialFloors: 8,
    officialArea: 920,
    registeredYear: 2015,
    
    detectedFloors: 11, // 3 unauthorized floors!
    detectedArea: 1150, // Major encroachment
    
    officialCoords: [
      [19.1138, 72.8695],
      [19.1142, 72.8695],
      [19.1142, 72.8700],
      [19.1138, 72.8700]
    ],
    detectedCoords: [
      [19.1137, 72.8693], // Significant expansion
      [19.1143, 72.8693],
      [19.1143, 72.8702],
      [19.1137, 72.8702]
    ],
    
    marketRate: 18000,
    propertyTaxPaid: 165600,
    
    ownerName: "Skyline Constructions",
    ward: "K/East",
    zone: "Zone 6",
    lastInspection: "2018-11-05",
    
    satelliteImageDate: "2024-12-12",
    shadowLength: 33, // Very long shadow = tall building
    sunAngle: 48,
  }
];

/**
 * Calculate violation metrics for a building
 */
export function calculateViolation(building) {
  const extraArea = building.detectedArea - building.officialArea;
  const extraFloors = building.detectedFloors - building.officialFloors;
  
  // Horizontal encroachment percentage
  const encroachmentPercent = ((extraArea / building.officialArea) * 100).toFixed(1);
  
  // Calculate fine: Extra area * market rate * penalty multiplier (2x)
  const horizontalFine = extraArea * building.marketRate * 2;
  
  // Floor violation fine: Each unauthorized floor = (official area * market rate * 3)
  const verticalFine = extraFloors * building.officialArea * building.marketRate * 3;
  
  // Total fine
  const totalFine = horizontalFine + verticalFine;
  
  // Calculate what they SHOULD have paid in property tax
  const correctTax = building.detectedArea * building.marketRate * 0.01; // 1% of value
  const taxEvaded = correctTax - building.propertyTaxPaid;
  
  // Calculate height from shadow (simplified physics)
  const buildingHeight = building.shadowLength / Math.tan(building.sunAngle * Math.PI / 180);
  const expectedHeight = building.officialFloors * 3; // 3m per floor
  const actualHeight = building.detectedFloors * 3;
  
  return {
    extraArea,
    extraFloors,
    encroachmentPercent,
    horizontalFine,
    verticalFine,
    totalFine,
    taxEvaded,
    buildingHeight: buildingHeight.toFixed(1),
    expectedHeight,
    actualHeight,
    violationType: extraFloors > 0 && extraArea > 0 
      ? "Both Horizontal & Vertical Violations" 
      : extraFloors > 0 
        ? "Vertical Violation Only"
        : "Horizontal Violation Only"
  };
}

/**
 * Get all buildings with violations
 */
export function getBuildingsWithViolations() {
  return mockBuildings.filter(b => 
    b.detectedArea > b.officialArea || b.detectedFloors > b.officialFloors
  );
}

/**
 * Get total revenue leak across all buildings
 */
export function getTotalRevenueLeak() {
  return mockBuildings.reduce((total, building) => {
    const violation = calculateViolation(building);
    return total + violation.totalFine;
  }, 0);
}
