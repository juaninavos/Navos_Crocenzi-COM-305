import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { camisetaService, categoriaService, ApiAuthError } from '../../services/api';
import type { Camiseta, Talle, CondicionCamiseta, Categoria } from '../../types';

export const MyProductsPage: React.FC = () => {
  const { usuario, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [editSuccess, setEditSuccess] = useState<string>('');
  const [camisetas, setCamisetas] = useState<Camiseta[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ titulo: string; precioInicial: number; stock: number }>({ titulo: '', precioInicial: 0, stock: 1 });
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const { showToast } = useToast();
  const canPublish = usuario?.rol === 'usuario';

  // Métricas simples (cliente)
  const metrics = useMemo(() => {
    const total = camisetas.length;
    const subastas = camisetas.filter(c => c.esSubasta).length;
    const venta = total - subastas;
    const stockTotal = camisetas.reduce((sum, c) => sum + (c.stock || 0), 0);
    const valorPublicado = camisetas.reduce((sum, c) => sum + (c.precioInicial * (c.stock || 0)), 0);
    return { total, subastas, venta, stockTotal, valorPublicado };
  }, [camisetas]);

  // Form publicación rápida
  const [creating, setCreating] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [form, setForm] = useState<{
    titulo: string;
    equipo: string;
    temporada: string;
    talle: Talle;
    condicion: CondicionCamiseta;
    imagen: string;
    precioInicialInput: string; // mantener como string para evitar bugs al tipear
    stockInput: string; // idem
    categoriaIdInput?: string; // id seleccionada como string
    esSubasta: boolean;
  }>({
    titulo: '',
    equipo: '',
    temporada: '',
    talle: 'M' as Talle,
    condicion: 'Nueva' as CondicionCamiseta,
    imagen: '',
    precioInicialInput: '',
    stockInput: '1',
    categoriaIdInput: '',
    esSubasta: false,
  });

  const canCreate = useMemo(() => {
    const precio = Number(form.precioInicialInput);
    const stock = Number(form.stockInput);
    return (
      form.titulo.trim().length >= 2 &&
      form.equipo.trim().length >= 2 &&
      form.temporada.trim().length >= 2 &&
      !Number.isNaN(precio) && precio > 0 &&
      !Number.isNaN(stock) && stock > 0
    );
  }, [form]);

  const fetchMine = useCallback(async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      setError('');
      const { data } = await camisetaService.getAll({ vendedorId: usuario.id, limit: 100 });
      setCamisetas(data);
    } catch (e) {
      console.error('Error cargando mis camisetas', e);
      setError('No se pudo cargar tus publicaciones');
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (!isAuthenticated || !usuario) {
      navigate('/login');
      return;
    }
    fetchMine();
    // cargar categorías activas
    (async () => {
      try {
        setLoadingCategorias(true);
  const { data } = await categoriaService.getAll();
  setCategorias(data.filter((c: Categoria) => c.activa !== false));
      } catch (err) {
        console.error('Error cargando categorías', err);
      } finally {
        setLoadingCategorias(false);
      }
    })();
  }, [isAuthenticated, usuario, fetchMine, navigate]);

  const crearPublicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!canPublish) {
      setFormError('Tu rol no permite publicar productos. Inicia sesión con una cuenta de usuario.');
      showToast('Tu rol no permite publicar productos', { variant: 'warning' });
      return;
    }
    if (!canCreate) {
      setFormError('Completa todos los campos obligatorios correctamente.');
      return;
    }
    try {
      setCreating(true);
      const payload: Partial<Camiseta> & { precioInicial: number; esSubasta?: boolean; stock?: number; categoriaId?: number } = {
        titulo: form.titulo.trim(),
        descripcion: `${form.equipo} ${form.temporada}`,
        equipo: form.equipo.trim(),
        temporada: form.temporada.trim(),
        talle: form.talle,
        condicion: form.condicion,
        imagen: form.imagen || undefined,
        precioInicial: Number(form.precioInicialInput),
        esSubasta: form.esSubasta,
        stock: Number(form.stockInput),
      };
      const catId = form.categoriaIdInput ? Number(form.categoriaIdInput) : undefined;
      if (catId && !Number.isNaN(catId)) {
        payload.categoriaId = catId;
      }
      await camisetaService.publicar(payload);
  setFormSuccess('✅ Publicación creada con éxito');
  showToast('Publicación creada con éxito', { variant: 'success' });
      setTimeout(() => setFormSuccess(''), 2000);
      setForm({ titulo: '', equipo: '', temporada: '', talle: 'M' as Talle, condicion: 'Nueva' as CondicionCamiseta, imagen: '', precioInicialInput: '', stockInput: '1', categoriaIdInput: '', esSubasta: false });
      await fetchMine();
    } catch (e) {
      console.error('Error creando publicación', e);
      if (e instanceof ApiAuthError) {
        setFormError('Sesión expirada o no autenticada. Volvé a iniciar sesión.');
        showToast('Sesión expirada. Iniciá sesión nuevamente.', { variant: 'warning' });
        // Opcional: redirigir al login después de un breve delay
        setTimeout(() => navigate('/login'), 800);
      } else if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const data = e.response?.data as unknown;
        let message: string | undefined;
        let code: string | undefined;
        let details: unknown;
        if (data && typeof data === 'object') {
          const d = data as { message?: string; code?: string; details?: unknown };
          message = d.message;
          code = d.code;
          details = d.details;
        }
        if (status === 401) {
          setFormError('No estás autenticado. Volvé a iniciar sesión.');
        } else if (status === 403) {
          setFormError(message || 'No tenés permisos para publicar.');
        } else if (status === 400) {
          // Si hay detalles de Zod, mostrar el primero
          let zodMsg: string | undefined;
          if (Array.isArray(details) && details.length > 0) {
            const first = details[0] as { message?: string; path?: (string|number)[] };
            if (first?.message) {
              zodMsg = first.message;
            }
          }
          setFormError(zodMsg || message || 'Datos inválidos. Revisá los campos.');
        } else if (status === 404) {
          setFormError(message || 'No se encontró el vendedor o está inactivo. Verificá que tu cuenta esté activa.');
        } else if (status === 500) {
          setFormError(message || 'Error interno del servidor al publicar.');
        } else {
          setFormError(message || 'No se pudo crear la publicación');
        }
        console.error('❌ Publicar error:', { status, code, message, details });
      } else {
        setFormError('No se pudo crear la publicación');
      }
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: Camiseta) => {
    setEditingId(c.id);
    setEditForm({ titulo: c.titulo, precioInicial: c.precioInicial, stock: c.stock });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    setEditError('');
    setEditSuccess('');
    if (!editForm.titulo.trim() || Number(editForm.precioInicial) <= 0 || Number(editForm.stock) < 0) {
      setEditError('Completa los campos correctamente.');
      return;
    }
    try {
      await camisetaService.update(id, {
        titulo: editForm.titulo.trim(),
        precioInicial: Number(editForm.precioInicial),
        stock: Number(editForm.stock),
      });
  setEditSuccess('✅ Cambios guardados con éxito');
  showToast('Cambios guardados con éxito', { variant: 'success' });
      setTimeout(() => setEditSuccess(''), 2000);
      setEditingId(null);
      await fetchMine();
    } catch (e) {
      console.error('Error guardando cambios', e);
      setEditError('No se pudo guardar la edición');
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await camisetaService.delete(id);
      setCamisetas(prev => prev.filter(c => c.id !== id));
      showToast('Publicación eliminada', { variant: 'success' });
    } catch (e) {
      console.error('Error eliminando publicación', e);
      showToast('No se pudo eliminar la publicación', { variant: 'danger' });
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">👕 Mis Publicaciones</h1>
        <button className="btn btn-outline-secondary" onClick={fetchMine} type="button">🔄 Actualizar</button>
      </div>

      {/* Métricas */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="text-muted small">Publicaciones</div>
              <div className="fs-4 fw-bold">{metrics.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="text-muted small">En subasta</div>
              <div className="fs-4 fw-bold text-danger">{metrics.subastas}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="text-muted small">Venta directa</div>
              <div className="fs-4 fw-bold text-success">{metrics.venta}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="text-muted small">Valor publicado</div>
              <div className="fs-4 fw-bold">${metrics.valorPublicado.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form publicación rápida */}
      <div className="card mb-4">
        <div className="card-header bg-light"><h5 className="mb-0">➕ Crear nueva publicación</h5></div>
        <div className="card-body">
          {!canPublish && (
            <div className="alert alert-warning" role="alert">
              Estás autenticado como administrador. Para publicar productos, iniciá sesión con una cuenta de usuario.
            </div>
          )}
          {formError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {formError}
              <button type="button" className="btn-close" onClick={() => setFormError('')} aria-label="Close"></button>
            </div>
          )}
          {formSuccess && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {formSuccess}
              <button type="button" className="btn-close" onClick={() => setFormSuccess('')} aria-label="Close"></button>
            </div>
          )}
          <form onSubmit={crearPublicacion}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Título</label>
                <input className="form-control" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Equipo</label>
                <input className="form-control" value={form.equipo} onChange={e => setForm(f => ({ ...f, equipo: e.target.value }))} required />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Temporada</label>
                <input className="form-control" value={form.temporada} onChange={e => setForm(f => ({ ...f, temporada: e.target.value }))} required />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Talle</label>
                <select className="form-select" value={form.talle} onChange={e => setForm(f => ({ ...f, talle: e.target.value as Talle }))}>
                  {['XS','S','M','L','XL','XXL'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Condición</label>
                <select className="form-select" value={form.condicion} onChange={e => setForm(f => ({ ...f, condicion: e.target.value as CondicionCamiseta }))}>
                  {['Nueva','Usada','Vintage'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={form.categoriaIdInput}
                  onChange={e => setForm(f => ({ ...f, categoriaIdInput: e.target.value }))}
                  disabled={loadingCategorias}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Precio Inicial ($)</label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  className="form-control"
                  value={form.precioInicialInput}
                  onChange={e => {
                    const v = e.target.value;
                    // permitir vacío temporalmente mientras escribe
                    if (v === '' || /^\d+$/.test(v)) {
                      setForm(f => ({ ...f, precioInicialInput: v }));
                    }
                  }}
                  required
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  className="form-control"
                  value={form.stockInput}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^\d+$/.test(v)) {
                      setForm(f => ({ ...f, stockInput: v }));
                    }
                  }}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">URL de Imagen</label>
                <input className="form-control" value={form.imagen} onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input id="esSub" className="form-check-input" type="checkbox" checked={form.esSubasta} onChange={e => setForm(f => ({ ...f, esSubasta: e.target.checked }))} />
                  <label htmlFor="esSub" className="form-check-label">Publicar como subasta</label>
                </div>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={!canCreate || creating || !canPublish}>
                {creating ? (<><span className="spinner-border spinner-border-sm me-2"></span> Publicando...</>) : 'Publicar'}
              </button>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setForm({ titulo: '', equipo: '', temporada: '', talle: 'M' as Talle, condicion: 'Nueva' as CondicionCamiseta, imagen: '', precioInicialInput: '', stockInput: '1', categoriaIdInput: '', esSubasta: false })}>Limpiar</button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2">Cargando publicaciones...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : camisetas.length === 0 ? (
        <div className="alert alert-info">Aún no tienes publicaciones</div>
      ) : (
        <div className="row">
          {camisetas.map((c) => (
            <div key={c.id} className="col-12 col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="position-relative">
                  {c.imagen ? (
                    <img src={c.imagen} alt={c.titulo} className="card-img-top" style={{ height: 200, objectFit: 'cover' }} />
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                      <span style={{ fontSize: '3rem' }}>👕</span>
                    </div>
                  )}
                  <span className={`position-absolute top-0 end-0 m-2 badge ${c.esSubasta ? 'bg-danger' : 'bg-success'}`}>
                    {c.esSubasta ? 'Subasta' : 'Venta'}
                  </span>
                </div>
                <div className="card-body d-flex flex-column">
                  {editingId === c.id ? (
                    <>
                      {editError && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                          {editError}
                          <button type="button" className="btn-close" onClick={() => setEditError('')} aria-label="Close"></button>
                        </div>
                      )}
                      {editSuccess && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                          {editSuccess}
                          <button type="button" className="btn-close" onClick={() => setEditSuccess('')} aria-label="Close"></button>
                        </div>
                      )}
                      <input className="form-control mb-2" value={editForm.titulo} onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} />
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label small">Precio ($)</label>
                          <input type="number" className="form-control" value={editForm.precioInicial} onChange={e => setEditForm(f => ({ ...f, precioInicial: Number(e.target.value) }))} />
                        </div>
                        <div className="col-6">
                          <label className="form-label small">Stock</label>
                          <input type="number" className="form-control" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: Number(e.target.value) }))} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <h5 className="card-title">{c.titulo}</h5>
                  )}
                  <div className="text-muted mb-2"><small>{c.equipo} • {c.temporada}</small></div>
                  <div className="mb-2"><span className="badge bg-info">{c.condicion}</span></div>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-success">${(editingId === c.id ? editForm.precioInicial : c.precioInicial).toLocaleString()}</span>
                    <small className="text-muted">Stock: {editingId === c.id ? editForm.stock : c.stock}</small>
                  </div>
                  <div className="mt-auto d-grid gap-2">
                    {editingId === c.id ? (
                      <div className="d-flex gap-2">
                        <button className="btn btn-success w-50" type="button" onClick={() => saveEdit(c.id)}>Guardar</button>
                        <button className="btn btn-outline-secondary w-50" type="button" onClick={cancelEdit}>Cancelar</button>
                      </div>
                    ) : (
                      <>
                        <button className="btn btn-outline-primary" onClick={() => navigate(`/product/${c.id}`)} type="button">Ver</button>
                        <div className="d-flex gap-2">
                          <button className="btn btn-outline-warning w-50" type="button" onClick={() => startEdit(c)}>Editar</button>
                          {pendingDeleteId === c.id ? (
                            <div className="d-flex gap-2 w-50">
                              <button className="btn btn-danger w-50" type="button" onClick={() => confirmDelete(c.id)}>Confirmar</button>
                              <button className="btn btn-secondary w-50" type="button" onClick={() => setPendingDeleteId(null)}>Cancelar</button>
                            </div>
                          ) : (
                            <button className="btn btn-outline-danger w-50" type="button" onClick={() => setPendingDeleteId(c.id)}>Eliminar</button>
                          )}
                        </div>
                      </>
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

export default MyProductsPage;
