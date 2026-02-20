import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
const CartContext = createContext();

const STORAGE_KEY = "cart";

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
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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

  const setItemQuantity = useCallback((productId, quantity) => {
    const qty = Math.max(Math.floor(Number(quantity) || 1), 1);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i,
      ),
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

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
