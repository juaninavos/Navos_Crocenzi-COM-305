import { UsuarioRol } from '../entities/Usuario.js';

export interface AuthUser {
  id: number;
  rol: UsuarioRol;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}