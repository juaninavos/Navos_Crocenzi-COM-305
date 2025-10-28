// src/components/common/ProductCard.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Camiseta } from '../../types';
import { useCart } from '../../context/useCart';
import { subastaService } from '../../services/api';

interface ProductCardProps {
  camiseta: Camiseta;
}

export const ProductCard: React.FC<ProductCardProps> = ({ camiseta }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

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
      
      console.log('🌐 Llamando a subastaService.getAll...');
      
      const result = await subastaService.getAll({ 
        camisetaId: camiseta.id 
      });
      
      console.log('📊 Respuesta:', {
        cantidad: result.data.length,
        total: result.count
      });

      if (result.data && result.data.length > 0) {
        const subasta = result.data[0];
        console.log('✅ SUBASTA ENCONTRADA:', {
          id: subasta.id,
          precio: subasta.precioActual
        });
        
        console.log('🚀 Navegando a /auctions/' + subasta.id);
        navigate(`/auctions/${subasta.id}`);
        
      } else {
        console.warn('⚠️ NO SE ENCONTRÓ SUBASTA');
        alert('❌ No se encontró una subasta activa para esta camiseta.');
      }
      
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERROR AL BUSCAR SUBASTA');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error completo:', error);
      
      if (typeof error === 'object' && error !== null) {
        const axiosError = error as any;
        if (axiosError.response) {
          console.error('📡 Response:', {
            status: axiosError.response.status,
            data: axiosError.response.data
          });
        }
      }
      
      alert(`❌ Error al cargar la subasta.\n\n${error instanceof Error ? error.message : 'Error desconocido'}`);
      
    } finally {
      setLoading(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏁 FIN');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  };

  const handleAgregarAlCarrito = () => {
    console.log('🛒 Agregando al carrito:', camiseta);
    addToCart({
      camisetaId: camiseta.id,
      titulo: camiseta.titulo,
      precio: camiseta.precioInicial,
      imagen: camiseta.imagen || '',
      cantidad: 1,
    });
    alert(`✅ ${camiseta.titulo} agregado al carrito`);
  };

  return (
    <div className="card h-100 shadow-sm hover:shadow-lg transition-shadow">
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
        </div>
      </div>
    </div>
  );
};