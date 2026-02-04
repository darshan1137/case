// User roles and their definitions
export const ROLES = {
  CITIZEN: {
    id: 'citizen',
    name: 'Citizen',
    level: 0,
    description: 'Public user who can submit reports and track status'
  },
  CONTRACTOR: {
    id: 'contractor',
    name: 'Contractor',
    level: 1,
    description: 'Third-party vendor responsible for physical execution of work'
  },
  CLASS_C: {
    id: 'class_c',
    name: 'Class C Officer',
    level: 2,
    description: 'Ward/Field Level Supervisor - ground-level supervisory staff'
  },
  CLASS_B: {
    id: 'class_b',
    name: 'Class B Officer',
    level: 3,
    description: 'Department/Ward Head - mid-level decision makers'
  },
  CLASS_A: {
    id: 'class_a',
    name: 'Class A Officer',
    level: 4,
    description: 'City Commissioner - top-level authority'
  }
};

// Array format for dropdowns
export const ROLES_LIST = Object.values(ROLES);

// Officer roles only
export const OFFICER_ROLES = [ROLES.CLASS_C, ROLES.CLASS_B, ROLES.CLASS_A];

// Get role by ID
export const getRoleById = (id) => {
  return ROLES_LIST.find(role => role.id === id);
};

// Get role name by ID
export const getRoleName = (id) => {
  const role = getRoleById(id);
  return role ? role.name : 'Unknown Role';
};

// Check if user has minimum role level
export const hasMinimumRole = (userRole, requiredRole) => {
  const userRoleObj = getRoleById(userRole);
  const requiredRoleObj = getRoleById(requiredRole);
  
  if (!userRoleObj || !requiredRoleObj) return false;
  return userRoleObj.level >= requiredRoleObj.level;
};

// Check if user is an officer (Class C, B, or A)
export const isOfficer = (role) => {
  return ['class_c', 'class_b', 'class_a'].includes(role);
};

// Check if user is a senior officer (Class B or A)
export const isSeniorOfficer = (role) => {
  return ['class_b', 'class_a'].includes(role);
};
