import React from 'react';
import { useCart } from '../context/CartContext';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Carrito de compras</h2>
      {items.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <>
          <table style={{ width: '100%', marginBottom: '1rem' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ producto, cantidad }) => (
                <tr key={producto.id}>
                  <td>{producto.nombre}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={e => updateQuantity(producto.id, Number(e.target.value))}
                      style={{ width: 50 }}
                    />
                  </td>
                  <td>${producto.precioInicial}</td>
                  <td>${(producto.precioInicial * cantidad).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeFromCart(producto.id)} style={{ color: 'red' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Total: ${total.toFixed(2)}</strong>
            <button onClick={clearCart} style={{ background: '#eee', border: 'none', padding: '0.5rem 1rem', borderRadius: 4 }}>Vaciar carrito</button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
