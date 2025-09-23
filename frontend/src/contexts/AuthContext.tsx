import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Usuario } from '../types';

// ¿Qué información vamos a compartir?
interface AuthContextType {
  usuario: Usuario | null;        // El usuario logueado (o null)
  token: string | null;           // El token JWT (o null)
  login: (usuario: Usuario, token: string) => void;  // Función para hacer login
  logout: () => void;             // Función para hacer logout
  isAuthenticated: boolean;       // ¿Está logueado? true/false
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto (envuelve toda la app)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Al cargar la app, revisar si hay token guardado
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('usuario');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUser));
    }
  }, []);

  // Función para hacer login
  const login = (usuario: Usuario, token: string) => {
    setUsuario(usuario);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  };

  // Función para hacer logout  
  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  // ¿Está autenticado?
  const isAuthenticated = !!token && !!usuario;

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};