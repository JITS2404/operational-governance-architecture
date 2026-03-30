import apiService from './apiService';

class DatabaseService {
  async authenticateUser(email: string, password: string) {
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    return await response.json();
  }

  async getUsers() {
    return apiService.get('/users');
  }

  async createUser(userData: any) {
    return apiService.post('/users', userData);
  }

  async updateUser(id: string, userData: any) {
    return apiService.put(`/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return apiService.delete(`/users/${id}`);
  }

  async getCategories() {
    return apiService.get('/categories');
  }

  async createCategory(name: string, description?: string) {
    return apiService.post('/categories', { name, description });
  }

  async updateCategory(id: string, name: string, description?: string) {
    return apiService.put(`/categories/${id}`, { name, description });
  }

  async deleteCategory(id: string) {
    return apiService.delete(`/categories/${id}`);
  }

  async getLocations() {
    return apiService.get('/locations');
  }

  async createLocation(name: string, description?: string, address?: string) {
    return apiService.post('/locations', { name, description, address });
  }

  async updateLocation(id: string, name: string, description?: string, address?: string) {
    return apiService.put(`/locations/${id}`, { name, description, address });
  }

  async deleteLocation(id: string) {
    return apiService.delete(`/locations/${id}`);
  }

  async getTickets(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return apiService.get(`/tickets${params ? '?' + params : ''}`);
  }

  async getTicketById(id: string) {
    return apiService.get(`/tickets/${id}`);
  }

  async createTicket(ticketData: any, reporterId: string) {
    return apiService.post('/tickets', { ...ticketData, reporter_id: reporterId });
  }

  async updateTicket(id: string, ticketData: any) {
    return apiService.put(`/tickets/${id}`, ticketData);
  }

  async updateTicketStatus(ticketId: string, status: string, updatedBy: string, notes?: string) {
    return apiService.put(`/tickets/${ticketId}/status`, { status, updated_by: updatedBy, notes });
  }

  async assignTechnician(ticketId: string, technicianId: string, assignedBy: string) {
    return apiService.put(`/tickets/${ticketId}/assign`, { technician_id: technicianId, assigned_by: assignedBy });
  }

  async deleteTicket(id: string) {
    return apiService.delete(`/tickets/${id}`);
  }
}

export default new DatabaseService();
