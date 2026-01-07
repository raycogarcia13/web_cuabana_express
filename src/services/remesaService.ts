export interface Remesa {
  _id: string;
  amount: number;
  cost: number;
  client: {
    _id: string;
    name: string;
    email: string;
  };
  beneficiary: {
    _id: string;
    name: string;
    phone: string;
    address: string;
    cardNumber: string;
  };
  date: string;
  destinationProvince: {
    _id: string;
    name: string;
    code: string;
  };
  status: 'Pendiente' | 'Realizado';
  description: string;
  confirmation: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRemesaData {
  amount: number;
  cost: number;
  client: string;
  beneficiary: string | {
    name: string;
    phone: string;
    address: string;
  };
  date?: string;
  destinationProvince: string;
  description?: string;
}

class RemesaService {
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

  async getAllRemesas(): Promise<Remesa[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/remesas`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo remesas:', error);
      throw error;
    }
  }

  async getRemesaById(id: string): Promise<Remesa> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/remesas/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo remesa:', error);
      throw error;
    }
  }

  async createRemesa(remesaData: CreateRemesaData): Promise<Remesa> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/remesas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(remesaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando remesa:', error);
      throw error;
    }
  }

  async updateRemesa(id: string, remesaData: Partial<Remesa>): Promise<Remesa> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/remesas/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(remesaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando remesa:', error);
      throw error;
    }
  }

  async confirmarRemesa(id: string, confirmation: string, beneficiaryData?: any): Promise<Remesa> {
    try {
      const requestBody: any = { confirmation };
      
      // Si se proporcionan datos del beneficiario, incluirlos en la petición
      if (beneficiaryData) {
        requestBody.beneficiary = beneficiaryData;
      }
      
      const response = await fetch(`${this.apiBaseUrl}/remesas/${id}/confirmar`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirmando remesa:', error);
      throw error;
    }
  }

  async deleteRemesa(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/remesas/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error eliminando remesa:', error);
      throw error;
    }
  }
}

export default new RemesaService();
