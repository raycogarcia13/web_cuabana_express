import { handleApiError, createApiCall } from '../utils/apiErrorHandler';
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export interface Recarga {
  _id: string;
  oferta: {
    _id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    bonos: Array<{
      titulo: string;
      tipo: 'Minutos' | 'Mensajes' | 'Datos';
    }>;
  };
  client: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  phone: string;
  date: string;
  status: 'Pendiente' | 'Realizado';
  confirmation: string;
  destinationProvince: {
    _id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecargaData {
  oferta: string;
  client: string;
  phone: string;
  confirmation: string;
  destinationProvince: string;
}

export interface OfertaRecarga {
  _id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  costo: number;
  bonos: Array<{
    titulo: string;
    tipo: 'Minutos' | 'Mensajes' | 'Datos';
  }>;
  activa: boolean;
}

const getAuthHeaders = () => {
  const authData = JSON.parse(localStorage.getItem('cubana_auth') || '{}');
  return {
    'Authorization': `Bearer ${authData.token}`,
    'Content-Type': 'application/json'
  };
};

const recargaService = {
  // Obtener todas las recargas
  getAllRecargas: async (): Promise<Recarga[]> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    });
  },

  // Obtener recarga por ID
  getRecargaById: async (id: string): Promise<Recarga> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    });
  },

  // Crear nueva recarga
  createRecarga: async (recargaData: CreateRecargaData): Promise<Recarga> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recargaData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    });
  },

  // Actualizar recarga
  updateRecarga: async (id: string, recargaData: Partial<CreateRecargaData & { status: string }>): Promise<Recarga> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(recargaData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    });
  },

  // Eliminar recarga
  deleteRecarga: async (id: string): Promise<void> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
    });
  },

  // Confirmar recarga
  confirmarRecarga: async (id: string, confirmation: string): Promise<Recarga> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas/${id}/confirmar`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirmation })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    });
  },

  // Obtener recargas por cliente
  getRecargasByCliente: async (clientId: string): Promise<Recarga[]> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/recargas/cliente/${clientId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    });
  },

  // Obtener ofertas activas
  getOfertasActivas: async (): Promise<OfertaRecarga[]> => {
    return createApiCall(async () => {
      const response = await fetch(`${BASE_URL}/ofertas-recargas`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const ofertas = await response.json();
      // Filtrar solo las ofertas activas
      return ofertas.filter((oferta: OfertaRecarga) => oferta.activa);
    });
  }
};

export default recargaService;
