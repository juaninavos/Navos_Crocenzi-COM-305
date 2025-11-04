import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { camisetaService } from '../../services/api';
import type { Camiseta } from '../../types';
import { useCart } from '../../context/useCart';
import useToast from '../../hooks/useToast';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [camiseta, setCamiseta] = useState<Camiseta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await camisetaService.getById(Number(id));
        setCamiseta(data);
      } catch (e) {
        console.error('Error cargando producto', e);
        setError('No se pudo cargar el producto');
        showToast('No se pudo cargar el producto', { variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, showToast]);

  const handleAddToCart = () => {
    if (!camiseta) return;
    addToCart(camiseta, 1);
    showToast(`${camiseta.titulo} agregado al carrito`, { variant: 'success' });
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3">Cargando producto...</p>
      </div>
    );
  }

  if (error || !camiseta) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error || 'Producto no encontrado'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/catalog')} type="button">Volver al Catálogo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-outline-secondary me-3" onClick={() => navigate(-1)} type="button">← Volver</button>
        <h1 className="mb-0">{camiseta.titulo}</h1>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card">
            {camiseta.imagen ? (
              <img src={camiseta.imagen} alt={camiseta.titulo} className="card-img-top img-fluid" style={{ maxHeight: 480, objectFit: 'contain' }} />
            ) : (
              <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 320 }}>
                <span style={{ fontSize: '6rem' }}>👕</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Precio</span>
                <span className="fs-3 fw-bold text-success">${camiseta.precioInicial.toLocaleString()}</span>
              </div>
              <div className="mb-2">
                {camiseta.esSubasta ? (
                  <span className="badge bg-danger">En subasta</span>
                ) : (
                  <span className="badge bg-success">Disponible</span>
                )}
                {camiseta.stock <= 0 && (
                  <span className="badge bg-secondary ms-2">Sin stock</span>
                )}
              </div>

              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="fw-bold">Equipo</td><td>{camiseta.equipo}</td></tr>
                  <tr><td className="fw-bold">Temporada</td><td>{camiseta.temporada}</td></tr>
                  <tr><td className="fw-bold">Talle</td><td>{camiseta.talle}</td></tr>
                  <tr><td className="fw-bold">Condición</td><td>{camiseta.condicion}</td></tr>
                  {camiseta.categoria && (
                    <tr><td className="fw-bold">Categoría</td><td>{camiseta.categoria.nombre}</td></tr>
                  )}
                  <tr><td className="fw-bold">Vendedor</td><td>{camiseta.vendedor.nombre} {camiseta.vendedor.apellido}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-grid gap-2 d-md-flex">
            {camiseta.esSubasta ? (
              <button className="btn btn-warning flex-grow-1" onClick={() => navigate(`/auctions`)} type="button">Ver Subastas</button>
            ) : (
              <button className="btn btn-primary flex-grow-1" disabled={camiseta.stock <= 0} onClick={handleAddToCart} type="button">
                🛒 Agregar al Carrito
              </button>
            )}
            <button className="btn btn-outline-secondary" onClick={() => navigate('/catalog')} type="button">Volver al Catálogo</button>
          </div>
        </div>
      </div>

      {camiseta.descripcion && (
        <div className="card mt-4">
          <div className="card-header bg-light"><h5 className="mb-0">Descripción</h5></div>
          <div className="card-body"><p className="mb-0 text-muted">{camiseta.descripcion}</p></div>
        </div>
      )}

      {/* Placeholder de reseñas/comentarios */}
      <div className="card mt-4">
        <div className="card-header bg-light"><h5 className="mb-0">Reseñas</h5></div>
        <div className="card-body text-muted">Próximamente: reseñas y comentarios de compradores.</div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
