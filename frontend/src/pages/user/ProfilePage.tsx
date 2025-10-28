import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import type { Usuario, Compra, EstadoCompra } from '../../types';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { usuario, token, login, isAuthenticated } = useAuth();

    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        direccion: '',
        telefono: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

  // Historial (actividad simple): últimas compras
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loadingCompras, setLoadingCompras] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !usuario) {
            navigate('/login');
            return;
    }

    // Inicializar formulario con datos actuales
    setForm({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        email: usuario.email || '',
        direccion: (usuario as unknown as { direccion?: string }).direccion || '',
        telefono: (usuario as unknown as { telefono?: string }).telefono || '',
    });
    }, [isAuthenticated, usuario, navigate]);

    useEffect(() => {
    const cargarCompras = async () => {
        if (!usuario) return;
        try {
        setLoadingCompras(true);
        const tk = token || localStorage.getItem('token');
        const resp = await axios.get(`${API_BASE_URL}/compras/usuario/${usuario.id}` , {
            headers: { Authorization: `Bearer ${tk}` }
        });
        const arr: Compra[] = resp.data.data || [];
        // Ordenar por fecha compra desc y limitar a 5
        const sorted = arr.sort((a, b) => new Date(b.fechaCompra).getTime() - new Date(a.fechaCompra).getTime());
        setCompras(sorted.slice(0, 5));
        } catch (e) {
        // Silencioso: sección secundaria
        console.error('Error cargando compras del perfil', e);
        } finally {
        setLoadingCompras(false);
        }
    };
    cargarCompras();
    }, [usuario, token]);

    const canSave = useMemo(() => {
        return form.nombre.trim().length >= 2 && form.apellido.trim().length >= 2 && /.+@.+\..+/.test(form.email);
    }, [form]);

    const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    if (!canSave) {
        setError('Revisa los campos: nombre/apellido mínimo 2 caracteres y email válido.');
        return;
    }
    setError('');
    setSuccess('');
    setSaving(true);
    try {
        const tk = token || localStorage.getItem('token');
        const payload: Partial<Usuario> = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        } as Partial<Usuario>;
        const resp = await axios.put(`${API_BASE_URL}/usuarios/${usuario.id}`, payload, {
            headers: { Authorization: `Bearer ${tk}` }
        });
        const updated: Usuario = resp.data.data as Usuario;
      // Actualizar AuthContext reutilizando login para sincronizar localStorage
        const currentToken = tk || '';
        login({
            id: updated.id,
            nombre: updated.nombre,
            apellido: updated.apellido,
            email: updated.email,
            rol: (updated as unknown as { rol: string }).rol || 'usuario'
        }, currentToken);
        setSuccess('Perfil actualizado correctamente');
    } catch (e: unknown) {
        console.error('Error actualizando perfil', e);
        setError('No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
        setSaving(false);
    }
    };

    if (!usuario) return null;

    return (
        <div className="container mt-4 mb-5">
        <div className="d-flex align-items-center mb-4">
            <button className="btn btn-outline-secondary me-3" onClick={() => navigate(-1)} type="button">← Volver</button>
            <h1 className="mb-0">👤 Mi Perfil</h1>
        </div>

        {error && (
            <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
            </div>
        )}
        {success && (
            <div className="alert alert-success alert-dismissible" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close"></button>
            </div>
        )}

        <div className="row">
            {/* Formulario de datos */}
            <div className="col-lg-8">
            <form onSubmit={onSubmit}>
                <div className="card mb-3">
                <div className="card-header bg-light">
                    <h5 className="mb-0">📋 Datos Personales</h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Nombre</label>
                        <input className="form-control" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Apellido</label>
                        <input className="form-control" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Rol</label>
                        <input className="form-control" value={(usuario as unknown as { rol?: string }).rol || ''} disabled />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Dirección</label>
                        <input className="form-control" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Teléfono</label>
                        <input className="form-control" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                    </div>
                    </div>
                </div>
                </div>

                <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>
                    {saving ? (<><span className="spinner-border spinner-border-sm me-2"></span> Guardando...</>) : 'Guardar Cambios'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/orders')}>📦 Mis Compras</button>
                </div>
            </form>

            {/* Cambio de contraseña (pendiente backend) */}
            <div className="card mt-4">
                <div className="card-header bg-light">
                <h5 className="mb-0">🔒 Cambiar Contraseña</h5>
                </div>
                <div className="card-body">
                <div className="alert alert-info mb-0">
                    Esta funcionalidad requiere un endpoint de backend (p. ej. POST /auth/change-password). Por ahora se deja como pendiente.
                </div>
                </div>
            </div>
            </div>

            {/* Actividad reciente */}
            <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: '20px' }}>
                <div className="card-header bg-primary text-white">
                <h5 className="mb-0">🕒 Actividad Reciente</h5>
                </div>
                <div className="card-body">
                {loadingCompras ? (
                    <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Cargando actividad...
                    </div>
                ) : compras.length === 0 ? (
                    <div className="text-center text-muted">Sin actividad reciente</div>
                ) : (
                    <div className="list-group list-group-flush">
                    {compras.map((c) => (
                        <div key={c.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                            <strong>Orden #{c.id}</strong>
                            <div className="text-muted small">
                                {new Date(c.fechaCompra).toLocaleDateString('es-AR')} • {c.camiseta?.titulo}
                            </div>
                            </div>
                            <span className="fw-bold text-primary">${c.total.toLocaleString()}</span>
                        </div>
                        <div className="mt-1">
                            <span className="badge bg-secondary">{(c.estado as EstadoCompra).toString()}</span>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </div>
        </div>
        </div>
    );
    };

export default ProfilePage;
