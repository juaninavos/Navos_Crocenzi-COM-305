import { useState, useEffect } from 'react';
import { camisetaService } from '../../services/api';
import { useCart } from '../../context/useCart'; // ✅ AGREGAR
import { 
  EstadoCamiseta,
  Talle,
  CondicionCamiseta
} from '../../types';
import type { 
  Camiseta,
  CamisetaFiltro
} from '../../types';

export const Home = () => {
  const PAGE_SIZE = 9;
  const { addToCart } = useCart(); // ✅ AGREGAR

  const [camisetas, setCamisetas] = useState<Camiseta[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  
  const [minPrecioVisible, setMinPrecioVisible] = useState<number | null>(null);
  const [maxPrecioVisible, setMaxPrecioVisible] = useState<number | null>(null);
  
  const filtrosIniciales: {
    equipo: string | null;
    talle: Talle | null;
    condicion: CondicionCamiseta | null;
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
  const [sort, setSort] = useState<'precioAsc' | 'precioDesc' | 'fechaAsc' | 'fechaDesc'>('fechaDesc');
  const [page, setPage] = useState<number>(1);
  const [appliedFiltros, setAppliedFiltros] = useState<typeof filtros>(filtros);

  // Helper to update filtros and reset page immediately to avoid race/flicker
  const updateFiltro = (patch: Partial<typeof filtros>) => {
    setFiltros(f => ({ ...f, ...patch }));
    setPage(1);
  };

  // Calcula la cantidad de filtros activos (excluyendo los valores iniciales)
  const filtrosActivosCount = Object.entries(filtros)
    .filter(([key, value]) => {
      if (key === 'esSubasta') return value !== false;
      return value !== null;
    }).length;

  // Debounce filters changes
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedFiltros(filtros);
    }, 300);
    return () => clearTimeout(t);
  }, [filtros]);

  // Load camisetas when appliedFiltros, page or sort change
  useEffect(() => {
    // Si rango de precio inválido, no recargar y mostrar error
    const min = appliedFiltros.precioMin !== null && appliedFiltros.precioMin !== '' ? Number(appliedFiltros.precioMin) : null;
    const max = appliedFiltros.precioMax !== null && appliedFiltros.precioMax !== '' ? Number(appliedFiltros.precioMax) : null;
    if (min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      // no llamar a loadCamisetas hasta que el usuario corrija el rango
      return;
    }
    loadCamisetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFiltros, page, sort]);

  const isApplying = JSON.stringify(appliedFiltros) !== JSON.stringify(filtros);

  const loadCamisetas = async () => {
    try {
      // Show full-page loading only if there are no items yet (initial load)
      if (camisetas.length === 0) setLoading(true);
      else setFetching(true);
      // Solo enviar filtros con valor
      const filtrosActivos = Object.fromEntries(
        Object.entries(appliedFiltros).filter(([, v]) => v !== null && v !== undefined)
      );
      const params: CamisetaFiltro = {
        page,
        limit: PAGE_SIZE, // ✅ USAR constante
        sort,
      };
      if ('equipo' in filtrosActivos) params.equipo = filtrosActivos.equipo as string;
      if ('temporada' in filtrosActivos) params.temporada = filtrosActivos.temporada as string;
      if ('talle' in filtrosActivos && typeof filtrosActivos.talle === 'string') {
        params.talle = filtrosActivos.talle as Talle;
      }
      if ('condicion' in filtrosActivos && typeof filtrosActivos.condicion === 'string') {
        params.condicion = filtrosActivos.condicion as CondicionCamiseta;
      }
      if ('esSubasta' in filtrosActivos) params.esSubasta = filtrosActivos.esSubasta as boolean;
      if ('precioMin' in filtrosActivos && filtrosActivos.precioMin != null) params.precioMin = filtrosActivos.precioMin as string | number;
      if ('precioMax' in filtrosActivos && filtrosActivos.precioMax != null) params.precioMax = filtrosActivos.precioMax as string | number;

      const result = await camisetaService.getAll(params);
      setCamisetas(result.data);
      setTotalCount(result.count);

      // ✅ CALCULAR precios visibles para los filtros
      if (result.data.length > 0) {
        const precios = result.data.map(c => c.precioInicial);
        setMinPrecioVisible(Math.min(...precios));
        setMaxPrecioVisible(Math.max(...precios));
      } else {
        setMinPrecioVisible(null);
        setMaxPrecioVisible(null);
      }

    } catch (error) {
      setError('Error al cargar las camisetas');
      console.error(error);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleAddToCart = (camiseta: Camiseta) => {
    try {
      addToCart(camiseta, 1);
      alert(`✅ ${camiseta.titulo} agregada al carrito`);
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('❌ Error al agregar al carrito');
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
    <div className="container-fluid py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>🏆 Camisetas Disponibles</h1>
          <div className="text-end">
            <p className="text-muted mb-0">
              Mostrando {camisetas.length} de {totalCount} camisetas
              {fetching && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" aria-hidden="true" />}
            </p>
            <small className="text-muted">Página {page} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}</small>
            {/* ✅ USAR variables de precios visibles */}
            {minPrecioVisible !== null && maxPrecioVisible !== null && (
              <small className="text-muted d-block">
                Rango de precios: ${minPrecioVisible.toLocaleString()} - ${maxPrecioVisible.toLocaleString()}
              </small>
            )}
          </div>
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
            <div className="mb-2 d-flex align-items-center gap-2">
              <label className="mb-0">Ordenar por:</label>
              <select className="form-select form-select-sm w-auto" value={sort} onChange={e => setSort(e.target.value as 'precioAsc' | 'precioDesc' | 'fechaAsc' | 'fechaDesc')}>
                <option value="fechaDesc">Más nuevos</option>
                <option value="fechaAsc">Más antiguos</option>
                <option value="precioAsc">Precio: menor a mayor</option>
                <option value="precioDesc">Precio: mayor a menor</option>
              </select>
            </div>
            <div className="row">
              <div className="col-md-3 mb-2 mb-md-0">
                <select
                  className="form-select"
                  value={filtros.equipo ?? ''}
                  onChange={e => updateFiltro({ equipo: e.target.value || null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
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
                  onChange={e => updateFiltro({ talle: (e.target.value || null) as Talle | null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                >
                  <option value="">Todos los talles</option>
                  {Object.values(Talle).map(talle => (
                    <option key={talle} value={talle}>{talle}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-2 mb-md-0">
                <select
                  className="form-select"
                  value={filtros.temporada ?? ''}
                  onChange={e => updateFiltro({ temporada: e.target.value || null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
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
                  onChange={e => updateFiltro({ condicion: (e.target.value || null) as CondicionCamiseta | null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                >
                  <option value="">Todas las condiciones</option>
                  {Object.values(CondicionCamiseta).map(condicion => (
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
                  onChange={e => updateFiltro({ precioMin: e.target.value || null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
              </div>
              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Precio máximo"
                  min={0}
                  value={filtros.precioMax ?? ''}
                  onChange={e => updateFiltro({ precioMax: e.target.value || null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
              </div>
            </div>
            {/* Mensaje si el rango de precio es inválido */}
            {filtros.precioMin !== null && filtros.precioMax !== null &&
              filtros.precioMin !== '' && filtros.precioMax !== '' &&
              Number(filtros.precioMin) > Number(filtros.precioMax) && (
                <div className="alert alert-warning mt-2">Precio mínimo no puede ser mayor que precio máximo.</div>
            )}
            <div className="form-check mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="esSubastaCheck"
                checked={filtros.esSubasta}
                onChange={e => updateFiltro({ esSubasta: e.target.checked })}
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
                  type="button"
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
                      {/* ✅ CORREGIR: Usar const object correctamente */}
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
                        <div className="precio">${camiseta.precioInicial.toLocaleString()}</div>
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
                        <button type="button" className="btn btn-secondary w-100" disabled>
                          Vendida
                        </button>
                      ) : camiseta.esSubasta ? (
                        <button type="button" className="btn btn-warning w-100">
                          Ver Subasta
                        </button>
                      ) : camiseta.estado !== EstadoCamiseta.DISPONIBLE ? (
                        <button type="button" className="btn btn-secondary w-100" disabled>
                          No disponible
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-primary w-100"
                          onClick={() => handleAddToCart(camiseta)} // ✅ AGREGAR ESTO
                          disabled={camiseta.stock <= 0}
                        >
                          {camiseta.stock > 0 ? '🛒 Agregar al Carrito' : 'Sin Stock'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación simple */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button 
            type="button" 
            className="btn btn-outline-primary" 
            disabled={page <= 1 || isApplying || fetching} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <div>Página {page} de {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}</div>
          <button 
            type="button" 
            className="btn btn-outline-primary" 
            disabled={page >= Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) || isApplying || fetching} 
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};