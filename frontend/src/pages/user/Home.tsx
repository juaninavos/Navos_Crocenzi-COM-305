import { useState, useEffect } from 'react';
import { camisetaService } from '../../services/api';
import type { Camiseta } from '../../types';
import { EstadoCamiseta } from '../../types';

export const Home = () => {
  const [camisetas, setCamisetas] = useState<Camiseta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Estado de filtros
  const filtrosIniciales: {
    equipo: string | null;
    talle: string | null;
    condicion: string | null;
    temporada: string | null;
    esSubasta: boolean;
    precioMin: string | null;
    precioMax: string | null;
  } = {
    equipo: null,
    talle: null,
    condicion: null,
    temporada: null,
    esSubasta: false,
    precioMin: null,
    precioMax: null,
  };
  const [filtros, setFiltros] = useState<typeof filtrosIniciales>(filtrosIniciales);

  // Calcula la cantidad de filtros activos (excluyendo los valores iniciales)
  const filtrosActivosCount = Object.entries(filtros)
    .filter(([key, value]) => {
      if (key === 'esSubasta') return value !== false;
      return value !== null;
    }).length;

  // Cargar camisetas al montar el componente o cambiar filtros
  useEffect(() => {
    loadCamisetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const loadCamisetas = async () => {
    try {
      setLoading(true);
      // Solo enviar filtros con valor
      const filtrosActivos = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== null && v !== undefined)
      );
      const data = await camisetaService.getAll(filtrosActivos);
      setCamisetas(data);
    } catch (error) {
      setError('Error al cargar las camisetas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
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
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Filtros</h6>
            <div className="d-flex align-items-center gap-2">
              {filtrosActivosCount > 0 && (
                <span className="badge bg-info text-dark">{filtrosActivosCount} activo{filtrosActivosCount > 1 ? 's' : ''}</span>
              )}
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={() => setFiltros(filtrosIniciales)}
                disabled={JSON.stringify(filtros) === JSON.stringify(filtrosIniciales)}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col-md-3 mb-2 mb-md-0">
              <select
                className="form-select"
                value={filtros.equipo ?? ''}
                onChange={e => setFiltros(f => ({ ...f, equipo: e.target.value || null }))}
              >
                <option value="">Todos los equipos</option>
                {[...new Set(camisetas.map(c => c.equipo))].map(equipo => (
                  <option key={equipo} value={equipo}>{equipo}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <select
                className="form-select"
                value={filtros.talle ?? ''}
                onChange={e => setFiltros(f => ({ ...f, talle: e.target.value || null }))}
              >
                <option value="">Todos los talles</option>
                {[...new Set(camisetas.map(c => c.talle))].map(talle => (
                  <option key={talle} value={talle}>{talle}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <select
                className="form-select"
                value={filtros.temporada ?? ''}
                onChange={e => setFiltros(f => ({ ...f, temporada: e.target.value || null }))}
              >
                <option value="">Todas las temporadas</option>
                {[...new Set(camisetas.map(c => c.temporada))].map(temporada => (
                  <option key={temporada} value={temporada}>{temporada}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <select
                className="form-select"
                value={filtros.condicion ?? ''}
                onChange={e => setFiltros(f => ({ ...f, condicion: e.target.value || null }))}
              >
                <option value="">Todas las condiciones</option>
                {[...new Set(camisetas.map(c => c.condicion))].map(condicion => (
                  <option key={condicion} value={condicion}>{condicion}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-6 mb-2 mb-md-0">
              <input
                type="number"
                className="form-control"
                placeholder="Precio mínimo"
                min={0}
                value={filtros.precioMin ?? ''}
                onChange={e => setFiltros(f => ({ ...f, precioMin: e.target.value || null }))}
              />
            </div>
            <div className="col-md-6">
              <input
                type="number"
                className="form-control"
                placeholder="Precio máximo"
                min={0}
                value={filtros.precioMax ?? ''}
                onChange={e => setFiltros(f => ({ ...f, precioMax: e.target.value || null }))}
              />
            </div>
          </div>
          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="esSubastaCheck"
              checked={filtros.esSubasta}
              onChange={e => setFiltros(f => ({ ...f, esSubasta: e.target.checked }))}
            />
            <label className="form-check-label" htmlFor="esSubastaCheck">
              Solo subastas
            </label>
          </div>
        </div>
      </div>

      {/* Lista de camisetas */}
      {camisetas.length === 0 ? (
        <div className="text-center py-5">
          <h3>👕 No hay camisetas disponibles</h3>
          {filtrosActivosCount > 0 ? (
            <>
              <p className="text-muted">No se encontraron resultados con los filtros seleccionados.</p>
              <button
                className="btn btn-outline-secondary mt-2"
                onClick={() => setFiltros(filtrosIniciales)}
              >
                Limpiar filtros
              </button>
            </>
          ) : (
            <p className="text-muted">¡Sé el primero en publicar una camiseta!</p>
          )}
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

                    {/* Botón de acción mejorado UX */}
                    {camiseta.estado === EstadoCamiseta.VENDIDA ? (
                      <button className="btn btn-secondary w-100" disabled title="Esta camiseta ya fue vendida">
                        Vendida
                      </button>
                    ) : camiseta.esSubasta ? (
                      <button className="btn btn-warning w-100" title="Participa en la subasta">
                        Ver Subasta
                      </button>
                    ) : camiseta.estado !== EstadoCamiseta.DISPONIBLE ? (
                      <button className="btn btn-secondary w-100" disabled title="No disponible para comprar">
                        No disponible
                      </button>
                    ) : (
                      <button className="btn btn-primary w-100">
                        Comprar
                      </button>
                    )}
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