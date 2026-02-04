// SLA (Service Level Agreement) configurations
export const REPORT_CATEGORIES = {
  POTHOLE: {
    id: 'pothole',
    name: 'Pothole',
    department: 'roads_traffic',
    icon: '🕳️'
  },
  ROAD_CRACK: {
    id: 'road_crack',
    name: 'Road Crack',
    department: 'roads_traffic',
    icon: '⚡'
  },
  WATER_LEAK: {
    id: 'water_leak',
    name: 'Water Leak',
    department: 'water_sewage',
    icon: '💧'
  },
  SEWAGE_OVERFLOW: {
    id: 'sewage_overflow',
    name: 'Sewage Overflow',
    department: 'water_sewage',
    icon: '🚰'
  },
  GARBAGE: {
    id: 'garbage',
    name: 'Garbage/Waste',
    department: 'public_health',
    icon: '🗑️'
  },
  STREETLIGHT: {
    id: 'streetlight',
    name: 'Streetlight Issue',
    department: 'roads_traffic',
    icon: '💡'
  },
  TREE_FALLEN: {
    id: 'tree_fallen',
    name: 'Fallen Tree',
    department: 'gardens',
    icon: '🌳'
  },
  ENCROACHMENT: {
    id: 'encroachment',
    name: 'Encroachment',
    department: 'estate',
    icon: '🏗️'
  },
  DRAINAGE: {
    id: 'drainage',
    name: 'Drainage Blockage',
    department: 'hydraulic',
    icon: '🌊'
  },
  BUILDING_VIOLATION: {
    id: 'building_violation',
    name: 'Building Violation',
    department: 'planning',
    icon: '🏢'
  },
  NOISE_POLLUTION: {
    id: 'noise_pollution',
    name: 'Noise Pollution',
    department: 'environment',
    icon: '🔊'
  },
  AIR_POLLUTION: {
    id: 'air_pollution',
    name: 'Air Pollution',
    department: 'environment',
    icon: '💨'
  },
  ILLEGAL_PARKING: {
    id: 'illegal_parking',
    name: 'Illegal Parking',
    department: 'roads_traffic',
    icon: '🚗'
  },
  PUBLIC_SAFETY: {
    id: 'public_safety',
    name: 'Public Safety Hazard',
    department: 'security',
    icon: '⚠️'
  },
  OTHER: {
    id: 'other',
    name: 'Other',
    department: 'general_admin',
    icon: '📋'
  }
};

export const CATEGORIES_LIST = Object.values(REPORT_CATEGORIES);

// Severity levels
export const SEVERITY_LEVELS = {
  LOW: {
    id: 'low',
    name: 'Low',
    color: '#10B981', // Green
    multiplier: 1.5
  },
  MEDIUM: {
    id: 'medium',
    name: 'Medium',
    color: '#F59E0B', // Yellow
    multiplier: 1.0
  },
  HIGH: {
    id: 'high',
    name: 'High',
    color: '#F97316', // Orange
    multiplier: 0.75
  },
  CRITICAL: {
    id: 'critical',
    name: 'Critical',
    color: '#EF4444', // Red
    multiplier: 0.5
  }
};

// SLA configurations by category
export const SLA_CONFIG = {
  pothole: {
    arterial: { response_hours: 6, resolution_hours: 48 },
    collector: { response_hours: 12, resolution_hours: 72 },
    local: { response_hours: 24, resolution_hours: 96 }
  },
  road_crack: {
    default: { response_hours: 24, resolution_hours: 168 } // 7 days
  },
  water_leak: {
    main_line: { response_hours: 2, resolution_hours: 24 },
    branch_line: { response_hours: 6, resolution_hours: 48 },
    connection: { response_hours: 12, resolution_hours: 72 }
  },
  sewage_overflow: {
    default: { response_hours: 4, resolution_hours: 24 }
  },
  garbage: {
    default: { response_hours: 12, resolution_hours: 72 }
  },
  streetlight: {
    default: { response_hours: 24, resolution_hours: 72 }
  },
  tree_fallen: {
    blocking_road: { response_hours: 2, resolution_hours: 12 },
    default: { response_hours: 24, resolution_hours: 72 }
  },
  encroachment: {
    default: { response_hours: 48, resolution_hours: 168 } // 7 days
  },
  drainage: {
    default: { response_hours: 6, resolution_hours: 48 }
  },
  building_violation: {
    default: { response_hours: 72, resolution_hours: 336 } // 14 days
  },
  noise_pollution: {
    default: { response_hours: 24, resolution_hours: 72 }
  },
  air_pollution: {
    default: { response_hours: 48, resolution_hours: 168 }
  },
  illegal_parking: {
    default: { response_hours: 4, resolution_hours: 24 }
  },
  public_safety: {
    default: { response_hours: 1, resolution_hours: 12 }
  },
  other: {
    default: { response_hours: 48, resolution_hours: 168 }
  }
};

