export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client' | 'worker';
  permissions?: string[];
  province?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthData {
  token: string;
  user: User;
}

class AuthService {
  private apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
  private authKey = 'cubana_auth';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Almacenar token y datos de usuario en localStorage
        const authData: AuthData = {
          token: data.token,
          user: data.user,
        };
        localStorage.setItem(this.authKey, JSON.stringify(authData));
        
        return {
          success: true,
          token: data.token,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error de autenticación',
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error de conexión. Verifica tu conexión a internet.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        // La API no tiene endpoint de logout, pero podríamos implementarlo
        // await fetch(`${this.apiBaseUrl}/auth/logout`, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //     'Content-Type': 'application/json',
        //   },
        // });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem(this.authKey);
      console.log('🚪 Datos de autenticación eliminados de localStorage');
    }
  }

  getToken(): string | null {
    const authData = this.getAuthData();
    return authData?.token || null;
  }

  getUser(): User | null {
    const authData = this.getAuthData();
    return authData?.user || null;
  }

  private getAuthData(): AuthData | null {
    try {
      const authDataStr = localStorage.getItem(this.authKey);
      if (!authDataStr) {
        console.log('❌ No se encontraron datos de autenticación en localStorage');
        return null;
      }
      
      const authData: AuthData = JSON.parse(authDataStr);
      
      // Validar que los datos sean válidos
      if (!authData.token || !authData.user) {
        console.log('❌ Datos de autenticación inválidos, limpiando...');
        this.clearAuthData();
        return null;
      }
      
      return authData;
    } catch (error) {
      console.error('Error parsing auth data:', error);
      this.clearAuthData();
      return null;
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.authKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();
    // Por ahora, basamos los permisos en el rol
    // Puedes expandir esto según tus necesidades
    const rolePermissions: { [key: string]: string[] } = {
      admin: ['view_remittances', 'view_clients', 'view_packages', 'manage_users', 'manage_provinces', 'manage_finances'],
      worker: ['view_remittances', 'view_clients', 'view_packages'],
      client: ['view_own_remittances', 'view_own_packages'],
    };
    
    const userRole = user?.role || 'client';
    return rolePermissions[userRole]?.includes(permission) || false;
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      // Por ahora, solo verificamos que el token existe
      // En una implementación real, podrías hacer una llamada a la API
      // para validar el token
      return true;
    } catch (error) {
      console.error('Error validando token:', error);
      return false;
    }
  }
}

export default new AuthService(); 