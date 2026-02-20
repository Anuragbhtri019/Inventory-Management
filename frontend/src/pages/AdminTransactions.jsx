import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import api from "../services/api";

const formatNpr = (amountPaisa) => {
  const npr = Number(amountPaisa || 0) / 100;
  return npr.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const AdminTransactions = () => {
  const PAGE_SIZE = 20;
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPayments = async (nextPage = page) => {
    setLoading(true);
    try {
      const { data } = await api.get("/payment/admin", {
        params: { limit: PAGE_SIZE, page: nextPage },
      });
      setPayments(data.data || []);
      setTotalPages(Number(data.totalPages) || 1);
      setTotal(Number(data.total) || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const rows = useMemo(() => {
    return (payments || []).map((p) => {
      const created = p.createdAt ? new Date(p.createdAt) : null;
      return {
        id: p._id,
        pidx: p.pidx,
        status: p.status,
        amount: p.amount,
        orderId: p.orderId,
        orderName: p.orderName,
        createdAt: created ? created.toLocaleString() : "",
        userName: p.user?.name || "",
        userEmail: p.user?.email || "",
      };
    });
  }, [payments]);

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Transactions
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            All payments made by users on the site.
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchPayments(page)}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-400 to-sun-400" />
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-700 dark:text-mid-300">
              Loading transactions...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-slate-700 dark:text-mid-300">
              No transactions found.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-700 dark:text-mid-300">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Transaction ID</th>
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Amount (NPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-200/70 dark:border-deep-700/70 text-slate-900 dark:text-accent-100"
                      >
                        <td className="py-3 pr-3 whitespace-nowrap text-slate-700 dark:text-mid-300">
                          {r.createdAt}
                        </td>
                        <td className="py-3 pr-3 font-mono text-xs whitespace-nowrap text-slate-700 dark:text-mid-300">
                          {r.pidx || "-"}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {r.userName || "-"}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-slate-700 dark:text-mid-300">
                          {r.userEmail || "-"}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold">
                            {r.orderName || "-"}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-mid-400">
                            {r.orderId || ""}
                          </div>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {r.status || "-"}
                        </td>
                        <td className="py-3 whitespace-nowrap text-right font-semibold">
                          {formatNpr(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-sm text-slate-700 dark:text-mid-300">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                  {total ? (
                    <span className="ml-2 text-slate-600 dark:text-mid-400">
                      ({total} total)
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={loading || page <= 1}
                    title="Previous"
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={loading || page >= totalPages}
                    title="Next"
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminTransactions;
