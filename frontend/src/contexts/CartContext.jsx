import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * CartContext
 *
 * Stores a small shopping-cart-like list of items:
 *   { productId: string, quantity: number }
 *
 * Persistence:
 * - Uses localStorage so cart survives tab closes and refreshes.
 * - Keeps data normalized (positive integer quantities, valid productId).
 */
const CartContext = createContext();

const STORAGE_KEY = "cart";

// Read and sanitize cart from localStorage.
const readStoredCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => ({
        productId: i?.productId,
        quantity: Math.floor(Number(i?.quantity) || 0),
      }))
      .filter((i) => i.productId && i.quantity > 0);
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  // Initialize from storage once.
  const [items, setItems] = useState(readStoredCart);

  // Persist on any change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Adds quantity to an item. If item doesn't exist, it is created.
   */
  const addItem = useCallback((productId, quantity = 1) => {
    const qty = Math.max(Math.floor(Number(quantity) || 1), 1);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return [...prev, { productId, quantity: qty }];
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + qty } : i,
      );
    });
  }, []);

  /**
   * Sets quantity to an exact value (minimum 1).
   */
  const setItemQuantity = useCallback((productId, quantity) => {
    const qty = Math.max(Math.floor(Number(quantity) || 1), 1);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i,
      ),
    );
  }, []);

  /**
   * Removes an item completely.
   */
  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  /**
   * Clears the entire cart.
   */
  const clear = useCallback(() => setItems([]), []);

  // Derived state used by the navbar badge.
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, totalItems, addItem, setItemQuantity, removeItem, clear }),
    [items, totalItems, addItem, setItemQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export default CartContext;
