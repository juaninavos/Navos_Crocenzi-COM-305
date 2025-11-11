// src/pages/admin/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService, camisetaService } from '../../services/api';
import { ProductCard } from '../../components/common/ProductCard';
// ✅ CAMBIAR: Importar tipos con 'type'
import type { DashboardData, Camiseta } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [camisetas, setCamisetas] = useState<Camiseta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ✅ USAR LA ESTRUCTURA CORRECTA
      const [dashboardData, camisetasResponse] = await Promise.all([
        adminService.getDashboard(),
        camisetaService.getAll()
      ]);
      
      // ✅ dashboardData ya es el objeto directo (no .data)
      setDashboardData(dashboardData);
      // ✅ camisetasResponse.data contiene el array
      setCamisetas(camisetasResponse.data || []);
      
    } catch (err: unknown) {
      console.error('Error loading admin data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Confirma eliminar esta camiseta?')) {
      try {
        await camisetaService.delete(id);
        setCamisetas(camisetas.filter(c => c.id !== id));
        toast.success('Camiseta eliminada exitosamente');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
        toast.error(`Error al eliminar: ${msg}`);
      }
    }
  };

  const handleEdit = (id: number) => {
    // TODO: Implementar modal de edición
    toast.info(`Funcionalidad de editar camiseta ${id} - Por implementar`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Administrativo</h1>
      
      {/* Estadísticas */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Total Usuarios</h3>
            <p className="text-3xl font-bold">{dashboardData.totalUsuarios}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Total Camisetas</h3>
            <p className="text-3xl font-bold">{dashboardData.totalCamisetas}</p>
          </div>
          <div className="bg-yellow-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Total Ventas</h3>
            <p className="text-3xl font-bold">{dashboardData.totalVentas}</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Ventas del Mes</h3>
            <p className="text-3xl font-bold">{dashboardData.ventasMes}</p>
          </div>
        </div>
      )}

      {/* Gestión de Camisetas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Gestión de Camisetas</h2>
          <div className="d-flex gap-2">
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              + Nueva Camiseta
            </button>
            <a href="/admin/users" className="btn btn-outline-primary">👥 Usuarios</a>
            <a href="/admin/categories" className="btn btn-outline-success">📂 Categorías</a>
            <a href="/admin/discounts" className="btn btn-outline-warning">💰 Descuentos</a>
          </div>
        </div>
        
        {camisetas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {camisetas.map(camiseta => (
              <ProductCard 
                key={camiseta.id}
                camiseta={camiseta}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay camisetas para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};