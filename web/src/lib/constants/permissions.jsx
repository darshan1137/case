// Permission definitions for each role
export const PERMISSIONS = {
  // Report permissions
  REPORTS_CREATE: 'reports:create',
  REPORTS_VIEW_OWN: 'reports:view_own',
  REPORTS_VIEW_ALL: 'reports:view_all',
  REPORTS_VIEW_WARD: 'reports:view_ward',
  REPORTS_VIEW_DEPARTMENT: 'reports:view_department',
  REPORTS_VALIDATE: 'reports:validate',
  REPORTS_OVERRIDE_AI: 'reports:override_ai',
  REPORTS_CLOSE: 'reports:close',
  
  // Work order permissions
  WORKORDERS_CREATE: 'workorders:create',
  WORKORDERS_VIEW_ASSIGNED: 'workorders:view_assigned',
  WORKORDERS_VIEW_WARD: 'workorders:view_ward',
  WORKORDERS_VIEW_DEPARTMENT: 'workorders:view_department',
  WORKORDERS_VIEW_ALL: 'workorders:view_all',
  WORKORDERS_ASSIGN: 'workorders:assign',
  WORKORDERS_REASSIGN: 'workorders:reassign',
  WORKORDERS_UPDATE_STATUS: 'workorders:update_status',
  WORKORDERS_VERIFY: 'workorders:verify',
  WORKORDERS_EMERGENCY: 'workorders:emergency',
  
  // Contractor permissions
  CONTRACTORS_VIEW_ASSIGNED: 'contractors:view_assigned',
  CONTRACTORS_VIEW_WARD: 'contractors:view_ward',
  CONTRACTORS_VIEW_ALL: 'contractors:view_all',
  CONTRACTORS_REGISTER: 'contractors:register',
  CONTRACTORS_APPROVE: 'contractors:approve',
  CONTRACTORS_SUSPEND: 'contractors:suspend',
  CONTRACTORS_BLACKLIST: 'contractors:blacklist',
  
  // Asset permissions
  ASSETS_VIEW: 'assets:view',
  ASSETS_CREATE: 'assets:create',
  ASSETS_UPDATE: 'assets:update',
  ASSETS_FLAG_REASSESSMENT: 'assets:flag_reassessment',
  
  // Analytics permissions
  ANALYTICS_VIEW_PUBLIC: 'analytics:view_public',
  ANALYTICS_VIEW_WARD: 'analytics:view_ward',
  ANALYTICS_VIEW_DEPARTMENT: 'analytics:view_department',
  ANALYTICS_VIEW_CITY: 'analytics:view_city',
  ANALYTICS_PREDICTIVE: 'analytics:predictive',
  
  // Budget permissions
  BUDGET_VIEW: 'budget:view',
  BUDGET_APPROVE_50K: 'budget:approve_50k',
  BUDGET_APPROVE_5L: 'budget:approve_5l',
  BUDGET_APPROVE_UNLIMITED: 'budget:approve_unlimited',
  
  // SLA permissions
  SLA_VIEW: 'sla:view',
  SLA_MODIFY_WARD: 'sla:modify_ward',
  SLA_MODIFY_CITY: 'sla:modify_city',
  
  // System permissions
  AUDIT_VIEW_OWN: 'audit:view_own',
  AUDIT_VIEW_WARD: 'audit:view_ward',
  AUDIT_VIEW_ALL: 'audit:view_all',
  DIGITAL_TWIN_ACCESS: 'digital_twin:access',
  AI_CONFIG: 'ai:config',
  INTEGRATION_APPROVE: 'integration:approve',
  
  // User management
  USERS_VIEW_WARD: 'users:view_ward',
  USERS_VIEW_DEPARTMENT: 'users:view_department',
  USERS_VIEW_ALL: 'users:view_all',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
};

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  citizen: [
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_PUBLIC,
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.SLA_VIEW,
  ],
  
  contractor: [
    PERMISSIONS.WORKORDERS_VIEW_ASSIGNED,
    PERMISSIONS.WORKORDERS_UPDATE_STATUS,
    PERMISSIONS.ANALYTICS_VIEW_PUBLIC,
    PERMISSIONS.SLA_VIEW,
  ],
  
  class_c: [
    PERMISSIONS.REPORTS_VIEW_WARD,
    PERMISSIONS.REPORTS_VALIDATE,
    PERMISSIONS.REPORTS_OVERRIDE_AI,
    PERMISSIONS.REPORTS_CLOSE,
    PERMISSIONS.WORKORDERS_CREATE,
    PERMISSIONS.WORKORDERS_VIEW_WARD,
    PERMISSIONS.WORKORDERS_ASSIGN,
    PERMISSIONS.WORKORDERS_VERIFY,
    PERMISSIONS.WORKORDERS_EMERGENCY,
    PERMISSIONS.CONTRACTORS_VIEW_WARD,
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.ASSETS_FLAG_REASSESSMENT,
    PERMISSIONS.ANALYTICS_VIEW_WARD,
    PERMISSIONS.BUDGET_APPROVE_50K,
    PERMISSIONS.SLA_VIEW,
    PERMISSIONS.AUDIT_VIEW_OWN,
    PERMISSIONS.USERS_VIEW_WARD,
  ],
  
  class_b: [
    PERMISSIONS.REPORTS_VIEW_DEPARTMENT,
    PERMISSIONS.REPORTS_VALIDATE,
    PERMISSIONS.REPORTS_OVERRIDE_AI,
    PERMISSIONS.REPORTS_CLOSE,
    PERMISSIONS.WORKORDERS_CREATE,
    PERMISSIONS.WORKORDERS_VIEW_DEPARTMENT,
    PERMISSIONS.WORKORDERS_ASSIGN,
    PERMISSIONS.WORKORDERS_REASSIGN,
    PERMISSIONS.WORKORDERS_VERIFY,
    PERMISSIONS.WORKORDERS_EMERGENCY,
    PERMISSIONS.CONTRACTORS_VIEW_ALL,
    PERMISSIONS.CONTRACTORS_REGISTER,
    PERMISSIONS.CONTRACTORS_APPROVE,
    PERMISSIONS.CONTRACTORS_SUSPEND,
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.ASSETS_FLAG_REASSESSMENT,
    PERMISSIONS.ANALYTICS_VIEW_DEPARTMENT,
    PERMISSIONS.ANALYTICS_PREDICTIVE,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.BUDGET_APPROVE_5L,
    PERMISSIONS.SLA_VIEW,
    PERMISSIONS.SLA_MODIFY_WARD,
    PERMISSIONS.AUDIT_VIEW_WARD,
    PERMISSIONS.USERS_VIEW_DEPARTMENT,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
  ],
  
  class_a: [
    // Class A has all permissions
    ...Object.values(PERMISSIONS),
  ],
};

// Check if role has permission
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
};

// Get all permissions for a role
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Budget limits by role (in INR)
export const BUDGET_LIMITS = {
  citizen: 0,
  contractor: 0,
  class_c: 50000,        // ₹50,000
  class_b: 500000,       // ₹5,00,000
  class_a: Infinity,     // Unlimited
};
