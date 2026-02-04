// All municipal corporation departments
export const DEPARTMENTS = {
  PUBLIC_RELATIONS: {
    id: 'public_relations',
    name: 'Public Relations Department',
    code: 'PRD',
    description: 'Handles public communications and media relations'
  },
  GENERAL_ADMIN: {
    id: 'general_admin',
    name: 'General Administration Department',
    code: 'GAD',
    description: 'Manages overall administrative functions'
  },
  IT: {
    id: 'it',
    name: 'Information and Technology Department',
    code: 'ITD',
    description: 'Manages IT infrastructure and digital services'
  },
  PLANNING: {
    id: 'planning',
    name: 'Planning Department',
    code: 'PLD',
    description: 'Handles urban planning and development'
  },
  CENTRAL_PURCHASE: {
    id: 'central_purchase',
    name: 'Central Purchase Department',
    code: 'CPD',
    description: 'Manages procurement and purchasing'
  },
  ASSESSMENT: {
    id: 'assessment',
    name: 'Assessment and Collection Department',
    code: 'ACD',
    description: 'Handles property assessment and tax collection'
  },
  SCHOOL_INFRASTRUCTURE: {
    id: 'school_infrastructure',
    name: 'School Infrastructure Cell',
    code: 'SIC',
    description: 'Manages school building and infrastructure'
  },
  ROADS_TRAFFIC: {
    id: 'roads_traffic',
    name: 'Roads and Traffic Department',
    code: 'RTD',
    description: 'Maintains roads and traffic management'
  },
  HYDRAULIC: {
    id: 'hydraulic',
    name: 'Hydraulic Engineer Department',
    code: 'HED',
    description: 'Manages water infrastructure and drainage'
  },
  ESTATE: {
    id: 'estate',
    name: 'Estate Department',
    code: 'ESD',
    description: 'Manages municipal properties and estates'
  },
  GARDENS: {
    id: 'gardens',
    name: 'Gardens Department',
    code: 'GRD',
    description: 'Maintains parks, gardens, and green spaces'
  },
  SECURITY: {
    id: 'security',
    name: 'Security Department',
    code: 'SCD',
    description: 'Handles security and safety measures'
  },
  LICENSE: {
    id: 'license',
    name: 'License Department',
    code: 'LCD',
    description: 'Issues and manages various licenses'
  },
  MARKETS: {
    id: 'markets',
    name: 'Markets Department',
    code: 'MKD',
    description: 'Manages public markets and bazaars'
  },
  ENVIRONMENT: {
    id: 'environment',
    name: 'Environment Department',
    code: 'ENV',
    description: 'Handles environmental protection and compliance'
  },
  BUSINESS_DEVELOPMENT: {
    id: 'business_development',
    name: 'Business Development Department',
    code: 'BDD',
    description: 'Promotes economic development and business growth'
  },
  EDUCATION: {
    id: 'education',
    name: 'Education Department',
    code: 'EDU',
    description: 'Manages municipal schools and education programs'
  },
  WATER_SEWAGE: {
    id: 'water_sewage',
    name: 'Water Supply and Sewage Department',
    code: 'WSD',
    description: 'Manages water supply and sewage systems'
  },
  FINANCE: {
    id: 'finance',
    name: 'Finance and Accounts Department',
    code: 'FAD',
    description: 'Handles financial management and accounting'
  },
  LEGAL: {
    id: 'legal',
    name: 'Legal and General Administration',
    code: 'LGA',
    description: 'Provides legal services and support'
  },
  PUBLIC_HEALTH: {
    id: 'public_health',
    name: 'Public Health and Sanitation',
    code: 'PHS',
    description: 'Manages public health and sanitation services'
  }
};

// Array format for dropdowns
export const DEPARTMENTS_LIST = Object.values(DEPARTMENTS);

// Get department by ID
export const getDepartmentById = (id) => {
  return DEPARTMENTS_LIST.find(dept => dept.id === id);
};

// Get department name by ID
export const getDepartmentName = (id) => {
  const dept = getDepartmentById(id);
  return dept ? dept.name : 'Unknown Department';
};
