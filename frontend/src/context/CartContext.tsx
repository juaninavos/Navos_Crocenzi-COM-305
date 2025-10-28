import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Camiseta } from '../types';
import { CartContext } from './CartContextDef';
import type { CartItem } from './CartContextDef';

const CART_KEY = 'cart_items';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_KEY);
    console.log('🔄 Cargando carrito desde localStorage:', stored); // ✅ LOG
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    console.log('💾 Guardando carrito en localStorage:', items); // ✅ LOG
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (producto: Camiseta, cantidad: number = 1) => {
    console.log('➕ Agregando al carrito:', producto.titulo, 'cantidad:', cantidad); // ✅ LOG
    
    // ✅ VALIDACIÓN: Verificar que el producto tenga precio
    if (!producto.precioInicial || producto.precioInicial <= 0) {
      console.error('❌ Producto sin precio válido:', producto);
      throw new Error('El producto no tiene un precio válido');
    }

    setItems(prev => {
      const idx = prev.findIndex(i => i.producto.id === producto.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].cantidad += cantidad;
        console.log('✏️ Producto ya existe, actualizando cantidad a:', updated[idx].cantidad); // ✅ LOG
        return updated;
      }
      console.log('🆕 Producto nuevo agregado'); // ✅ LOG
      return [...prev, { producto, cantidad }];
    });
  };

  const removeFromCart = (productoId: number) => {
    console.log('🗑️ Eliminando del carrito, ID:', productoId); // ✅ LOG
    setItems(prev => prev.filter(i => i.producto.id !== productoId));
  };

  const updateQuantity = (productoId: number, cantidad: number) => {
    console.log('🔄 Actualizando cantidad, ID:', productoId, 'nueva cantidad:', cantidad); // ✅ LOG
    setItems(prev => prev.map(i =>
      i.producto.id === productoId ? { ...i, cantidad } : i
    ));
  };

  const clearCart = () => {
    console.log('🧹 Vaciando carrito'); // ✅ LOG
    setItems([]);
  };

  const total = items.reduce((sum, i) => sum + i.producto.precioInicial * i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

