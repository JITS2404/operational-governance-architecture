const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Map(); // userId -> WebSocket
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  handleConnection(ws, req) {
    // Extract token from query string
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const userId = decoded.id;
      
      // Store connection
      this.clients.set(userId, ws);
      console.log(`✅ User ${userId} connected to WebSocket`);

      ws.on('close', () => {
        this.clients.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(userId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Real-time notifications active'
      }));

    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  }

  // Send notification to specific user
  notifyUser(userId, notification) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
      return true;
    }
    return false;
  }

  // Send notification to multiple users
  notifyUsers(userIds, notification) {
    userIds.forEach(userId => this.notifyUser(userId, notification));
  }

  // Broadcast to all connected users
  broadcast(notification) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(notification));
      }
    });
  }

  // Notify about ticket updates
  notifyTicketUpdate(ticket, action, performedBy) {
    const notifications = [];

    // Notify reporter
    if (ticket.reporter_id) {
      notifications.push({
        userId: ticket.reporter_id,
        type: 'ticket_update',
        title: `Ticket ${ticket.ticket_number} Updated`,
        message: `Status changed to ${ticket.status}`,
        ticketId: ticket.id,
        action,
        performedBy
      });
    }

    // Notify assigned technician
    if (ticket.assigned_technician_id) {
      notifications.push({
        userId: ticket.assigned_technician_id,
        type: 'ticket_assigned',
        title: `New Assignment`,
        message: `You've been assigned to ${ticket.ticket_number}`,
        ticketId: ticket.id,
        action,
        performedBy
      });
    }

    notifications.forEach(notif => {
      this.notifyUser(notif.userId, notif);
    });
  }
}

module.exports = NotificationService;
