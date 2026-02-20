import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import { useCart } from "../contexts/CartContext";

const getPrimaryImage = (p) =>
  (Array.isArray(p.images) && p.images[0]) || p.imageUrl || "";

const isLowStock = (p) => Number(p.quantity) > 0 && Number(p.quantity) < 10;

const Products = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [category, setCategory] = useState("all");
  const [qtyById, setQtyById] = useState({});

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

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const c = String(p.category || "").trim();
      if (c) set.add(c);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...products];

    if (category !== "all") {
      list = list.filter(
        (p) =>
          String(p.category || "")
            .trim()
            .toLowerCase() === category.toLowerCase(),
      );
    }

    if (q) {
      list = list.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const desc = String(p.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    const sorters = {
      name: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      price: (a, b) => Number(a.price) - Number(b.price),
      quantity: (a, b) => Number(a.quantity) - Number(b.quantity),
      date: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    };
    list.sort(sorters[sort] || sorters.date);
    return list;
  }, [products, search, sort, category]);

  const getQty = (p) => {
    const n = Math.floor(Number(qtyById[p._id] ?? 1));
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.min(n, Number(p.quantity) || 1);
  };

  const handleAddToCart = (p) => {
    if (Number(p.quantity) <= 0) {
      toast.error("Out of stock");
      return;
    }
    const qty = getQty(p);
    addItem(p._id, qty);
    toast.success("Added to cart");
  };

  const toggleFavourite = async (p) => {
    try {
      const { data } = await api.patch(`/products/${p._id}/favourite`);
      const updated = data.data;
      setProducts((prev) => prev.map((x) => (x._id === p._id ? updated : x)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update favourite");
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Products
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            Browse items, add to cart, and checkout.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description"
          />
          <div className="flex gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-mid-300">
                Category
              </label>
              <select
                className="mt-2 w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-deep-950 font-medium text-slate-900 dark:text-accent-100 border-slate-200/70 dark:border-deep-700/70"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All" : c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-mid-300">
                Sort
              </label>
              <select
                className="mt-2 w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-deep-950 font-medium text-slate-900 dark:text-accent-100 border-slate-200/70 dark:border-deep-700/70"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="date">Date added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-slate-700 dark:text-mid-300 mt-4">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-slate-700 dark:text-mid-300 font-medium">
            No products found
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const img = getPrimaryImage(p);
            return (
              <div
                key={p._id}
                className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden cursor-pointer"
                role="link"
                tabIndex={0}
                onClick={() => openDetails(p._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetails(p._id);
                  }
                }}
              >
                <div className="relative">
                  {img ? (
                    <img
                      src={img}
                      alt={p.name}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-44 w-full bg-slate-100 dark:bg-deep-900/30 flex items-center justify-center text-5xl">
                      🖼️
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavourite(p);
                    }}
                    className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/80 dark:bg-deep-950/60 border border-white/50 dark:border-deep-700/70 backdrop-blur-xl flex items-center justify-center"
                    aria-label="Toggle favourite"
                    title="Favourite"
                  >
                    {p.isFavourite ? "❤️" : "🤍"}
                  </button>

                  {isLowStock(p) && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-sun-500 text-white text-xs font-bold">
                      Low stock
                    </div>
                  )}
                  {Number(p.quantity) <= 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                      Out of stock
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-slate-900 dark:text-accent-100">
                      {p.name}
                    </div>
                    <div className="text-sm font-bold text-sun-600 dark:text-sun-400">
                      {Number(p.price).toFixed(2)} NPR
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-mid-400 font-medium flex gap-4">
                    <span>{p.category ? p.category : "Uncategorized"}</span>
                    <span>{Number(p.quantity)} in stock</span>
                  </div>

                  {p.description && (
                    <p className="text-sm text-slate-700 dark:text-mid-300 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div
                    className="flex items-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-24" onClick={(e) => e.stopPropagation()}>
                      <Input
                        label="Qty"
                        name={`qty-${p._id}`}
                        type="number"
                        min="1"
                        max={p.quantity}
                        value={qtyById[p._id] ?? 1}
                        onChange={(e) =>
                          setQtyById((prev) => ({
                            ...prev,
                            [p._id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      variant="primary"
                      className="flex-1"
                      disabled={Number(p.quantity) <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(p);
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetails(p._id);
                    }}
                    className="block text-left text-xs font-semibold text-slate-700 dark:text-mid-300 hover:underline"
                  >
                    View details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Products;
