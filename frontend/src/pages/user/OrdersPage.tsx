// src/pages/user/OrdersPage.tsx - HISTORIAL DE COMPRAS

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import type { Compra, EstadoCompra } from '../../types';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth(); // ✅ CAMBIAR: currentUser → usuario
  
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) { // ✅ CAMBIAR: currentUser → usuario
      navigate('/login');
      return;
    }
    loadCompras();
  }, [usuario, navigate]); // ✅ CAMBIAR: currentUser → usuario

  const loadCompras = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/compras`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompras(response.data.data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setError('Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: EstadoCompra): string => {
    const badges: Record<string, string> = {
      pendiente: 'warning',
      confirmada: 'info',
      pagada: 'success',
      enviada: 'primary',
      entregada: 'success',
      cancelada: 'danger'
    };
    return badges[estado] || 'secondary';
  };

  const getEstadoIcono = (estado: EstadoCompra): string => {
    const iconos: Record<string, string> = {
      pendiente: '⏳',
      confirmada: '✅',
      pagada: '💰',
      enviada: '🚚',
      entregada: '📦',
      cancelada: '❌'
    };
    return iconos[estado] || '📋';
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Cargando tus compras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h5>⚠️ {error}</h5>
          <button 
            className="btn btn-outline-danger mt-2" 
            onClick={loadCompras}
            type="button"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📦 Mis Compras</h1>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/')}
          type="button"
        >
          Seguir Comprando
        </button>
      </div>

      {compras.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: '4rem' }}>🛒</div>
          <h3 className="mt-3">No tienes compras aún</h3>
          <p className="text-muted">¡Comienza a comprar tus camisetas favoritas!</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/')}
            type="button"
          >
            Ver Catálogo
          </button>
        </div>
      ) : (
        <>
          <div className="alert alert-info mb-4">
            <strong>Total de compras:</strong> {compras.length} orden{compras.length !== 1 ? 'es' : ''}
          </div>

          <div className="row">
            {compras.map((compra) => (
              <div key={compra.id} className="col-12 mb-3">
                <div className="card">
                  <div className="card-body">
                    <div className="row align-items-center">
                      
                      {/* Orden info */}
                      <div className="col-md-2">
                        <h6 className="mb-0 text-primary">Orden #{compra.id}</h6>
                        <small className="text-muted">
                          {new Date(compra.fechaCompra).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </small>
                      </div>
                      
                      {/* Producto info */}
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          {compra.camiseta.imagen ? (
                            <img 
                              src={compra.camiseta.imagen} 
                              alt={compra.camiseta.titulo}
                              className="rounded me-2"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-light rounded me-2 d-flex align-items-center justify-content-center" 
                                 style={{ width: '50px', height: '50px' }}>
                              <span>👕</span>
                            </div>
                          )}
                          <div>
                            <strong className="d-block">{compra.camiseta.titulo}</strong>
                            <small className="text-muted">
                              {compra.camiseta.equipo} - Talle {compra.camiseta.talle}
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      {/* Estado */}
                      <div className="col-md-2 text-center">
                        <span className={`badge bg-${getEstadoBadge(compra.estado)} fs-6 px-3 py-2`}>
                          {getEstadoIcono(compra.estado)} {compra.estado.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Método de pago */}
                      <div className="col-md-2 text-center">
                        <small className="text-muted d-block">Método de pago</small>
                        <strong>{compra.metodoPago.nombre}</strong>
                      </div>
                      
                      {/* Total */}
                      <div className="col-md-2 text-end">
                        <h5 className="mb-0 text-primary">${compra.total.toLocaleString()}</h5>
                      </div>
                    </div>

                    {/* Dirección de envío */}
                    {compra.direccionEnvio && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted">
                          <strong>Dirección de envío:</strong> {compra.direccionEnvio}
                        </small>
                      </div>
                    )}

                    {/* Notas */}
                    {compra.notas && (
                      <div className="mt-2">
                        <small className="text-muted">
                          <strong>Notas:</strong> {compra.notas}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersPage;