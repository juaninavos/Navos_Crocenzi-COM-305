import { useState } from 'react';
import { useCart } from '../context/useCart';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CheckoutPage: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    metodoPago: '',
    datosPago: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!form.nombre || !form.direccion || !form.telefono)) {
      setError('Completa todos los datos personales.');
      return;
    }
    if (step === 2 && !form.metodoPago) {
      setError('Selecciona un método de pago.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  // Suponiendo que tienes el usuario logueado en localStorage o contexto
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const usuarioId = usuario?.id;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const body = {
        usuarioId,
        direccionEnvio: form.direccion,
        // Si tienes método de pago, puedes agregarlo aquí:
        // metodoPagoId: ...
        items: items.map(({ producto, cantidad }) => ({
          camisetaId: producto.id,
          cantidad
        }))
      };
      await axios.post('/api/compras', body);
      setSuccess(true);
      clearCart();
    } catch {
      setError('Error al procesar la compra.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8 }}>
        <h2>¡Compra realizada con éxito!</h2>
        <p>Gracias por tu compra.</p>
        <Link to="/catalog">Volver al catálogo</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8 }}>
      <h2>Checkout</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {step === 1 && (
        <div>
          <h3>Datos personales</h3>
          <input name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <input name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleNext}>Siguiente</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h3>Método de pago</h3>
          <select name="metodoPago" value={form.metodoPago} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }}>
            <option value="">Selecciona...</option>
            <option value="tarjeta">Tarjeta de crédito</option>
            <option value="transferencia">Transferencia bancaria</option>
            <option value="efectivo">Efectivo</option>
          </select>
          {form.metodoPago === 'tarjeta' && (
            <input name="datosPago" placeholder="Número de tarjeta" value={form.datosPago} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          )}
          {form.metodoPago === 'transferencia' && (
            <input name="datosPago" placeholder="CBU o Alias" value={form.datosPago} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={handleBack}>Atrás</button>
            <button onClick={handleNext}>Siguiente</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          <h3>Confirmación</h3>
          <p><strong>Nombre:</strong> {form.nombre}</p>
          <p><strong>Dirección:</strong> {form.direccion}</p>
          <p><strong>Teléfono:</strong> {form.telefono}</p>
          <p><strong>Método de pago:</strong> {form.metodoPago}</p>
          <h4>Resumen de compra</h4>
          <ul>
            {items.map(({ producto, cantidad }) => (
              <li key={producto.id}>{producto.titulo} x{cantidad} - ${producto.precioInicial * cantidad}</li>
            ))}
          </ul>
          <strong>Total: ${total.toFixed(2)}</strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={handleBack}>Atrás</button>
            <button onClick={handleConfirm} disabled={loading}>{loading ? 'Procesando...' : 'Confirmar compra'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
