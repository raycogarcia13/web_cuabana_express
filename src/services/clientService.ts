export interface Recipient {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  bankCardNumber?: string;
}

export interface Client {
  _id: string;
  name: string;
  address: string;
  department: string;
  phone: string;
  email: string;
  recipients: Recipient[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  address: string;
  department: string;
  phone: string;
  email: string;
}

export interface UpdateClientData {
  name?: string;
  address?: string;
  department?: string;
  phone?: string;
  email?: string;
}

export interface CreateRecipientData {
  name: string;
  phone: string;
  address: string;
  bankCardNumber?: string;
}

class ClientService {
  private apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('cubana_auth');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const authData = JSON.parse(token);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    };
  }

  async getAllClients(): Promise<Client[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  }

  async getClientById(id: string): Promise<Client> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      throw error;
    }
  }

  async createClient(clientData: CreateClientData): Promise<Client> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }

  async updateClient(id: string, clientData: UpdateClientData): Promise<Client> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      throw error;
    }
  }

  async addRecipient(clientId: string, recipientData: CreateRecipientData): Promise<Client> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients/${clientId}/recipients`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recipientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error agregando destinatario:', error);
      throw error;
    }
  }

  async removeRecipient(clientId: string, recipientId: string): Promise<Client> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients/${clientId}/recipients/${recipientId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removiendo destinatario:', error);
      throw error;
    }
  }

  async getClientsCount(): Promise<number> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/clients/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error obteniendo conteo de clientes:', error);
      throw error;
    }
  }
}

export default new ClientService(); 