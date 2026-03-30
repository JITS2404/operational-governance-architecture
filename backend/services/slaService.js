// SLA Configuration (in hours)
const SLA_RULES = {
  URGENT: { response: 1, resolution: 4 },
  HIGH: { response: 4, resolution: 24 },
  MEDIUM: { response: 8, resolution: 72 },
  LOW: { response: 24, resolution: 168 }
};

class SLAService {
  // Calculate SLA due date based on priority
  static calculateSLADueDate(createdAt, priority) {
    const created = new Date(createdAt);
    const resolutionHours = SLA_RULES[priority]?.resolution || SLA_RULES.MEDIUM.resolution;
    
    const dueDate = new Date(created);
    dueDate.setHours(dueDate.getHours() + resolutionHours);
    
    return dueDate;
  }

  // Check if ticket is approaching SLA breach (80% of time elapsed)
  static isApproachingSLA(createdAt, priority) {
    const now = new Date();
    const created = new Date(createdAt);
    const dueDate = this.calculateSLADueDate(createdAt, priority);
    
    const totalTime = dueDate - created;
    const elapsed = now - created;
    
    return elapsed / totalTime > 0.8;
  }

  // Check if SLA is breached
  static isSLABreached(createdAt, priority, closedAt = null) {
    const dueDate = this.calculateSLADueDate(createdAt, priority);
    const checkDate = closedAt ? new Date(closedAt) : new Date();
    
    return checkDate > dueDate;
  }

  // Get SLA status
  static getSLAStatus(ticket) {
    if (ticket.status === 'CLOSED') {
      return this.isSLABreached(ticket.created_at, ticket.priority, ticket.closed_at)
        ? 'BREACHED'
        : 'MET';
    }
    
    if (this.isSLABreached(ticket.created_at, ticket.priority)) {
      return 'BREACHED';
    }
    
    if (this.isApproachingSLA(ticket.created_at, ticket.priority)) {
      return 'WARNING';
    }
    
    return 'ON_TRACK';
  }

  // Get remaining time
  static getRemainingTime(createdAt, priority) {
    const now = new Date();
    const dueDate = this.calculateSLADueDate(createdAt, priority);
    const remaining = dueDate - now;
    
    if (remaining < 0) return 'OVERDUE';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  }

  // Auto-escalate overdue tickets
  static async escalateOverdueTickets(pool) {
    try {
      const result = await pool.query(`
        SELECT id, ticket_number, priority, created_at, assigned_technician_id
        FROM tickets
        WHERE status NOT IN ('CLOSED', 'CUSTOMER_SATISFIED')
        AND deleted_at IS NULL
      `);

      const overdueTickets = result.rows.filter(ticket => 
        this.isSLABreached(ticket.created_at, ticket.priority)
      );

      for (const ticket of overdueTickets) {
        await pool.query(`
          INSERT INTO notifications (user_id, ticket_id, type, title, message)
          SELECT id, $1, 'SLA_BREACH', 'SLA Breach Alert', 
                 'Ticket ' || $2 || ' has breached SLA'
          FROM users 
          WHERE role IN ('PLATFORM_ADMIN', 'HEAD')
        `, [ticket.id, ticket.ticket_number]);
      }

      return overdueTickets.length;
    } catch (error) {
      console.error('SLA escalation error:', error);
      return 0;
    }
  }
}

module.exports = SLAService;
