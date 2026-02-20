import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import { useCart } from "../contexts/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const { items, clear, removeItem, setItemQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const openDetails = (productId) => {
    sessionStorage.setItem("selectedProductId", productId);
    navigate("/product-details", { state: { productId } });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const cartView = useMemo(() => {
    return items
      .map((i) => {
        const product = products.find((p) => p._id === i.productId);
        return product ? { ...i, product } : null;
      })
      .filter(Boolean);
  }, [items, products]);

  const total = useMemo(() => {
    return cartView.reduce(
      (sum, i) => sum + Number(i.product.price) * Number(i.quantity),
      0,
    );
  }, [cartView]);

  const startCheckout = async () => {
    if (!cartView.length) {
      toast.error("Your cart is empty");
      return;
    }

    for (const item of cartView) {
      if (Number(item.product.quantity) <= 0) {
        toast.error(`${item.product.name} is out of stock`);
        return;
      }
      if (Number(item.quantity) > Number(item.product.quantity)) {
        toast.error(
          `Only ${item.product.quantity} available for ${item.product.name}`,
        );
        return;
      }
    }

    setCheckingOut(true);
    try {
      const names = cartView
        .map((i) => String(i?.product?.name || "").trim())
        .filter(Boolean);
      const summary = names.length
        ? `${names[0]}${names.length > 1 ? ` +${names.length - 1} more` : ""}`
        : "Cart purchase";

      const { data } = await api.post("/payment/initiate", {
        amount: Math.round(total * 100),
        orderId: `CART-${Date.now()}`,
        orderName: `Purchase: ${summary}`,
        metadata: {
          items: cartView.map((i) => ({
            productId: i.product._id,
            quantity: i.quantity,
            productName: i.product.name,
          })),
        },
      });

      const payload = data?.data || data;
      if (!payload?.payment_url) throw new Error("Payment URL missing");
      if (payload?.pidx) {
        sessionStorage.setItem("lastPaymentPidx", String(payload.pidx));
        sessionStorage.setItem("lastPaymentStartedAt", String(Date.now()));
      }
      sessionStorage.setItem("paymentRetryTo", "/cart");
      window.location.href = payload.payment_url;
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Checkout failed",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Cart
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            Modify quantities and checkout.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            disabled={!items.length}
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={startCheckout}
            disabled={!items.length || checkingOut}
          >
            {checkingOut ? "Starting..." : `Checkout (${total.toFixed(2)} NPR)`}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-slate-700 dark:text-mid-300 mt-4">Loading...</p>
        </div>
      ) : cartView.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🛒</p>
          <p className="text-slate-700 dark:text-mid-300 font-medium">
            Your cart is empty
          </p>
          <Link to="/products" className="inline-block mt-4">
            <Button variant="primary">Browse products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cartView.map((i) => (
            <div
              key={i.productId}
              className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => openDetails(i.product._id)}
                    className="text-left font-semibold text-slate-900 dark:text-accent-100 hover:underline"
                  >
                    {i.product.name}
                  </button>
                  <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                    {Number(i.product.quantity)} in stock •{" "}
                    {Number(i.product.price).toFixed(2)} NPR each
                  </p>
                </div>

                <div className="flex items-end gap-2">
                  <div className="w-28">
                    <Input
                      label="Qty"
                      name={`cartQty-${i.productId}`}
                      type="number"
                      min="1"
                      max={i.product.quantity}
                      value={i.quantity}
                      onChange={(e) =>
                        setItemQuantity(i.productId, e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(i.productId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Cart;