// Escalation matrix
export const ESCALATION_CONFIG = {
  pothole: { 
    first_escalation: { percent: 75, to: 'class_c' },
    second_escalation: { percent: 100, to: 'class_b' }
  },
  water_leak: {
    first_escalation: { percent: 50, to: 'class_c' },
    second_escalation: { percent: 75, to: 'class_b' },
    third_escalation: { percent: 100, to: 'class_a' }
  },
  public_safety: {
    first_escalation: { percent: 50, to: 'class_b' },
    second_escalation: { percent: 75, to: 'class_a' }
  },
  default: {
    first_escalation: { percent: 75, to: 'class_c' },
    second_escalation: { percent: 100, to: 'class_b' }
  }
};

// Report statuses
export const REPORT_STATUS = {
  SUBMITTED: {
    id: 'submitted',
    name: 'Submitted',
    color: '#6B7280', // Gray
    description: 'Report received, pending validation'
  },
  ACCEPTED: {
    id: 'accepted',
    name: 'Accepted',
    color: '#3B82F6', // Blue
    description: 'AI/Officer validated, queued for assignment'
  },
  REJECTED: {
    id: 'rejected',
    name: 'Rejected',
    color: '#EF4444', // Red
    description: 'Report rejected due to invalid content'
  },
  ASSIGNED: {
    id: 'assigned',
    name: 'Assigned',
    color: '#F59E0B', // Yellow
    description: 'Contractor assigned, work order created'
  },
  IN_PROGRESS: {
    id: 'in_progress',
    name: 'In Progress',
    color: '#F97316', // Orange
    description: 'Contractor on-site, work underway'
  },
  COMPLETED: {
    id: 'completed',
    name: 'Completed',
    color: '#84CC16', // Light Green
    description: 'Contractor marked done, pending verification'
  },
  VERIFIED: {
    id: 'verified',
    name: 'Verified',
    color: '#22C55E', // Dark Green
    description: 'Officer inspected and approved'
  },
  CLOSED: {
    id: 'closed',
    name: 'Closed',
    color: '#1F2937', // Black
    description: 'Citizen feedback received, case closed'
  }
};

// Work order statuses
export const WORKORDER_STATUS = {
  CREATED: {
    id: 'created',
    name: 'Created',
    color: '#6B7280'
  },
  ASSIGNED: {
    id: 'assigned',
    name: 'Assigned',
    color: '#3B82F6'
  },
  ACCEPTED: {
    id: 'accepted',
    name: 'Accepted',
    color: '#8B5CF6'
  },
  REJECTED: {
    id: 'rejected',
    name: 'Rejected',
    color: '#EF4444'
  },
  EN_ROUTE: {
    id: 'en_route',
    name: 'En Route',
    color: '#F59E0B'
  },
  ON_SITE: {
    id: 'on_site',
    name: 'On Site',
    color: '#F97316'
  },
  IN_PROGRESS: {
    id: 'in_progress',
    name: 'In Progress',
    color: '#F97316'
  },
  DELAYED: {
    id: 'delayed',
    name: 'Delayed',
    color: '#DC2626'
  },
  COMPLETED: {
    id: 'completed',
    name: 'Completed',
    color: '#84CC16'
  },
  VERIFIED: {
    id: 'verified',
    name: 'Verified',
    color: '#22C55E'
  },
  CLOSED: {
    id: 'closed',
    name: 'Closed',
    color: '#1F2937'
  },
  REOPENED: {
    id: 'reopened',
    name: 'Reopened',
    color: '#DC2626'
  }
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: { id: 'low', name: 'Low', color: '#10B981', value: 1 },
  MEDIUM: { id: 'medium', name: 'Medium', color: '#F59E0B', value: 2 },
  HIGH: { id: 'high', name: 'High', color: '#F97316', value: 3 },
  CRITICAL: { id: 'critical', name: 'Critical', color: '#EF4444', value: 4 }
};

// Get SLA for a category
export const getSLA = (category, subType = 'default') => {
  const categorySLA = SLA_CONFIG[category];
  if (!categorySLA) return SLA_CONFIG.other.default;
  return categorySLA[subType] || categorySLA.default || SLA_CONFIG.other.default;
};

// Calculate SLA deadline
export const calculateSLADeadline = (category, severity, createdAt, type = 'resolution') => {
  const sla = getSLA(category);
  const severityConfig = SEVERITY_LEVELS[severity?.toUpperCase()] || SEVERITY_LEVELS.MEDIUM;
  
  const hours = type === 'response' ? sla.response_hours : sla.resolution_hours;
  const adjustedHours = hours * severityConfig.multiplier;
  
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + adjustedHours);
  
  return deadline;
};
