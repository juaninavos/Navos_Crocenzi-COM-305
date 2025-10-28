// src/components/common/Navigation.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../context/useCart';

export const Navigation: React.FC = () => {
  const { usuario, logout, isAuthenticated } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Tienda Retro
        </Link>
        
        <div className="flex items-center" style={{ gap: '24px' }}>
          <Link to="/catalog" className="hover:underline">
            Catálogo
          </Link>
          
          {/* ✅ UNA SOLA PESTAÑA DE SUBASTAS */}
          {isAuthenticated && (
            <Link to="/auctions" className="hover:underline">
              🔨 Subastas
            </Link>
          )}
          
          <Link to="/cart" className="hover:underline" style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              🛒 Carrito
              {totalItems > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  minWidth: '20px',
                  textAlign: 'center',
                  display: 'inline-block',
                  lineHeight: '1'
                }}>
                  {totalItems}
                </span>
              )}
            </span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className="hover:underline">
                📋 Órdenes
              </Link>
              
              {usuario?.rol === 'administrador' && (
                <Link to="/admin/dashboard" className="hover:underline">
                  👨‍💼 Admin
                </Link>
              )}
              <span>Hola, {usuario?.nombre}</span>
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