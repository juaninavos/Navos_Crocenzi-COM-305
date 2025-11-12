// src/components/common/Navigation.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../context/useCart';

export const Navigation: React.FC = () => {
  const { usuario, logout, isAuthenticated } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  const linksClass = `nav-links ${menuOpen ? 'd-block' : 'd-none'} d-md-flex`;

  return (
    <nav className="bg-blue-600 text-white p-3 p-md-4">
      <div className="container d-flex align-items-center justify-content-between">
        {/* Logo Home estilizado con texto en dos líneas */}
        <Link to="/" className="text-decoration-none d-flex align-items-center" onClick={() => setMenuOpen(false)} style={{ gap: '10px' }}>
          <button
            type="button"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '12px',
              background: 'white',
              color: '#2563eb',
              fontWeight: 900,
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '2px solid #2563eb',
              transition: 'background 0.2s',
              padding: 0,
              lineHeight: 1.1,
              minWidth: 60,
              minHeight: 60,
            }}
            title="Ir a inicio"
            className="border-0"
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px' }}>Tienda</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '2px', marginTop: '-2px' }}>Retro</span>
          </button>
        </Link>

        {/* Toggle móvil */}
        <button 
          className="btn btn-outline-light d-md-none"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(v => !v)}
          type="button"
        >
          ☰
        </button>

        <div className={linksClass} style={{ gap: '24px' }}>
          <Link to="/catalog" className="hover:underline">
            <span onClick={() => setMenuOpen(false)}>Catálogo</span>
          </Link>
          
          {/* ✅ UNA SOLA PESTAÑA DE SUBASTAS */}
          {isAuthenticated && (
            <Link to="/auctions" className="hover:underline" onClick={() => setMenuOpen(false)}>
              <span>🔨 Subastas</span>
            </Link>
          )}
          
          <Link to="/cart" className="hover:underline" style={{ position: 'relative', display: 'inline-block' }} onClick={() => setMenuOpen(false)}>
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
              <Link to="/orders" className="hover:underline" onClick={() => setMenuOpen(false)}>
                📋 Órdenes
              </Link>
              
              <Link to="/profile" className="hover:underline" onClick={() => setMenuOpen(false)}>
                👤 Perfil
              </Link>
              <Link to="/my-products" className="hover:underline" onClick={() => setMenuOpen(false)}>
                🧾 Mis Publicaciones
              </Link>
              
              {usuario?.rol === 'administrador' && (
                <Link to="/admin/dashboard" className="hover:underline" onClick={() => setMenuOpen(false)}>
                  👨‍💼 Admin
                </Link>
              )}
              <span className="d-block d-md-inline">Hola, {usuario?.nombre}</span>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="btn btn-link p-0 text-white text-decoration-underline">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline" onClick={() => setMenuOpen(false)}>
                Iniciar Sesión
              </Link>
              <Link to="/register" className="hover:underline" onClick={() => setMenuOpen(false)}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};