import { useEffect, useMemo, useRef, useState } from "react";
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

const History = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [view, setView] = useState("completed");
  const reconcileOnceRef = useRef(false);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payment/mine");
      setPayments(data.data || []);

      if (!reconcileOnceRef.current) {
        reconcileOnceRef.current = true;
        const pidx = sessionStorage.getItem("lastPaymentPidx") || "";
        if (pidx) {
          try {
            const verifyRes = await api.post("/payment/verify", { pidx });
            const payload = verifyRes.data?.data || verifyRes.data;
            const s = String(payload?.status || "")
              .trim()
              .toLowerCase();

            if (s && s !== "completed" && s !== "pending") {
              try {
                await api.post("/payment/cancel", {
                  pidx,
                  reason: `history_reconcile:${s}`,
                });
              } catch {
              }
              sessionStorage.removeItem("lastPaymentPidx");
              sessionStorage.removeItem("lastPaymentStartedAt");
            } else if (s === "completed") {
              sessionStorage.removeItem("lastPaymentPidx");
              sessionStorage.removeItem("lastPaymentStartedAt");
            }

            const refreshed = await api.get("/payment/mine");
            setPayments(refreshed.data?.data || []);
          } catch {
          }
        }
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load purchase history",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const rows = useMemo(() => {
    return [...(payments || [])].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [payments]);

  const completedRows = useMemo(
    () =>
      rows.filter(
        (p) =>
          String(p.status || "")
            .trim()
            .toLowerCase() === "completed",
      ),
    [rows],
  );

  const cancelledRows = useMemo(() => {
    return rows.filter((p) => {
      const s = String(p.status || "")
        .trim()
        .toLowerCase();
      if (!s) return false;
      if (s === "completed") return false;
      if (s === "initiated") return false;
      return true;
    });
  }, [rows]);

  const visibleRows = view === "cancelled" ? cancelledRows : completedRows;

  const getTitle = (p) => {
    const items = Array.isArray(p?.meta?.items) ? p.meta.items : [];
    const names = items
      .map((i) => String(i?.productName || "").trim())
      .filter(Boolean);
    if (!names.length) return p.orderName || "Order";
    return `${names[0]}${names.length > 1 ? ` +${names.length - 1} more` : ""}`;
  };

  const downloadReceipt = async (pidx) => {
    if (!pidx) return;
    setDownloading(pidx);
    try {
      const response = await api.get(`/payment/receipt/${pidx}`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers?.["content-disposition"];
      const pickFilename = (value) => {
        const header = String(value || "");
        if (!header) return "";

        const star = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (star?.[1]) {
          try {
            return decodeURIComponent(star[1]).replace(/^"|"$/g, "");
          } catch {
            return star[1].replace(/^"|"$/g, "");
          }
        }

        const simple = header.match(/filename\s*=\s*"?([^";]+)"?/i);
        return (simple?.[1] || "").trim();
      };

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pickFilename(contentDisposition) || `receipt-${pidx}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(msg || "Failed to download receipt");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Purchase history
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            Completed purchases and cancelled/failed payments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "completed" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("completed")}
          >
            Completed ({completedRows.length})
          </Button>
          <Button
            variant={view === "cancelled" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("cancelled")}
          >
            Cancelled ({cancelledRows.length})
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMine}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-400 to-sun-400" />
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-700 dark:text-mid-300">
              Loading history...
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-12 text-center text-slate-700 dark:text-mid-300">
              {view === "cancelled"
                ? "No cancelled payments."
                : "No completed purchases yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRows.map((p) => {
                const created = p.createdAt ? new Date(p.createdAt) : null;
                const isCompleted =
                  String(p.status || "")
                    .trim()
                    .toLowerCase() === "completed";
                return (
                  <div
                    key={p._id}
                    className="rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/25 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="font-semibold text-slate-900 dark:text-accent-100">
                            {getTitle(p)}
                          </p>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-deep-900/70 dark:text-accent-100">
                            {p.status || "Unknown"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                          {created ? created.toLocaleString() : ""}
                        </p>

                        <p className="text-xs text-slate-600 dark:text-mid-400 mt-2 break-all">
                          Transaction ID:{" "}
                          <span className="font-mono">{p.pidx || "-"}</span>
                        </p>

                        <p className="text-sm font-semibold text-slate-900 dark:text-accent-100 mt-2">
                          NPR {formatNpr(p.amount)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            !isCompleted || !p.pidx || downloading === p.pidx
                          }
                          onClick={() => downloadReceipt(p.pidx)}
                        >
                          {downloading === p.pidx
                            ? "Downloading..."
                            : "Download receipt"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default History;
