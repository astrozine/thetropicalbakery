'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  min_batch_size?: number;
  batch_multiplier?: number;
  /** 'box' = a Degustation Box (uses the box delivery calendar); anything else is a Menu de Eventos item. */
  kind?: 'box' | 'events';
  /** For boxes: which tasting_boxes row to decrement, and how many are left. */
  tasting_box_id?: string;
  max_quantity?: number;
  /** For boxes: 2, 4 or 6 treats (the server prices it from this). Missing on older carts = 4. */
  box_size?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, options?: { open?: boolean; quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tropical_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    localStorage.setItem('tropical_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, options?: { open?: boolean; quantity?: number }) => {
    setItems(current => {
      const existing = current.find(i => i.id === newItem.id);
      if (existing) {
        const batch = existing.batch_multiplier || 1;
        const next = existing.quantity + batch;
        if (existing.max_quantity && next > existing.max_quantity) return current;
        return current.map(i => i.id === newItem.id ? { ...i, quantity: next } : i);
      }
      const minBatch = newItem.min_batch_size || 1;
      return [...current, { ...newItem, quantity: options?.quantity ?? minBatch }];
    });
    if (options?.open !== false) setIsCartOpen(true); // Auto-open cart when adding
  };

  const removeFromCart = (id: string) => {
    setItems(current => current.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    // We enforce the min_batch_size locally in the component or here.
    // If we do it here, we need the item to check min_batch_size.
    setItems(current => {
      const item = current.find(i => i.id === id);
      if (!item) return current;
      if (quantity < (item.min_batch_size || 1)) {
        return current; // Do nothing if trying to go below minimum
      }
      if (item.max_quantity && quantity > item.max_quantity) {
        return current; // Sold out beyond this
      }
      return current.map(i => i.id === id ? { ...i, quantity } : i);
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total price. Price is formatted as "28,00" or "R$ 28,00".
  const totalPrice = items.reduce((sum, item) => {
    const numPrice = parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.'));
    return sum + (numPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
