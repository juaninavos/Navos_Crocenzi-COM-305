// src/services/api.ts
import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import type { LoginData, RegisterData, Camiseta, Usuario } from '../types';

// =========================
// 🔹 Tipos auxiliares
// =========================
type ApiResponse<T> = {
  data: T;
  message?: string;
};

// Tipo de error personalizado para manejar expiración de sesión, etc.
export class ApiAuthError extends Error {
  constructor(message = 'UNAUTHORIZED') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

// =========================
// 🔧 Configuración base de Axios
// =========================
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// =========================
// 🧩 Interceptor de requests (token)
// =========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =========================
// ⚠️ Interceptor de respuestas (manejo global de errores)
// =========================
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // 401 → token expirado o inválido
    if (status === 401) {
      localStorage.removeItem('token');
      return Promise.reject(new ApiAuthError());
    }

    // Log en desarrollo
    if (import.meta.env.MODE === 'development') {
      console.error('❌ Error en API:', error.response || error.message);
    }

    return Promise.reject(error);
  }
);

// =========================
// 🧍 Servicios de autenticación
// =========================
export const authService = {
  login: async (data: LoginData): Promise<{ token: string; user: Usuario }> => {
    const response = await api.post<ApiResponse<{ token: string; user: Usuario }>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/register', data);
    return response.data.data;
  },
};

// =========================
// 👕 Servicios de camisetas
// =========================
export const camisetaService = {
  getAll: async (filtros: Partial<{
    equipo: string;
    temporada: string;
    talle: string;
    condicion: string;
    esSubasta: boolean;
  }> = {}): Promise<Camiseta[]> => {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );

    const response = await api.get<ApiResponse<Camiseta[]>>('/camisetas', { params });
    return response.data.data;
  },

  getById: async (id: number): Promise<Camiseta> => {
    const response = await api.get<ApiResponse<Camiseta>>(`/camisetas/${id}`);
    return response.data.data;
  },

  create: async (camiseta: Partial<Camiseta>): Promise<Camiseta> => {
    const response = await api.post<ApiResponse<Camiseta>>('/camisetas', camiseta);
    return response.data.data;
  },

  update: async (id: number, camiseta: Partial<Camiseta>): Promise<Camiseta> => {
    const response = await api.put<ApiResponse<Camiseta>>(`/camisetas/${id}`, camiseta);
    return response.data.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/camisetas/${id}`);
    return response.data.data;
  },
};

// =========================
// 🧠 Exportación agrupada (opcional)
// =========================
export const services = {
  auth: authService,
  camiseta: camisetaService,
};

export default api;