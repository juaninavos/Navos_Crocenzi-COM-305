import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Camiseta } from '../types';
import { CartContext } from './CartContextDef';
import type { CartItem } from './CartContextDef';
const CART_KEY = 'cart_items';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (producto: Camiseta, cantidad: number = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.producto.id === producto.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].cantidad += cantidad;
        return updated;
      }
      return [...prev, { producto, cantidad }];
    });
  };

  const removeFromCart = (productoId: number) => {
    setItems(prev => prev.filter(i => i.producto.id !== productoId));
  };

  const updateQuantity = (productoId: number, cantidad: number) => {
    setItems(prev => prev.map(i =>
      i.producto.id === productoId ? { ...i, cantidad } : i
    ));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.producto.precioInicial * i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

