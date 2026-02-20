import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import api from "../services/api";

const primaryImage = (p) =>
  (Array.isArray(p.images) && p.images[0]) || p.imageUrl || "";

const Favourites = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const openDetails = (productId) => {
    sessionStorage.setItem("selectedProductId", productId);
    navigate("/product-details", { state: { productId } });
  };

  const fetchFav = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { favourite: true } });
      setProducts(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load favourites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFav();
  }, []);

  const toggleFavourite = async (p) => {
    try {
      await api.patch(`/products/${p._id}/favourite`);
      setProducts((prev) => prev.filter((x) => x._id !== p._id));
      toast.info("Removed from favourites");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update favourite");
    }
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Favourites
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            Your starred products.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-slate-700 dark:text-mid-300 mt-4">Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🤍</p>
          <p className="text-slate-700 dark:text-mid-300 font-medium">
            No favourites yet
          </p>
          <Link to="/products" className="inline-block mt-4">
            <Button variant="primary">Browse products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden"
            >
              {primaryImage(p) ? (
                <img
                  src={primaryImage(p)}
                  alt={p.name}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-44 w-full bg-slate-100 dark:bg-deep-900/30 flex items-center justify-center text-5xl">
                  🖼️
                </div>
              )}
              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => openDetails(p._id)}
                  className="text-left font-semibold text-slate-900 dark:text-accent-100 hover:underline"
                >
                  {p.name}
                </button>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-sun-600 dark:text-sun-400">
                    {Number(p.price).toFixed(2)} NPR
                  </span>
                  <Button variant="outline" size="sm" onClick={() => toggleFavourite(p)}>
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

export default Favourites;
