// API service for PostgreSQL backend
const API_BASE_URL = 'http://localhost:3002/api';

export class DatabaseService {
  static async authenticateUser(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    const data = await response.json();
    return data.user;
  }

  static async getUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('API not available, falling back to localStorage users');
      // Fallback to localStorage if API is not available
      const savedUsers = localStorage.getItem('system_users');
      return savedUsers ? JSON.parse(savedUsers) : [];
    }
  }

  static async getCategories() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Categories API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async getLocations() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Locations API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  static async createTicket(ticketData: any, reporterId: string) {
    console.log('Sending ticket data:', { ...ticketData, reporter_id: reporterId });
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...ticketData, reporter_id: reporterId })
    });
    
    const responseText = await response.text();
    console.log('Backend response:', response.status, responseText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText || 'Unknown error' };
      }
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return JSON.parse(responseText);
  }

  static async getTickets(filters?: any) {
    let url = `${API_BASE_URL}/tickets`;
    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      if (params.toString()) url += `?${params.toString()}`;
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    
    return await response.json();
  }

  static async updateTicketStatus(ticketId: string, status: string, updatedBy: string, notes?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, updated_by: updatedBy, notes })
    });
    return await response.json();
  }

  static async assignTechnician(ticketId: string, technicianId: string, assignedBy: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ technician_id: technicianId, assigned_by: assignedBy })
    });
    return await response.json();
  }

  static async deleteTicket(ticketId: string) {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: 'DELETE'
    });
    return await response.json();
  }

  static async createCategory(name: string, description?: string) {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    return await response.json();
  }

  static async updateCategory(id: string, name: string, description?: string) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    return await response.json();
  }

  static async deleteCategory(id: string) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  }

  static async createLocation(name: string, description?: string, address?: string) {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, address })
    });
    return await response.json();
  }

  static async updateLocation(id: string, name: string, description?: string, address?: string) {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, address })
    });
    return await response.json();
  }

  static async deleteLocation(id: string) {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  }
}

export default DatabaseService;