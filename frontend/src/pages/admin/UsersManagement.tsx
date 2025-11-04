import React, { useEffect, useState } from 'react';
import useToast from '../../hooks/useToast';
import { adminService } from '../../services/api';
import type { Usuario } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UsersManagement: React.FC = () => {
  const { isAuthenticated, usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selected, setSelected] = useState<Usuario | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (usuario?.rol !== 'administrador') {
      navigate('/');
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, usuario]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsuarios();
      setUsers(data);
      setError('');
    } catch (e) {
      console.error('Error cargando usuarios', e);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id: number) => {
    try {
      await adminService.toggleEstadoUsuario(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
      showToast('Estado de usuario actualizado', { variant: 'success' });
    } catch (e) {
      console.error('Error al cambiar estado', e);
      showToast('No se pudo cambiar el estado del usuario', { variant: 'danger' });
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">👥 Gestión de Usuarios</h1>
        <button className="btn btn-outline-secondary" onClick={load} type="button">🔄 Actualizar</button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-2">Cargando usuarios...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nombre} {u.apellido}</td>
                  <td>{u.email}</td>
                  <td><span className="badge bg-secondary text-uppercase">{u.rol}</span></td>
                  <td>
                    {u.activo ? <span className="badge bg-success">Activo</span> : <span className="badge bg-danger">Inactivo</span>}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => setSelected(u)}>Detalle</button>
                      <button className="btn btn-outline-warning btn-sm" type="button" onClick={() => toggleEstado(u.id)}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalle Usuario (simple) */}
      {selected && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="d-flex justify-content-center align-items-center w-100 h-100 p-3">
            <div className="card" style={{ maxWidth: 600, width: '100%' }}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">👤 Detalle de Usuario</h5>
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <small className="text-muted">Nombre</small>
                    <div className="fw-bold">{selected.nombre} {selected.apellido}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="text-muted">Email</small>
                    <div>{selected.email}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted">Rol</small>
                    <div><span className="badge bg-secondary text-uppercase">{selected.rol}</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted">Estado</small>
                    <div>{selected.activo ? <span className="badge bg-success">Activo</span> : <span className="badge bg-danger">Inactivo</span>}</div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted">Dirección</small>
                    <div>{selected.direccion || <span className="text-muted">(sin cargar)</span>}</div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted">Teléfono</small>
                    <div>{selected.telefono || <span className="text-muted">(sin cargar)</span>}</div>
                  </div>
                </div>

                <div className="alert alert-info mt-3">Próximamente: estadísticas por usuario (compras, publicaciones, subastas).</div>
              </div>
              <div className="card-footer d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary" type="button" onClick={() => setSelected(null)}>Cerrar</button>
                <button className="btn btn-warning" type="button" onClick={() => { toggleEstado(selected.id); setSelected({ ...selected, activo: !selected.activo }); }}>
                  {selected.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
