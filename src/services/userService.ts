export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'worker';
  province?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client' | 'worker';
  province?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'client' | 'worker';
  province?: string;
}

export interface ChangePasswordData {
  password: string;
}

class UserService {
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

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  async changePassword(id: string, passwordData: ChangePasswordData): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${id}/password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/role/${role}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuarios por rol:', error);
      throw error;
    }
  }
}

export default new UserService(); 