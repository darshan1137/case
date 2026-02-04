// Export all constants
export * from './departments';
export * from './roles';
export * from './permissions';
export * from './sla';
export * from './wards';

// Contractor service types
export const CONTRACTOR_SERVICE_TYPES = {
  ROAD_MAINTENANCE: {
    id: 'road_maintenance',
    name: 'Road Maintenance',
    categories: ['pothole', 'road_crack']
  },
  WATER_SUPPLY: {
    id: 'water_supply',
    name: 'Water Supply',
    categories: ['water_leak', 'drainage']
  },
  SEWAGE: {
    id: 'sewage',
    name: 'Sewage & Drainage',
    categories: ['sewage_overflow', 'drainage']
  },
  ELECTRICAL: {
    id: 'electrical',
    name: 'Electrical',
    categories: ['streetlight']
  },
  SANITATION: {
    id: 'sanitation',
    name: 'Sanitation',
    categories: ['garbage']
  },
  TREE_CARE: {
    id: 'tree_care',
    name: 'Tree Care & Gardens',
    categories: ['tree_fallen']
  },
  GENERAL: {
    id: 'general',
    name: 'General Maintenance',
    categories: ['other']
  }
};

export const CONTRACTOR_SERVICE_TYPES_LIST = Object.values(CONTRACTOR_SERVICE_TYPES);

// File upload limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_REPORT: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
};

// Rate limits
export const RATE_LIMITS = {
  CITIZEN_REPORTS_PER_DAY: 10,
  CITIZEN_API_REQUESTS_PER_HOUR: 100,
  CONTRACTOR_API_REQUESTS_PER_HOUR: 500,
  OFFICER_API_REQUESTS_PER_HOUR: 2000
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_WITH_TIME: 'DD MMM YYYY, HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DATE_ONLY: 'YYYY-MM-DD'
};

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 19.0760, lng: 72.8777 }, // Mumbai
  DEFAULT_ZOOM: 12,
  CLUSTER_RADIUS: 50, // meters for duplicate detection
  DUPLICATE_TIME_WINDOW: 24 * 60 * 60 * 1000 // 24 hours in ms
};
