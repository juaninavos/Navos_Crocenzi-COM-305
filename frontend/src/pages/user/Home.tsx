import { useState, useEffect } from 'react';
import { camisetaService } from '../../services/api';
import type { Camiseta } from '../../types';
import { EstadoCamiseta } from '../../types';  // ✅ IMPORTAR CONST

export const Home = () => {
  const [camisetas, setCamisetas] = useState<Camiseta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar camisetas al montar el componente
  useEffect(() => {
    loadCamisetas();
  }, []);

  const loadCamisetas = async () => {
    try {
      setLoading(true);
      const data = await camisetaService.getAll();
      setCamisetas(data);
    } catch (error: any) {
      setError('Error al cargar las camisetas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando camisetas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h5>⚠️ {error}</h5>
        <p className="mb-2">Posibles causas:</p>
        <ul>
          <li>El backend no está iniciado</li>
          <li>Error de conexión</li>
        </ul>
        <button 
          className="btn btn-outline-danger" 
          onClick={loadCamisetas}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🏆 Camisetas Disponibles</h1>
        <p className="text-muted mb-0">{camisetas.length} camisetas encontradas</p>
      </div>

      {/* Filtros básicos */}
      <div className="card mb-4">
        <div className="card-body">
          <h6>Filtros (próximamente)</h6>
          <div className="row">
            <div className="col-md-4">
              <select className="form-select" disabled>
                <option>Todos los equipos</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" disabled>
                <option>Todos los talles</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" disabled>
                <option>Todas las condiciones</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de camisetas */}
      {camisetas.length === 0 ? (
        <div className="text-center py-5">
          <h3>👕 No hay camisetas disponibles</h3>
          <p className="text-muted">¡Sé el primero en publicar una camiseta!</p>
        </div>
      ) : (
        <div className="row">
          {camisetas.map((camiseta) => (
            <div key={camiseta.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card card-camiseta h-100">
                {/* Imagen */}
                <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                  {camiseta.imagen ? (
                    <img 
                      src={camiseta.imagen} 
                      alt={camiseta.titulo} 
                      className="img-fluid" 
                      style={{ maxHeight: '200px', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className="text-center">
                      <div style={{ fontSize: '3rem' }}>👕</div>
                      <small className="text-muted">Sin imagen</small>
                    </div>
                  )}
                </div>

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{camiseta.titulo}</h5>
                  
                  {/* Badges informativos */}
                  <div className="mb-2">
                    <span className="badge bg-primary me-1">{camiseta.equipo}</span>
                    <span className="badge bg-secondary me-1">{camiseta.talle}</span>
                    <span className="badge bg-info me-1">{camiseta.condicion}</span>
                    <span className={`badge ${
                      camiseta.estado === EstadoCamiseta.DISPONIBLE ? 'bg-success' :
                      camiseta.estado === EstadoCamiseta.VENDIDA ? 'bg-danger' :
                      camiseta.estado === EstadoCamiseta.EN_SUBASTA ? 'bg-warning' :
                      'bg-secondary'
                    }`}>
                      {camiseta.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Descripción */}
                  {camiseta.descripcion && (
                    <p className="card-text text-muted small">{camiseta.descripcion}</p>
                  )}

                  <div className="mt-auto">
                    {/* Precio y temporada */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="precio">${camiseta.precioInicial}</div>
                      <small className="text-muted">Temporada {camiseta.temporada}</small>
                    </div>

                    {/* Stock */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">Stock: {camiseta.stock}</small>
                      <small className="text-muted">
                        Por: {camiseta.vendedor?.nombre || 'Usuario'}
                      </small>
                    </div>

                    {/* Tipo de venta */}
                    <div className="text-center mb-2">
                      <span className={`badge ${camiseta.esSubasta ? 'bg-warning' : 'bg-success'}`}>
                        {camiseta.esSubasta ? '🔨 Subasta' : '💰 Precio fijo'}
                      </span>
                    </div>

                    {/* Botón de acción */}
                    <button 
                      className="btn btn-primary w-100"
                      disabled={camiseta.estado !== EstadoCamiseta.DISPONIBLE && !camiseta.esSubasta}
                    >
                      {camiseta.estado === EstadoCamiseta.VENDIDA ? 'Vendida' :
                       camiseta.esSubasta ? 'Ver Subasta' : 
                       'Comprar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};