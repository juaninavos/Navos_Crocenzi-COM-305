// src/components/common/ProductCard.tsx

import React from 'react';
// ✅ CAMBIAR: Importar tipos con 'type'
import type { Camiseta } from '../../types';

interface ProductCardProps {
  camiseta: Camiseta;
  onAddToCart?: (camiseta: Camiseta) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  camiseta, 
  onAddToCart, 
  onEdit, 
  onDelete, 
  showActions = false 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
      {/* Imagen */}
      <div className="h-48 bg-gray-100 flex items-center justify-center">
        <img 
          src={camiseta.imagen || '/placeholder.jpg'} 
          alt={camiseta.titulo}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.jpg';
          }}
        />
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{camiseta.titulo}</h3>
        
        <div className="text-sm text-gray-600 mb-2">
          <p><strong>Equipo:</strong> {camiseta.equipo}</p>
          <p><strong>Temporada:</strong> {camiseta.temporada}</p>
          <p><strong>Talle:</strong> {camiseta.talle}</p>
          <p><strong>Condición:</strong> {camiseta.condicion}</p>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-green-600">
            ${camiseta.precioInicial?.toLocaleString() || '0'}
          </span>
          {camiseta.esSubasta && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              SUBASTA
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          {onAddToCart && (
            <button 
              onClick={() => onAddToCart(camiseta)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            >
              Agregar al Carrito
            </button>
          )}
          
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <button 
                  onClick={() => onEdit(camiseta.id)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Editar
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete(camiseta.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};