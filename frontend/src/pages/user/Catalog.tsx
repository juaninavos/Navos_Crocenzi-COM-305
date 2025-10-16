// src/pages/user/Catalog.tsx

import React, { useState, useEffect } from 'react';
import { camisetaService } from '../../services/api';
import { ProductCard } from '../../components/common/ProductCard';
// ✅ CAMBIAR: Importar tipos con 'type'
import type { Camiseta } from '../../types';

export const Catalog: React.FC = () => {
  const [camisetas, setCamisetas] = useState<Camiseta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCamisetas();
  }, []);

  const loadCamisetas = async () => {
    try {
      // ✅ USAR TU API SERVICE
      const result = await camisetaService.getAll();
      setCamisetas(result.data);
    } catch (err) {
      setError('Error al cargar camisetas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (camiseta: Camiseta) => {
    // TODO: Implementar carrito
    alert(`${camiseta.titulo} agregada al carrito`);
  };

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Camisetas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {camisetas.map(camiseta => (
          <ProductCard 
            key={camiseta.id}
            camiseta={camiseta}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {camisetas.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay camisetas disponibles</p>
        </div>
      )}
    </div>
  );
};