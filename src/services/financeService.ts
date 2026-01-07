import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const API_URL = `${BASE_URL}/finance`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('cubana_auth');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const authData = JSON.parse(token);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.token}`
  };
};

const getFinancialStatus = async () => {
  const response = await axios.get(`${API_URL}/status`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

const getOperations = async (params = {}) => {
  const response = await axios.get(`${API_URL}/operations`, { 
    params,
    headers: getAuthHeaders()
  });
  return response.data;
};

const getAllProvinces = async () => {
  const response = await axios.get(`${BASE_URL}/provinces`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

const addOperation = async (operationData: {
  type: 'entrada' | 'remesa' | 'recarga';
  amount: number;
  provinceId: string;
}) => {
  const response = await axios.post(`${API_URL}/operation`, operationData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

const deleteOperation = async (provinceId: string, operationId: string) => {
  const response = await axios.delete(`${API_URL}/operation/${provinceId}/${operationId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export default {
  getFinancialStatus,
  getOperations,
  getAllProvinces,
  addOperation,
  deleteOperation
};
