const WORKFLOW_TRANSITIONS = {
  'NEW': ['ASSIGNED_TO_TECHNICIAN', 'REJECTED_BY_HELP_DESK'],
  'ASSIGNED_TO_TECHNICIAN': ['TECHNICIAN_INSPECTION', 'REJECTED_BY_TECHNICIAN'],
  'TECHNICIAN_INSPECTION': ['WORK_ANALYSIS'],
  'WORK_ANALYSIS': ['RCA_REPORT_ADDED'],
  'RCA_REPORT_ADDED': ['ESTIMATION_CREATED'],
  'ESTIMATION_CREATED': ['PENDING_ESTIMATION_APPROVAL'],
  'PENDING_ESTIMATION_APPROVAL': ['ESTIMATION_APPROVED', 'ESTIMATION_REJECTED'],
  'ESTIMATION_REJECTED': ['RCA_REPORT_ADDED'],
  'ESTIMATION_APPROVED': ['PENDING_FINANCE_APPROVAL'],
  'PENDING_FINANCE_APPROVAL': ['INVOICE_GENERATED'],
  'INVOICE_GENERATED': ['INVOICE_SENT'],
  'INVOICE_SENT': ['WORK_STARTED'],
  'WORK_STARTED': ['WORK_IN_PROGRESS'],
  'WORK_IN_PROGRESS': ['WORK_COMPLETED'],
  'WORK_COMPLETED': ['COMPLETION_REPORT_UPLOADED'],
  'COMPLETION_REPORT_UPLOADED': ['CUSTOMER_SATISFIED', 'WORK_IN_PROGRESS'],
  'CUSTOMER_SATISFIED': ['CLOSED'],
  'REJECTED_BY_TECHNICIAN': ['NEW'],
  'REJECTED_BY_HELP_DESK': ['NEW']
};

const ROLE_PERMISSIONS = {
  'PLATFORM_ADMIN': ['*'],
  'HEAD': ['NEW', 'ASSIGNED_TO_TECHNICIAN', 'PENDING_ESTIMATION_APPROVAL', 'ESTIMATION_APPROVED', 'ESTIMATION_REJECTED', 'CUSTOMER_SATISFIED', 'CLOSED'],
  'MAINTENANCE_TEAM': ['ASSIGNED_TO_TECHNICIAN', 'PENDING_ESTIMATION_APPROVAL', 'ESTIMATION_APPROVED', 'ESTIMATION_REJECTED'],
  'TECHNICIAN': ['ASSIGNED_TO_TECHNICIAN', 'TECHNICIAN_INSPECTION', 'WORK_ANALYSIS', 'RCA_REPORT_ADDED', 'ESTIMATION_CREATED', 'WORK_STARTED', 'WORK_IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETION_REPORT_UPLOADED'],
  'FINANCE_TEAM': ['PENDING_FINANCE_APPROVAL', 'INVOICE_GENERATED', 'INVOICE_SENT'],
  'REPORTER': ['CUSTOMER_SATISFIED', 'WORK_IN_PROGRESS']
};

function canTransition(currentStatus, newStatus) {
  const allowedTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

function canUserUpdateStatus(userRole, newStatus) {
  if (userRole === 'PLATFORM_ADMIN') return true;
  const allowedStatuses = ROLE_PERMISSIONS[userRole] || [];
  return allowedStatuses.includes(newStatus);
}

function validateWorkflowTransition(currentStatus, newStatus, userRole) {
  if (!canTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  if (!canUserUpdateStatus(userRole, newStatus)) {
    return {
      valid: false,
      error: `User role ${userRole} cannot set status to ${newStatus}`
    };
  }

  return { valid: true };
}

module.exports = { validateWorkflowTransition, canTransition, canUserUpdateStatus };
