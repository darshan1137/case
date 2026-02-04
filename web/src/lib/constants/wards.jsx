// Ward and Zone definitions
export const ZONES = {
  ZONE_1: {
    id: 'zone_1',
    name: 'Zone 1 - City',
    description: 'Central city area'
  },
  ZONE_2: {
    id: 'zone_2',
    name: 'Zone 2 - Western Suburbs',
    description: 'Western suburban area'
  },
  ZONE_3: {
    id: 'zone_3',
    name: 'Zone 3 - Eastern Suburbs',
    description: 'Eastern suburban area'
  },
  ZONE_4: {
    id: 'zone_4',
    name: 'Zone 4 - South',
    description: 'Southern region'
  },
  ZONE_5: {
    id: 'zone_5',
    name: 'Zone 5 - North',
    description: 'Northern region'
  },
  ZONE_6: {
    id: 'zone_6',
    name: 'Zone 6 - Central',
    description: 'Central region'
  }
};

export const ZONES_LIST = Object.values(ZONES);

// Wards mapped to zones
export const WARDS = {
  // Zone 1 - City
  WARD_A: { id: 'ward_a', name: 'Ward A', zone: 'zone_1', population: 150000 },
  WARD_B: { id: 'ward_b', name: 'Ward B', zone: 'zone_1', population: 180000 },
  WARD_C: { id: 'ward_c', name: 'Ward C', zone: 'zone_1', population: 120000 },
  WARD_D: { id: 'ward_d', name: 'Ward D', zone: 'zone_1', population: 200000 },
  
  // Zone 2 - Western Suburbs
  WARD_E: { id: 'ward_e', name: 'Ward E', zone: 'zone_2', population: 250000 },
  WARD_F_NORTH: { id: 'ward_f_north', name: 'Ward F/North', zone: 'zone_2', population: 220000 },
  WARD_F_SOUTH: { id: 'ward_f_south', name: 'Ward F/South', zone: 'zone_2', population: 180000 },
  WARD_G_NORTH: { id: 'ward_g_north', name: 'Ward G/North', zone: 'zone_2', population: 300000 },
  WARD_G_SOUTH: { id: 'ward_g_south', name: 'Ward G/South', zone: 'zone_2', population: 280000 },
  
  // Zone 3 - Eastern Suburbs
  WARD_H_EAST: { id: 'ward_h_east', name: 'Ward H/East', zone: 'zone_3', population: 350000 },
  WARD_H_WEST: { id: 'ward_h_west', name: 'Ward H/West', zone: 'zone_3', population: 320000 },
  WARD_K_EAST: { id: 'ward_k_east', name: 'Ward K/East', zone: 'zone_3', population: 400000 },
  WARD_K_WEST: { id: 'ward_k_west', name: 'Ward K/West', zone: 'zone_3', population: 380000 },
  
  // Zone 4 - South
  WARD_L: { id: 'ward_l', name: 'Ward L', zone: 'zone_4', population: 450000 },
  WARD_M_EAST: { id: 'ward_m_east', name: 'Ward M/East', zone: 'zone_4', population: 420000 },
  WARD_M_WEST: { id: 'ward_m_west', name: 'Ward M/West', zone: 'zone_4', population: 400000 },
  
  // Zone 5 - North
  WARD_N: { id: 'ward_n', name: 'Ward N', zone: 'zone_5', population: 500000 },
  WARD_P_NORTH: { id: 'ward_p_north', name: 'Ward P/North', zone: 'zone_5', population: 480000 },
  WARD_P_SOUTH: { id: 'ward_p_south', name: 'Ward P/South', zone: 'zone_5', population: 460000 },
  WARD_R_NORTH: { id: 'ward_r_north', name: 'Ward R/North', zone: 'zone_5', population: 520000 },
  WARD_R_SOUTH: { id: 'ward_r_south', name: 'Ward R/South', zone: 'zone_5', population: 500000 },
  WARD_R_CENTRAL: { id: 'ward_r_central', name: 'Ward R/Central', zone: 'zone_5', population: 480000 },
  
  // Zone 6 - Central
  WARD_S: { id: 'ward_s', name: 'Ward S', zone: 'zone_6', population: 550000 },
  WARD_T: { id: 'ward_t', name: 'Ward T', zone: 'zone_6', population: 580000 }
};

export const WARDS_LIST = Object.values(WARDS);

// Get wards by zone
export const getWardsByZone = (zoneId) => {
  return WARDS_LIST.filter(ward => ward.zone === zoneId);
};

// Get ward by ID
export const getWardById = (wardId) => {
  return WARDS_LIST.find(ward => ward.id === wardId);
};

// Get ward name by ID
export const getWardName = (wardId) => {
  const ward = getWardById(wardId);
  return ward ? ward.name : 'Unknown Ward';
};

// Get zone by ID
export const getZoneById = (zoneId) => {
  return ZONES_LIST.find(zone => zone.id === zoneId);
};

// Get zone name by ID  
export const getZoneName = (zoneId) => {
  const zone = getZoneById(zoneId);
  return zone ? zone.name : 'Unknown Zone';
};

// Get zone for a ward
export const getZoneForWard = (wardId) => {
  const ward = getWardById(wardId);
  return ward ? ward.zone : null;
};
