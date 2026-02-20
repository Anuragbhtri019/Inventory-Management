import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import { useCart } from "../contexts/CartContext";

const ProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  const productId =
    location.state?.productId || sessionStorage.getItem("selectedProductId");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const fetchOne = async () => {
      if (!productId) {
        toast.info("Select a product to view details");
        navigate("/products", { replace: true });
        return;
      }

      setLoading(true);
      try {
        sessionStorage.setItem("selectedProductId", productId);
        const { data } = await api.get(`/products/${productId}`);
        setProduct(data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [productId, navigate]);

  const images = useMemo(() => {
    if (!product) return [];
    const arr = Array.isArray(product.images) ? product.images : [];
    const fallback = product.imageUrl ? [product.imageUrl] : [];
    const merged = [...arr, ...fallback].filter(Boolean);
    return Array.from(new Set(merged)).slice(0, 4);
  }, [product]);

  const safeQty = useMemo(() => {
    const n = Math.floor(Number(qty) || 1);
    const max = Math.max(Number(product?.quantity) || 0, 0);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return max > 0 ? Math.min(n, max) : 1;
  }, [qty, product]);

  const toggleFavourite = async () => {
    if (!product) return;
    try {
      const { data } = await api.patch(`/products/${product._id}/favourite`);
      setProduct(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update favourite");
    }
  };

  const startBuyNow = async () => {
    if (!product) return;
    if (Number(product.quantity) <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCheckingOut(true);
    try {
      const totalNpr = Number(product.price) * safeQty;
      const { data } = await api.post("/payment/initiate", {
        amount: Math.round(totalNpr * 100),
        orderId: `PROD-${product._id}-${Date.now()}`,
        orderName: `Buy ${product.name}`,
        metadata: {
          items: [
            {
              productId: product._id,
              quantity: safeQty,
              productName: product.name,
            },
          ],
        },
      });

      const payload = data?.data || data;
      if (!payload?.payment_url) throw new Error("Payment URL missing");
      if (payload?.pidx) {
        sessionStorage.setItem("lastPaymentPidx", String(payload.pidx));
        sessionStorage.setItem("lastPaymentStartedAt", String(Date.now()));
      }
      sessionStorage.setItem("paymentRetryTo", "/product-details");
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
      <div className="mb-6">
        <Link
          to="/products"
          className="text-sm font-semibold text-slate-700 dark:text-mid-300 hover:underline"
        >
          ← Back to products
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-slate-700 dark:text-mid-300 mt-4">Loading...</p>
        </div>
      ) : !product ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">❌</p>
          <p className="text-slate-700 dark:text-mid-300 font-medium">
            Product not found
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 lg:items-stretch">
          <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden flex flex-col h-full">
            <div className="relative flex-1 min-h-[280px] sm:min-h-[360px]">
              {images.length ? (
                <img
                  src={images[Math.min(activeImage, images.length - 1)]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-deep-900/30 flex items-center justify-center text-6xl">
                  🖼️
                </div>
              )}

              <button
                type="button"
                onClick={toggleFavourite}
                className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/80 dark:bg-deep-950/60 border border-white/50 dark:border-deep-700/70 backdrop-blur-xl flex items-center justify-center"
                aria-label="Toggle favourite"
              >
                {product.isFavourite ? "❤️" : "🤍"}
              </button>
            </div>

            {images.length > 1 && (
              <div className="p-4 flex gap-3 overflow-x-auto shrink-0">
                {images.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${
                      idx === activeImage
                        ? "border-brand-400"
                        : "border-slate-200/70 dark:border-deep-700/70"
                    }`}
                    aria-label={`Image ${idx + 1}`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass p-5 sm:p-6 h-full">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-accent-100">
                  {product.name}
                </h1>
                <p className="text-sm text-slate-700 dark:text-mid-300 mt-2">
                  {product.category ? product.category : "Uncategorized"} •{" "}
                  {Number(product.quantity)} in stock
                </p>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-sun-600 dark:text-sun-400">
                {Number(product.price).toFixed(2)} NPR
              </div>
            </div>

            {Number(product.quantity) > 0 && Number(product.quantity) < 10 && (
              <div className="mt-4 inline-block px-3 py-1 rounded-full bg-sun-500 text-white text-xs font-bold">
                Low stock (less than 10)
              </div>
            )}

            {product.description && (
              <p className="mt-5 text-slate-700 dark:text-mid-300 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mt-6 flex items-end gap-3">
              <div className="w-28">
                <Input
                  label="Quantity"
                  name="qty"
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={Number(product.quantity) <= 0}
                onClick={() => {
                  addItem(product._id, safeQty);
                  toast.success("Added to cart");
                }}
              >
                Add to Cart
              </Button>
            </div>

            <div className="mt-3">
              <Button
                variant="primary"
                className="w-full"
                disabled={checkingOut || Number(product.quantity) <= 0}
                onClick={startBuyNow}
              >
                {checkingOut ? "Starting checkout..." : "Buy now"}
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-600 dark:text-mid-400">
              Buying redirects you to Khalti for payment.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ProductDetails;
