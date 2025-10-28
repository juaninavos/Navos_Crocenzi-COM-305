// src/types/index.ts - CORREGIDO PARA erasableSyntaxOnly

// =========================
// 🎯 TIPOS EXACTOS DEL BACKEND (const objects en lugar de enums)
// =========================

export const UsuarioRol = {
  USUARIO: 'usuario',
  ADMINISTRADOR: 'administrador'
} as const;
export type UsuarioRol = typeof UsuarioRol[keyof typeof UsuarioRol];

export const Talle = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL'
} as const;
export type Talle = typeof Talle[keyof typeof Talle];

export const CondicionCamiseta = {
  NUEVA: 'Nueva',
  USADA: 'Usada',
  VINTAGE: 'Vintage'
} as const;
export type CondicionCamiseta = typeof CondicionCamiseta[keyof typeof CondicionCamiseta];

export const EstadoCamiseta = {
  DISPONIBLE: 'disponible',
  VENDIDA: 'vendida',
  EN_SUBASTA: 'en_subasta',
  INACTIVA: 'inactiva'
} as const;
export type EstadoCamiseta = typeof EstadoCamiseta[keyof typeof EstadoCamiseta];

export const EstadoCompra = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  PAGADA: 'pagada',
  ENVIADA: 'enviada',
  ENTREGADA: 'entregada',
  CANCELADA: 'cancelada'
} as const;
export type EstadoCompra = typeof EstadoCompra[keyof typeof EstadoCompra];

export const EstadoPago = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
  CANCELADO: 'cancelado'
} as const;
export type EstadoPago = typeof EstadoPago[keyof typeof EstadoPago];

// =========================
// 🏗️ INTERFACES EXACTAS DEL BACKEND
// =========================

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  email_normalized: string;
  contrasena?: string;  // Solo para backend, nunca se envía al frontend
  direccion?: string;   // ✅ CAMBIAR: hacerla opcional
  telefono?: string;    // ✅ CAMBIAR: hacerla opcional
  rol: UsuarioRol;
  activo: boolean;
  fechaRegistro: Date;
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
  descripcion?: string;  // ✅ CORREGIR: es opcional en backend
  equipo: string;
  temporada: string;
  talle: Talle;         // ✅ CORREGIR: usar enum, no string
  condicion: CondicionCamiseta;  // ✅ CORREGIR: usar enum, no string
  imagen?: string;      // ✅ CORREGIR: es opcional en backend
  precioInicial: number;
  esSubasta: boolean;
  stock: number;
  estado: EstadoCamiseta;
  fechaCreacion: Date;
  fechaPublicacion: Date;
  // Relaciones populadas
  vendedor: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
    rol?: UsuarioRol;
  };
  categoria?: {
    id: number;
    nombre: string;
    descripcion?: string;
    activa?: boolean;
  };
}

export interface Subasta {
  id: number;
  fechaInicio: Date;
  fechaFin: Date;
  precioActual: number;
  activa: boolean;
  camiseta: Camiseta;
  ganador?: Usuario;
}

export interface Oferta {
  id: number;
  monto: number;
  fechaOferta: Date;
  activa: boolean;
  subasta: Subasta;
  usuario: Usuario;
}

export interface Compra {
  id: number;
  total: number;
  estado: EstadoCompra;
  fechaCompra: Date;
  direccionEnvio?: string;
  notas?: string;
  comprador: Usuario;
  camiseta: Camiseta;
  metodoPago: MetodoPago;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Pago {
  id: number;
  monto: number;
  estado: EstadoPago;
  fechaPago: Date;
  numeroTransaccion?: string;
  notas?: string;
  compra: Compra;
  metodoPago: MetodoPago;
}

export interface Descuento {
  id: number;
  codigo: string;
  descripcion: string;
  porcentaje: number;
  fechaInicio: Date;
  fechaFin: Date;
  activo: boolean;
  fechaCreacion: Date;
}

// =========================
// 📡 RESPUESTAS DE API
// =========================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  usuario: Usuario;  // ✅ Usar interface Usuario completa
  token: string;
}

// =========================
// 📝 DTOs PARA FORMULARIOS
// =========================

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
  rol?: UsuarioRol;
}

export interface CreateCamisetaData {
  titulo: string;
  descripcion: string;
  equipo: string;
  temporada: string;
  talle: Talle;
  condicion: CondicionCamiseta;
  imagen: string;
  precioInicial: number;
  esSubasta?: boolean;
  categoriaId?: number;
}

export interface UpdateCamisetaData extends Partial<CreateCamisetaData> {
  id: number;
  estado?: EstadoCamiseta;
  stock?: number;
}

// =========================
// 🔍 FILTROS Y BÚSQUEDAS
// =========================

export interface CamisetaFiltro {
  equipo?: string;
  temporada?: string;
  talle?: Talle;
  condicion?: CondicionCamiseta;
  estado?: EstadoCamiseta;
  precioMin?: string | number;
  precioMax?: string | number;
  esSubasta?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'precioAsc' | 'precioDesc' | 'fechaAsc' | 'fechaDesc';
}

// =========================
// 📊 DASHBOARD Y ESTADÍSTICAS
// =========================

export interface DashboardData {
  totalUsuarios: number;
  totalCamisetas: number;
  totalVentas: number;
  ventasMes: number;
  camisetasPorEstado?: {
    disponible: number;
    vendida: number;
    en_subasta: number;
    inactiva: number;
  };
  ventasPorMes?: Array<{
    mes: string;
    cantidad: number;
    total: number;
  }>;
}

// =========================
// 🛒 CARRITO DE COMPRAS
// =========================

export interface CartItem {
  id: number;                    // ✅ ID del item en el carrito
  camiseta: Camiseta;           // ✅ Información completa de la camiseta
  quantity: number;             // ✅ Cantidad seleccionada
  subtotal?: number;            // ✅ Opcional: subtotal calculado
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}

// =========================
// 🔨 TIPOS AUXILIARES PARA SUBASTAS
// =========================

export interface CreateSubastaData {
  fechaInicio: Date | string;
  fechaFin: Date | string;
  camisetaId: number;
  precioInicial?: number;
}

export interface CreateOfertaData {
  monto: number;
  usuarioId: number;
  subastaId: number;
}

export interface SubastaFiltro {
  activas?: boolean;
  page?: number;
  limit?: number;
}

// =========================
// 📊 ESTADÍSTICAS DE SUBASTA
// =========================

export interface SubastaStats {
  tiempoRestante: {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    total: number; // milisegundos
  };
  finalizada: boolean;
  puedeOfertar: boolean;
}

// =========================
// 🎯 TYPES AUXILIARES
// =========================

// ✅ Tipos auxiliares para compatibilidad
export type TalleType = Talle;
export type CondicionCamisetaType = CondicionCamiseta;
export type EstadoCamisetaType = EstadoCamiseta;
export type UsuarioRolType = UsuarioRol;

// ✅ AGREGAR User para compatibilidad (alias de Usuario)
export interface User extends Usuario {}