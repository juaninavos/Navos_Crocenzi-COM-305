import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import type { LoginData, RegisterData, Camiseta } from '../types';

// Configurar conexión con backend
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar token automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Funciones para hablar con el backend
export const authService = {
  // Hacer login
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Registrarse
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  }
};

// Funciones para camisetas
export const camisetaService = {
  // Traer todas las camisetas
  getAll: async (): Promise<Camiseta[]> => {
    const response = await api.get('/camisetas');
    return response.data.data;
  }
};

export const camisetaAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/camisetas`);
    
    if (!response.ok) {
      throw new Error('Error al obtener camisetas');
    }

    return response.json();
  }
};