import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  username: string;
  email: string;
}

interface AppContextType {
  // Language
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  t: (th: string, en: string) => string;

  // Auth
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, password: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  cartTotal: number;

  // Wishlist
  wishlist: number[];
  toggleWishlist: (productId: number) => void;

  // Auth modal
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const FREE_SHIPPING_THRESHOLD = 2000;
const SHIPPING_FEE = 100;

// Mock users storage
const mockUsers: { username: string; email: string; password: string }[] = [
  { username: 'demo', email: 'demo@test.com', password: '1234' },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const t = (th: string, en: string) => (language === 'th' ? th : en);

  const login = (username: string, password: string): boolean => {
    const found = mockUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      setUser({ username: found.username, email: found.email });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  const register = (username: string, email: string, password: string) => {
    mockUsers.push({ username, email, password });
    setUser({ username, email });
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const shippingFee = cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const cartTotal = cartSubtotal + shippingFee;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        user,
        login,
        logout,
        register,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        shippingFee,
        cartTotal,
        wishlist,
        toggleWishlist,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
