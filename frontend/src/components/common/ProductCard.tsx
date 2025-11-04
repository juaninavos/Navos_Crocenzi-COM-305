// src/components/common/ProductCard.tsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import type { Camiseta } from '../../types';
import { useCart } from '../../context/useCart';
import { subastaService } from '../../services/api';
import useToast from '../../hooks/useToast';

interface ProductCardProps {
  camiseta: Camiseta;
  onAddToCart?: (camiseta: Camiseta) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void | Promise<void>;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ camiseta, onAddToCart, onEdit, onDelete, showActions }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // ✅ FUNCIÓN CORREGIDA CON PARÁMETRO e
  const handleVerSubasta = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 INICIO: Buscando subasta');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Camiseta ID:', camiseta.id);
    console.log('👕 Título:', camiseta.titulo);
    console.log('🔨 Es subasta:', camiseta.esSubasta);
    
    try {
      setLoading(true);
      
      console.log('🌐 Llamando a subastaService.getByCamiseta...');

      const subasta = await subastaService.getByCamiseta(camiseta.id);
      console.log('✅ SUBASTA ENCONTRADA:', {
        id: subasta.id,
        precio: subasta.precioActual
      });
      console.log('🚀 Navegando a /auctions/' + subasta.id);
      navigate(`/auctions/${subasta.id}`);
      
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERROR AL BUSCAR SUBASTA');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error completo:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('📡 Response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
  showToast(error instanceof Error ? error.message : 'Error al cargar la subasta', { variant: 'danger' });
      
    } finally {
      setLoading(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏁 FIN');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  };

  const handleAgregarAlCarrito = () => {
    console.log('🛒 Agregando al carrito:', camiseta);
    if (onAddToCart) {
      onAddToCart(camiseta);
    } else {
      addToCart(camiseta, 1);
    }
    showToast(`${camiseta.titulo} agregado al carrito`, { variant: 'success' });
  };

  return (
    <div className="card card-camiseta h-100">
      {/* Imagen */}
      <div className="position-relative">
        {camiseta.imagen ? (
          <img
            src={camiseta.imagen}
            alt={camiseta.titulo}
            className="card-img-top"
            style={{ height: '250px', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="bg-light d-flex align-items-center justify-content-center"
            style={{ height: '250px' }}
          >
            <span style={{ fontSize: '4rem' }}>👕</span>
          </div>
        )}

        {/* Badge de SUBASTA */}
        {camiseta.esSubasta && (
          <span
            className="position-absolute top-0 end-0 m-2 badge bg-danger"
            style={{ fontSize: '0.9rem' }}
          >
            🔨 EN SUBASTA
          </span>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        <h5 className="card-title mb-2">{camiseta.titulo}</h5>

        <p className="text-muted mb-2">
          <small>
            <strong>{camiseta.equipo}</strong> • {camiseta.temporada} • Talle {camiseta.talle}
          </small>
        </p>

        <div className="mb-2">
          <span className="badge bg-info">{camiseta.condicion}</span>
        </div>

        <div className="mb-3">
          <span className="fs-5 fw-bold text-success">
            ${camiseta.precioInicial.toLocaleString()}
          </span>
          {camiseta.esSubasta && (
            <span className="text-muted ms-2">
              <small>Precio inicial</small>
            </span>
          )}
        </div>

  {/* BOTONES */}
        <div className="mt-auto">
          {camiseta.esSubasta ? (
            <button
              onClick={handleVerSubasta}
              className="btn btn-danger w-100"
              type="button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Buscando...
                </>
              ) : (
                '🔨 Ver Subasta'
              )}
            </button>
          ) : (
            <button
              onClick={handleAgregarAlCarrito}
              className="btn btn-primary w-100"
              type="button"
            >
              🛒 Agregar al Carrito
            </button>
          )}

          <button
            onClick={() => navigate(`/product/${camiseta.id}`)}
            className="btn btn-outline-secondary w-100 mt-2"
            type="button"
          >
            Ver Detalle
          </button>

          {showActions && (
            <div className="d-flex gap-2 mt-2">
              {onEdit && (
                <button className="btn btn-outline-warning w-50" type="button" onClick={() => onEdit(camiseta.id)}>Editar</button>
              )}
              {onDelete && (
                <button className="btn btn-outline-danger w-50" type="button" onClick={() => onDelete(camiseta.id)}>Eliminar</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};