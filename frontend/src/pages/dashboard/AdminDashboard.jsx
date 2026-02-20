import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AppLayout from "../../layouts/AppLayout";
import Button from "../../components/Button";
import ProductForm from "../../components/ProductForm";
import api from "../../services/api";

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockCount = products.filter(
      (p) => Number(p.quantity) > 0 && Number(p.quantity) < 10,
    ).length;
    const outOfStockCount = products.filter((p) => Number(p.quantity) <= 0)
      .length;
    return { totalProducts, lowStockCount, outOfStockCount };
  }, [products]);

  const handleAddSubmit = async (productData) => {
    try {
      const { data } = await api.post("/products", productData);
      setProducts((prev) => [data.data, ...prev]);
      setIsAddOpen(false);
      toast.success("Product added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleEditSubmit = async (productData) => {
    if (!editingProduct?._id) return;
    try {
      const { data } = await api.put(
        `/products/${editingProduct._id}`,
        productData,
      );
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? data.data : p)),
      );
      setEditingProduct(null);
      toast.success("Product updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const closeAddModal = () => setIsAddOpen(false);
  const closeEditModal = () => setEditingProduct(null);

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            Manage products and inventory.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          ➕ Add Product
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/35 backdrop-blur-xl p-4 shadow-glass">
          <p className="text-sm font-medium text-slate-700 dark:text-mid-300">
            Products
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-accent-100 mt-1">
            {stats.totalProducts}
          </p>
        </div>
        <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/35 backdrop-blur-xl p-4 shadow-glass">
          <p className="text-sm font-medium text-slate-700 dark:text-mid-300">
            Low stock (&lt; 10)
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-accent-100 mt-1">
            {stats.lowStockCount}
          </p>
        </div>
        <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/35 backdrop-blur-xl p-4 shadow-glass">
          <p className="text-sm font-medium text-slate-700 dark:text-mid-300">
            Out of stock
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-accent-100 mt-1">
            {stats.outOfStockCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-sun-400 to-brand-400" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-accent-100 mb-1">
                📦 Products
              </h2>
              <p className="text-sm text-slate-700 dark:text-mid-300">
                {products.length} item{products.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600" />
              <p className="text-slate-700 dark:text-mid-300 mt-4">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-slate-700 dark:text-mid-300 font-medium">
                No products yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/25 backdrop-blur-xl p-4"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-accent-100 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                        {product.category ? product.category : "Uncategorized"}{" "}
                        • {Number(product.quantity)} in stock •{" "}
                        {Number(product.price).toFixed(2)} NPR
                      </p>
                      {Number(product.quantity) > 0 &&
                        Number(product.quantity) < 10 && (
                          <p className="text-xs mt-1 font-bold text-sun-600 dark:text-sun-400">
                            Low stock warning
                          </p>
                        )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0 sm:justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close add modal"
            onClick={closeAddModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/30 dark:border-deep-700/70 bg-white dark:bg-deep-950 shadow-glass-lg"
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200/70 dark:border-deep-700">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-accent-100">
                  ➕ Add Product
                </h2>
                <p className="text-sm text-slate-700 dark:text-mid-300 mt-1">
                  Create a new inventory item
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={closeAddModal}>
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <ProductForm
                onSubmit={handleAddSubmit}
                initialData={{}}
                buttonText="Add Product"
              />
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close edit modal"
            onClick={closeEditModal}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/30 dark:border-deep-700/70 bg-white dark:bg-deep-950 shadow-glass-lg"
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200/70 dark:border-deep-700">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-accent-100">
                  ✏️ Edit Product
                </h2>
                <p className="text-sm text-slate-700 dark:text-mid-300 mt-1">
                  Update product details and save changes
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={closeEditModal}>
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <ProductForm
                onSubmit={handleEditSubmit}
                initialData={editingProduct}
                buttonText="Save Changes"
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminDashboard;
