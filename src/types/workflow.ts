// Workflow status definitions
export enum TicketStatus {
  // Phase 1: Customer & Help Desk
  NEW = 'NEW',
  HELP_DESK_REVIEW = 'HELP_DESK_REVIEW',
  REJECTED_BY_HELP_DESK = 'REJECTED_BY_HELP_DESK',
  
  // Phase 2: Technician
  ASSIGNED_TO_TECHNICIAN = 'ASSIGNED_TO_TECHNICIAN',
  TECHNICIAN_REVIEW = 'TECHNICIAN_REVIEW',
  REJECTED_BY_TECHNICIAN = 'REJECTED_BY_TECHNICIAN',
  TECHNICIAN_INSPECTION = 'TECHNICIAN_INSPECTION',
  
  // Phase 3: Work Assignment & Estimation
  WORK_ANALYSIS = 'WORK_ANALYSIS',
  RCA_REPORT_ADDED = 'RCA_REPORT_ADDED',
  ESTIMATION_CREATED = 'ESTIMATION_CREATED',
  ESTIMATION_SUBMITTED = 'ESTIMATION_SUBMITTED',
  
  // Phase 4: Estimation Management
  PENDING_ESTIMATION_APPROVAL = 'PENDING_ESTIMATION_APPROVAL',
  ESTIMATION_APPROVED = 'ESTIMATION_APPROVED',
  ESTIMATION_REJECTED = 'ESTIMATION_REJECTED',
  
  // Phase 5: Finance
  PENDING_FINANCE_APPROVAL = 'PENDING_FINANCE_APPROVAL',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  INVOICE_SENT = 'INVOICE_SENT',
  
  // Phase 6: Work Execution
  WORK_STARTED = 'WORK_STARTED',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  WORK_COMPLETED = 'WORK_COMPLETED',
  COMPLETION_REPORT_UPLOADED = 'COMPLETION_REPORT_UPLOADED',
  
  // Phase 7: Closure
  PENDING_CUSTOMER_APPROVAL = 'PENDING_CUSTOMER_APPROVAL',
  CUSTOMER_SATISFIED = 'CUSTOMER_SATISFIED',
  CLOSED = 'CLOSED'
}

export interface WorkflowStep {
  status: TicketStatus;
  role: string;
  action: string;
  nextStatuses: TicketStatus[];
  description: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    status: TicketStatus.NEW,
    role: 'HELP_DESK',
    action: 'Review and approve/reject ticket',
    nextStatuses: [TicketStatus.ASSIGNED_TO_TECHNICIAN, TicketStatus.REJECTED_BY_HELP_DESK],
    description: 'Help desk reviews the submitted ticket'
  },
  {
    status: TicketStatus.ASSIGNED_TO_TECHNICIAN,
    role: 'TECHNICIAN',
    action: 'Accept/reject assignment',
    nextStatuses: [TicketStatus.TECHNICIAN_INSPECTION, TicketStatus.REJECTED_BY_TECHNICIAN],
    description: 'Technician reviews and accepts the assignment'
  },
  {
    status: TicketStatus.TECHNICIAN_INSPECTION,
    role: 'TECHNICIAN',
    action: 'Complete inspection',
    nextStatuses: [TicketStatus.WORK_ANALYSIS],
    description: 'Technician conducts on-site inspection'
  },
  {
    status: TicketStatus.WORK_ANALYSIS,
    role: 'WORK_ASSIGNEE',
    action: 'Analyze and create RCA report',
    nextStatuses: [TicketStatus.RCA_REPORT_ADDED],
    description: 'Work assignee analyzes the issue'
  },
  {
    status: TicketStatus.RCA_REPORT_ADDED,
    role: 'WORK_ASSIGNEE',
    action: 'Create estimation',
    nextStatuses: [TicketStatus.ESTIMATION_CREATED],
    description: 'Add root cause analysis report'
  },
  {
    status: TicketStatus.ESTIMATION_CREATED,
    role: 'WORK_ASSIGNEE',
    action: 'Submit estimation',
    nextStatuses: [TicketStatus.PENDING_ESTIMATION_APPROVAL],
    description: 'Create detailed cost estimation'
  },
  {
    status: TicketStatus.PENDING_ESTIMATION_APPROVAL,
    role: 'ESTIMATION_MANAGER',
    action: 'Approve/reject estimation',
    nextStatuses: [TicketStatus.PENDING_FINANCE_APPROVAL, TicketStatus.ESTIMATION_REJECTED],
    description: 'Estimation manager reviews the estimation'
  },
  {
    status: TicketStatus.PENDING_FINANCE_APPROVAL,
    role: 'FINANCE',
    action: 'Generate and send invoice',
    nextStatuses: [TicketStatus.INVOICE_SENT],
    description: 'Finance team generates invoice'
  },
  {
    status: TicketStatus.INVOICE_SENT,
    role: 'TECHNICIAN',
    action: 'Start work execution',
    nextStatuses: [TicketStatus.WORK_STARTED],
    description: 'Invoice sent to customer, ready for work'
  },
  {
    status: TicketStatus.WORK_STARTED,
    role: 'TECHNICIAN',
    action: 'Update progress',
    nextStatuses: [TicketStatus.WORK_IN_PROGRESS],
    description: 'Work execution begins'
  },
  {
    status: TicketStatus.WORK_IN_PROGRESS,
    role: 'TECHNICIAN',
    action: 'Complete work',
    nextStatuses: [TicketStatus.WORK_COMPLETED],
    description: 'Work is in progress'
  },
  {
    status: TicketStatus.WORK_COMPLETED,
    role: 'TECHNICIAN',
    action: 'Upload completion report',
    nextStatuses: [TicketStatus.COMPLETION_REPORT_UPLOADED],
    description: 'Work has been completed'
  },
  {
    status: TicketStatus.COMPLETION_REPORT_UPLOADED,
    role: 'CUSTOMER',
    action: 'Confirm satisfaction',
    nextStatuses: [TicketStatus.CUSTOMER_SATISFIED],
    description: 'Completion report uploaded'
  },
  {
    status: TicketStatus.CUSTOMER_SATISFIED,
    role: 'SYSTEM',
    action: 'Close ticket',
    nextStatuses: [TicketStatus.CLOSED],
    description: 'Customer confirms satisfaction'
  }
];