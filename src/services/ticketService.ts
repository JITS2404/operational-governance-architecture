// src/services/ticketService.ts
import DatabaseService from '@/services/databaseService';
import type { CategoryRow, LocationRow, TicketRow } from '@/types/db';

export async function getCategories(): Promise<CategoryRow[]> {
  return await DatabaseService.getCategories();
}

export async function getLocations(): Promise<LocationRow[]> {
  return await DatabaseService.getLocations();
}

export async function createTicket(ticketData: {
  title: string;
  description: string;
  priority: string;
  category_id: string;
  location_id: string;
  status?: string;
}, reporterId: string) {
  try {
    const ticket = await DatabaseService.createTicket(ticketData, reporterId);
    return ticket;
  } catch (err: any) {
    console.error('createTicket error:', err);
    throw err;
  }
}

export async function getMyTickets(userId: string, userRole?: string): Promise<TicketRow[]> {
  if (!userId) return [];
  
  // For technicians, fetch tickets assigned to them
  if (userRole === 'TECHNICIAN') {
    return await DatabaseService.getTickets({ assigned_technician_id: userId });
  }
  
  // For reporters and others, fetch tickets they created
  return await DatabaseService.getTickets({ reporter_id: userId });
}

export async function getAllTickets(): Promise<TicketRow[]> {
  return await DatabaseService.getTickets();
}

export async function getTicketById(ticketId: string) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3002/api/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ticket: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching ticket by ID:', error);
    throw error;
  }
}

export async function getTicketsByStatus(status: string): Promise<TicketRow[]> {
  return await DatabaseService.getTickets({ status });
}

export async function updateTicketStatus(ticketId: string, status: string, updatedBy: string, notes?: string) {
  return await DatabaseService.updateTicketStatus(ticketId, status, updatedBy, notes);
}

export async function assignTechnician(ticketId: string, technicianId: string, assignedBy: string) {
  return await DatabaseService.assignTechnician(ticketId, technicianId, assignedBy);
}

export async function deleteTicket(ticketId: string) {
  return await DatabaseService.deleteTicket(ticketId);
}

// Category management
export async function createCategory(payload: { name: string; description?: string }) {
  return await DatabaseService.createCategory(payload.name, payload.description);
}

export async function updateCategory(id: string, payload: { name: string; description?: string }) {
  return await DatabaseService.updateCategory(id, payload.name, payload.description);
}

export async function deleteCategory(id: string) {
  return await DatabaseService.deleteCategory(id);
}

// Location management
export async function createLocation(payload: { name: string; description?: string; address?: string }) {
  return await DatabaseService.createLocation(payload.name, payload.description, payload.address);
}

export async function updateLocation(id: string, payload: { name: string; description?: string; address?: string }) {
  return await DatabaseService.updateLocation(id, payload.name, payload.description, payload.address);
}

export async function deleteLocation(id: string) {
  return await DatabaseService.deleteLocation(id);
}

export async function getTicketsByReporter(reporterId: string): Promise<TicketRow[]> {
  return await getMyTickets(reporterId);
}

// Legacy functions for backwards compatibility
export async function requestCloseTicket(ticketId: string, userId: string, note?: string) {
  return await updateTicketStatus(ticketId, 'PENDING_CUSTOMER_APPROVAL', userId, note);
}

export async function uploadTicketAttachment(ticketId: string, file: File) {
  // For now, just return a mock response
  // In production, implement actual file upload
  return {
    id: Date.now().toString(),
    ticket_id: ticketId,
    file_name: file.name,
    file_size: file.size,
    content_type: file.type
  };
}

export async function addComment(ticketId: string, content: string, authorId: string, authorName: string) {
  // TODO: Implement comments table in database
  // For now, return mock response
  return {
    id: Date.now().toString(),
    ticket_id: ticketId,
    content,
    author_id: authorId,
    author_name: authorName,
    created_at: new Date().toISOString()
  };
}

/* default export for backwards compatibility */
const ticketService = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getLocations, createLocation, updateLocation, deleteLocation,
  createTicket, getAllTickets, getTicketsByReporter, getMyTickets,
  getTicketById, requestCloseTicket, uploadTicketAttachment, addComment, 
  deleteTicket, getTicketsByStatus, updateTicketStatus, assignTechnician
};
export default ticketService;