export interface Province {
  _id: string;
  name: string;
  code: string;
  workers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProvinceData {
  name: string;
  code: string;
}

export interface UpdateProvinceData {
  name?: string;
  code?: string;
  active?: boolean;
}

class ProvinceService {
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

  async getAllProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo provincias:', error);
      throw error;
    }
  }

  async getProvinceById(id: string): Promise<Province> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo provincia:', error);
      throw error;
    }
  }

  async createProvince(provinceData: CreateProvinceData): Promise<Province> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(provinceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando provincia:', error);
      throw error;
    }
  }

  async updateProvince(id: string, provinceData: UpdateProvinceData): Promise<Province> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(provinceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando provincia:', error);
      throw error;
    }
  }

  async deleteProvince(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error eliminando provincia:', error);
      throw error;
    }
  }

  async getWorkersByProvince(id: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces/${id}/workers`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo trabajadores de provincia:', error);
      throw error;
    }
  }

  async assignWorkerToProvince(provinceId: string, workerId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces/${provinceId}/workers`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ workerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error asignando trabajador a provincia:', error);
      throw error;
    }
  }

  async removeWorkerFromProvince(provinceId: string, workerId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/provinces/${provinceId}/workers`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ workerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error removiendo trabajador de provincia:', error);
      throw error;
    }
  }
}

export default new ProvinceService(); 