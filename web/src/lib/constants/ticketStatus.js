// Ticket Status Constants
export const TICKET_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved'
};

// Status flow validation
export const canTransitionStatus = (currentStatus, newStatus) => {
  const transitions = {
    [TICKET_STATUS.PENDING]: [TICKET_STATUS.ASSIGNED],
    [TICKET_STATUS.ASSIGNED]: [TICKET_STATUS.IN_PROGRESS],
    [TICKET_STATUS.IN_PROGRESS]: [TICKET_STATUS.RESOLVED],
    [TICKET_STATUS.RESOLVED]: []
  };
  
  return transitions[currentStatus]?.includes(newStatus) || false;
};

// Check if user can update ticket based on role and assignment
export const canUserUpdateTicket = (userData, ticket) => {
  if (!userData || !ticket) return false;
  
  const userId = userData.id || userData.uid;
  const userRole = userData.role;
  const officerClass = userData.officer_class;
  
  // Contractors can update if assigned
  if (userRole === 'contractor' && ticket.assigned_to === userId) {
    return true;
  }
  
  // Officers with class_b can update any ticket
  if (userRole === 'officer' && officerClass === 'class_b') {
    return true;
  }
  
  // Officers with class_c can update if assigned to them
  if (userRole === 'officer' && officerClass === 'class_c' && ticket.assigned_to === userId) {
    return true;
  }
  
  return false;
};

// Get available actions for current user and ticket status
export const getAvailableTicketActions = (userData, ticket) => {
  if (!canUserUpdateTicket(userData, ticket)) return [];
  
  const actions = [];
  const status = ticket?.status || TICKET_STATUS.PENDING;
  const isClassB = userData?.role === 'officer' && userData?.officer_class === 'class_b';
  const isContractor = userData?.role === 'contractor';
  
  // Assign action: only class_b officers can assign, only when status is pending
  if (isClassB && status === TICKET_STATUS.PENDING) {
    actions.push('assign');
  }
  
  // Start action: when status is assigned (class_b, class_c assigned, or contractor assigned)
  if (status === TICKET_STATUS.ASSIGNED) {
    actions.push('start');
  }
  
  // Resolve action: when status is in_progress
  if (status === TICKET_STATUS.IN_PROGRESS) {
    actions.push('resolve');
  }
  
  return actions;
};

// Status badge color mapping
export const getTicketStatusColor = (status) => {
  const colors = {
    [TICKET_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TICKET_STATUS.ASSIGNED]: 'bg-blue-100 text-blue-800',
    [TICKET_STATUS.IN_PROGRESS]: 'bg-orange-100 text-orange-800',
    [TICKET_STATUS.RESOLVED]: 'bg-green-100 text-green-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Status display names
export const getTicketStatusName = (status) => {
  const names = {
    [TICKET_STATUS.PENDING]: 'Pending',
    [TICKET_STATUS.ASSIGNED]: 'Assigned',
    [TICKET_STATUS.IN_PROGRESS]: 'In Progress',
    [TICKET_STATUS.RESOLVED]: 'Resolved'
  };
  return names[status] || status;
};
