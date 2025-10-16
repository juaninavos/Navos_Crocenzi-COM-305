// src/services/api.ts

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../utils/constants';
// ✅ CAMBIAR: Todos los tipos con 'type'
import type { 
  LoginData, 
  RegisterData, 
  Camiseta, 
  ApiResponse, 
  AuthResponse, 
  CamisetaFiltro, 
  DashboardData 
} from '../types';

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
      localStorage.removeItem('user');
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
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },
};

// =========================
// 👕 Servicios de camisetas
// =========================
export const camisetaService = {
  getAll: async (filtros: CamisetaFiltro = {}): Promise<{ data: Camiseta[]; count: number; page?: number; limit?: number }> => {
    // Normalizar y validar filtros de precio
    const normalized: Record<string, unknown> = { ...filtros };
    
    if (typeof filtros.precioMin === 'string' && filtros.precioMin.trim() !== '') {
      const n = Number(filtros.precioMin);
      if (!Number.isNaN(n) && n >= 0) {
        normalized.precioMin = n;
      } else {
        delete normalized.precioMin;
      }
    }
    
    if (typeof filtros.precioMax === 'string' && filtros.precioMax.trim() !== '') {
      const n = Number(filtros.precioMax);
      if (!Number.isNaN(n) && n >= 0) {
        normalized.precioMax = n;
      } else {
        delete normalized.precioMax;
      }
    }

    const params = Object.fromEntries(
      Object.entries(normalized).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    // DEBUG: log params being sent to the API to verify price filters
    console.log('camisetaService.getAll -> params:', params);

    const response = await api.get<ApiResponse<Camiseta[]>>('/camisetas', { params });
    
    return { 
      data: response.data.data, 
      count: response.data.count ?? response.data.data.length, 
      page: typeof params.page === 'number' ? params.page : undefined, 
      limit: typeof params.limit === 'number' ? params.limit : undefined 
    };
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
// 👑 Servicios de administración
// =========================
export const adminService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>('/admin/dashboard');
    return response.data.data;
  },

  getUsuarios: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/usuarios');
    return response.data.data;
  },

  toggleEstadoUsuario: async (id: number): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>(`/admin/usuarios/${id}/toggle-estado`);
    return response.data.data;
  },
};

// =========================
// 🧠 Exportación agrupada
// =========================
export const services = {
  auth: authService,
  camiseta: camisetaService,
  admin: adminService,
};

export default api;