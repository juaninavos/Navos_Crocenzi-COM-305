// ✅ TIPOS 100% COHERENTES CON EL BACKEND (Compatible con verbatimModuleSyntax)

// Const assertions (reemplazan a los enums)
export const UsuarioRol = {
  USUARIO: 'usuario',
  ADMINISTRADOR: 'administrador'
} as const;

export const Talle = {
  XS: 'XS',
  S: 'S', 
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL'
} as const;

export const CondicionCamiseta = {
  NUEVA: 'Nueva',
  USADA: 'Usada',
  VINTAGE: 'Vintage'
} as const;

export const EstadoCamiseta = {
  DISPONIBLE: 'disponible',
  VENDIDA: 'vendida',
  EN_SUBASTA: 'en_subasta',
  INACTIVA: 'inactiva'
} as const;

// Tipos derivados de las const assertions
export type UsuarioRolType = typeof UsuarioRol[keyof typeof UsuarioRol];
export type TalleType = typeof Talle[keyof typeof Talle];
export type CondicionCamisetaType = typeof CondicionCamiseta[keyof typeof CondicionCamiseta];
export type EstadoCamisetaType = typeof EstadoCamiseta[keyof typeof EstadoCamiseta];

// Interfaces EXACTAS del backend
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  email_normalized: string;
  direccion: string;
  telefono: string;
  rol: UsuarioRolType;         // ✅ USANDO TYPE
  activo: boolean;
  fechaRegistro: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export interface Camiseta {
  id: number;
  titulo: string;
  descripcion?: string;
  equipo: string;
  temporada: string;
  talle: TalleType;                    // ✅ USANDO TYPE
  condicion: CondicionCamisetaType;    // ✅ USANDO TYPE
  imagen?: string;
  precioInicial: number;
  esSubasta: boolean;
  stock: number;
  estado: EstadoCamisetaType;          // ✅ USANDO TYPE
  fechaCreacion: string;
  fechaPublicacion: string;
  // Relaciones
  vendedor: Usuario;
  categoria?: Categoria;
}

// Respuestas de API
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  count?: number;
}

// DTOs para formularios
export interface LoginData {
  email: string;
  contrasena: string;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
  direccion: string;
  telefono: string;
}