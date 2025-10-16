// src/components/common/Navigation.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Tienda Retro
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/catalog" className="hover:underline">
            Catálogo
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="hover:underline">
                Carrito
              </Link>
              
              {user?.rol === 'administrador' && (
                <Link to="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              
              <span>Hola, {user?.nombre}</span>
              <button onClick={handleLogout} className="hover:underline">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="hover:underline">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};