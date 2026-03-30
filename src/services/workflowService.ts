import { TicketStatus, WORKFLOW_STEPS } from '@/types/workflow';

interface WorkflowActionParams {
  ticketId: string;
  action: string;
  userId: string;
  data?: any;
}

export async function executeWorkflowAction(params: WorkflowActionParams) {
  const { ticketId, action, userId, data } = params;
  
  switch (action) {
    case 'VERIFY_TICKET':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.ASSIGNED_TO_TECHNICIAN, userId, 'Ticket verified by help desk');
    
    case 'ASSIGN_TECHNICIAN':
      return WorkflowService.assignTechnician(ticketId, data.technicianId, userId);
    
    case 'CREATE_QUOTATION':
      return WorkflowService.addEstimation(ticketId, data, userId);
    
    case 'APPROVE_QUOTATION':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.PENDING_ESTIMATION_APPROVAL, userId, 'Quotation approved by customer');
    
    case 'MANAGER_APPROVE_QUOTATION':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.ESTIMATION_APPROVED, userId, 'Quotation approved by manager');
    
    case 'HEAD_VALIDATE_QUOTATION':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.PENDING_FINANCE_APPROVAL, userId, 'Quotation validated by head');
    
    case 'CREATE_EXECUTION_PLAN':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.WORK_STARTED, userId, `Execution plan: ${data.planDetails}`);
    
    case 'MARK_COMPLETED':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.WORK_COMPLETED, userId, 'Work marked as completed');
    
    case 'VERIFY_COMPLETION':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.PENDING_CUSTOMER_APPROVAL, userId, 'Work verified and ready for customer approval');
    
    case 'ACCEPT_FINAL_WORK':
      return WorkflowService.updateTicketStatus(ticketId, TicketStatus.CLOSED, userId, 'Work accepted by customer');
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export class WorkflowService {
  static updateTicketStatus(ticketId: string, newStatus: TicketStatus, userId: string, notes?: string) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    const ticket = tickets[ticketIndex];
    const oldStatus = ticket.status;

    // Update ticket
    tickets[ticketIndex] = {
      ...ticket,
      status: newStatus,
      updated_at: new Date().toISOString(),
      updated_by: userId,
      ...(notes && { notes: [...(ticket.notes || []), { 
        id: Date.now().toString(),
        content: notes,
        created_by: userId,
        created_at: new Date().toISOString(),
        status_change: { from: oldStatus, to: newStatus }
      }]}),
    };

    localStorage.setItem('tickets', JSON.stringify(tickets));

    // Create workflow history entry
    this.addWorkflowHistory(ticketId, oldStatus, newStatus, userId, notes);

    return tickets[ticketIndex];
  }

  static addWorkflowHistory(ticketId: string, fromStatus: string, toStatus: string, userId: string, notes?: string) {
    const history = JSON.parse(localStorage.getItem('workflowHistory') || '[]');
    
    history.unshift({
      id: Date.now().toString(),
      ticketId,
      fromStatus,
      toStatus,
      userId,
      timestamp: new Date().toISOString(),
      notes
    });

    localStorage.setItem('workflowHistory', JSON.stringify(history.slice(0, 1000))); // Keep last 1000 entries
  }

  static getNextPossibleStatuses(currentStatus: TicketStatus): TicketStatus[] {
    const step = WORKFLOW_STEPS.find(s => s.status === currentStatus);
    return step?.nextStatuses || [];
  }

  static canUserPerformAction(userRole: string, ticketStatus: TicketStatus): boolean {
    const step = WORKFLOW_STEPS.find(s => s.status === ticketStatus);
    if (!step) return false;

    // Map user roles to workflow roles
    const roleMapping: { [key: string]: string[] } = {
      'PLATFORM_ADMIN': ['HELP_DESK', 'TECHNICIAN', 'WORK_ASSIGNEE', 'ESTIMATION_MANAGER', 'FINANCE'],
      'HEAD': ['HELP_DESK', 'ESTIMATION_MANAGER'],
      'MAINTENANCE_MANAGER': ['HELP_DESK', 'WORK_ASSIGNEE', 'ESTIMATION_MANAGER'],
      'TECHNICIAN': ['TECHNICIAN'],
      'FINANCE': ['FINANCE'],
      'REPORTER': ['CUSTOMER'],
      'TENANT': ['CUSTOMER']
    };

    const allowedRoles = roleMapping[userRole] || [];
    return allowedRoles.includes(step.role);
  }

  static getWorkflowStep(status: TicketStatus) {
    return WORKFLOW_STEPS.find(s => s.status === status);
  }

  static getTicketsByStatus(status: TicketStatus) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    return tickets.filter((t: any) => t.status === status);
  }

  static assignTechnician(ticketId: string, technicianId: string, assignedBy: string) {
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      throw new Error('Ticket not found');
    }

    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      assigned_technician_id: technicianId,
      assigned_at: new Date().toISOString(),
      assigned_by: assignedBy,
      status: TicketStatus.ASSIGNED_TO_TECHNICIAN
    };

    localStorage.setItem('tickets', JSON.stringify(tickets));
    this.addWorkflowHistory(ticketId, tickets[ticketIndex].status, TicketStatus.ASSIGNED_TO_TECHNICIAN, assignedBy, `Assigned to technician: ${technicianId}`);
    
    return tickets[ticketIndex];
  }

  static addEstimation(ticketId: string, estimation: any, createdBy: string) {
    // Store estimation
    const estimations = JSON.parse(localStorage.getItem('estimations') || '[]');
    const newEstimation = {
      id: Date.now().toString(),
      ticketId,
      ...estimation,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      status: 'DRAFT'
    };
    
    estimations.unshift(newEstimation);
    localStorage.setItem('estimations', JSON.stringify(estimations));

    // Update ticket status
    this.updateTicketStatus(ticketId, TicketStatus.ESTIMATION_CREATED, createdBy, 'Estimation created');
    
    return newEstimation;
  }

  static submitEstimation(estimationId: string, submittedBy: string) {
    const estimations = JSON.parse(localStorage.getItem('estimations') || '[]');
    const estimationIndex = estimations.findIndex((e: any) => e.id === estimationId);
    
    if (estimationIndex === -1) {
      throw new Error('Estimation not found');
    }

    estimations[estimationIndex] = {
      ...estimations[estimationIndex],
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy
    };

    localStorage.setItem('estimations', JSON.stringify(estimations));

    // Update ticket status
    const ticketId = estimations[estimationIndex].ticketId;
    this.updateTicketStatus(ticketId, TicketStatus.PENDING_ESTIMATION_APPROVAL, submittedBy, 'Estimation submitted for approval');
    
    return estimations[estimationIndex];
  }
}