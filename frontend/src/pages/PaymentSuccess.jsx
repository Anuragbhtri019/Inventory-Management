import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";
import { useNotifications } from "../contexts/NotificationContext";

const PAYMENT_CANCELLED_TOAST_ID = "payment_cancelled";

const toDisplayMessage = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const maybeMsg = value.message || value.error || value.detail;
    if (typeof maybeMsg === "string") return maybeMsg;
    const maybeStatus = value.status;
    if (typeof maybeStatus === "string") return maybeStatus;
    return "";
  }
  return String(value);
};

const computePaymentReference = (searchKey) => {
  const params = new URLSearchParams(String(searchKey || ""));
  const pidxFromParams = params.get("pidx");
  if (pidxFromParams) return pidxFromParams;

  const storedPidx = sessionStorage.getItem("lastPaymentPidx") || "";
  const startedAtRaw = Number(sessionStorage.getItem("lastPaymentStartedAt"));
  const startedAt = Number.isFinite(startedAtRaw) ? startedAtRaw : 0;
  const withinWindow = startedAt
    ? Date.now() - startedAt < 6 * 60 * 60 * 1000
    : false;
  return withinWindow ? storedPidx : "";
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const { addActivity } = useNotifications();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Checking payment status...");
  const [icon, setIcon] = useState("⏳");
  const reference = useMemo(
    () => computePaymentReference(searchKey),
    [searchKey],
  );

  const params = useMemo(() => new URLSearchParams(searchKey), [searchKey]);
  const statusParam = useMemo(() => {
    return String(
      params.get("status") ||
        params.get("payment_status") ||
        params.get("action") ||
        "",
    )
      .trim()
      .toLowerCase();
  }, [params]);

  const looksCancelledFromParams = useMemo(() => {
    return (
      Boolean(statusParam) &&
      (statusParam.includes("cancel") ||
        statusParam.includes("fail") ||
        statusParam.includes("expire"))
    );
  }, [statusParam]);

  const isMissingReference = !reference;
  const effectiveStatus = isMissingReference ? "missing" : status;
  const effectiveMessage = isMissingReference
    ? "No payment reference found. Please try again."
    : message;
  const effectiveIcon = isMissingReference ? "❌" : icon;

  const redirectTimerRef = useRef(null);

  const retryTo = sessionStorage.getItem("paymentRetryTo") || "/products";

  useEffect(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    const scheduleRedirectHome = (ms) => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, ms);
    };

    const pidx = reference;

    if (!pidx) {
      toast.error("Missing payment reference", {
        toastId: "payment_missing_reference",
      });
      if (looksCancelledFromParams) {
        toast.error("Payment cancelled", {
          toastId: PAYMENT_CANCELLED_TOAST_ID,
        });
        addActivity({
          type: "error",
          message: "Purchase cancelled",
          dedupeKey: "payment:cancelled:missing_reference",
        });
      }
      scheduleRedirectHome(900);
      return () => {
        if (redirectTimerRef.current) {
          clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = null;
        }
      };
    }

    const verifyPayment = async () => {
      try {
        // Reset UI state for this verification run.
        setStatus("verifying");
        setMessage("Checking payment status...");
        setIcon("⏳");

        if (looksCancelledFromParams) {
          try {
            await api.post("/payment/cancel", {
              pidx,
              reason: statusParam,
            });
          } catch {
            // Best-effort: even if this fails, verification may still update status.
          }
        }

        const response = await api.post("/payment/verify", { pidx });
        const payload = response.data?.data || response.data;
        const paymentStatus = payload?.status || "Unknown";
        const paymentStatusNorm = String(paymentStatus).trim().toLowerCase();

        if (paymentStatus === "Completed") {
          try {
            await api.post("/payment/confirm", { pidx });
          } catch (confirmErr) {
            const confirmMsg =
              confirmErr.response?.data?.message || confirmErr.message;
            toast.warning(
              confirmMsg ||
                "Payment verified, but purchase confirmation failed",
            );
          }
          sessionStorage.removeItem("lastPaymentPidx");
          sessionStorage.removeItem("lastPaymentStartedAt");
          setStatus("success");
          setMessage("Payment confirmed successfully!");
          setIcon("✅");
          // toastId makes this idempotent even if this effect re-runs.
          toast.success("Payment verified!", {
            toastId: `payment_verified:${pidx}`,
          });
          addActivity({
            type: "success",
            message: "Purchase completed",
            dedupeKey: `payment:${pidx}:completed`,
          });
        } else if (paymentStatus === "Pending") {
          setStatus("pending");
          setMessage("Payment is still processing. Please wait...");
          setIcon("⏳");
          toast.info("Payment is still processing", {
            toastId: `payment_pending:${pidx}`,
          });
        } else {
          try {
            await api.post("/payment/cancel", {
              pidx,
              reason: looksCancelledFromParams
                ? statusParam
                : `not_completed:${String(paymentStatus || "unknown")}`,
            });
          } catch {
            // Best-effort only
          }

          sessionStorage.removeItem("lastPaymentPidx");
          sessionStorage.removeItem("lastPaymentStartedAt");
          setStatus("failed");
          const isCancelled =
            looksCancelledFromParams ||
            paymentStatusNorm.includes("cancel") ||
            paymentStatusNorm.includes("fail") ||
            paymentStatusNorm.includes("expire");
          setMessage(
            isCancelled
              ? "Payment was cancelled. Redirecting to home..."
              : "Payment was not completed. Redirecting to home...",
          );
          setIcon("⚠️");
          if (isCancelled) {
            toast.error("Payment cancelled", {
              toastId: PAYMENT_CANCELLED_TOAST_ID,
            });
            addActivity({
              type: "error",
              message: "Purchase cancelled",
              dedupeKey: `payment:${pidx}:cancelled`,
            });
          } else {
            toast.error("Payment not completed", {
              toastId: `payment_not_completed:${pidx}`,
            });
            addActivity({
              type: "error",
              message: "Purchase failed",
              dedupeKey: `payment:${pidx}:failed:${paymentStatusNorm || "unknown"}`,
            });
          }
          scheduleRedirectHome(2500);
        }
      } catch (err) {
        // If verify fails, still persist the attempt so it shows up in Cancelled history.
        try {
          await api.post("/payment/cancel", {
            pidx,
            reason: looksCancelledFromParams
              ? statusParam
              : "verify_failed_or_inaccessible",
          });
        } catch {
          // best-effort
        }
        sessionStorage.removeItem("lastPaymentPidx");
        sessionStorage.removeItem("lastPaymentStartedAt");
        setStatus("failed");
        const errorMsg =
          toDisplayMessage(err.response?.data?.message) ||
          toDisplayMessage(err.response?.data) ||
          toDisplayMessage(err.message);
        if (looksCancelledFromParams) {
          setMessage("Payment was cancelled. Redirecting to home...");
          setIcon("⚠️");
          toast.error("Payment cancelled", {
            toastId: PAYMENT_CANCELLED_TOAST_ID,
          });
          addActivity({
            type: "error",
            message: "Purchase cancelled",
            dedupeKey: `payment:${pidx}:cancelled`,
          });
        } else {
          setMessage(
            (errorMsg || "Failed to verify payment") +
              " (redirecting to home...)",
          );
          setIcon("❌");
          toast.error(errorMsg || "Payment verification failed", {
            toastId: `payment_verify_failed:${pidx}`,
          });
          addActivity({
            type: "error",
            message: "Purchase failed",
            dedupeKey: `payment:${pidx}:failed:verify`,
          });
        }
        scheduleRedirectHome(2500);
      }
    };

    verifyPayment();
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [reference, navigate, addActivity, looksCancelledFromParams, statusParam]);

  const handleDownloadReceipt = async () => {
    const pidx = searchParams.get("pidx");
    if (!pidx) {
      toast.error("Missing payment reference");
      return;
    }

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
    }
  };

  const statusConfig = {
    verifying: {
      title: "Verifying Payment",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      badgeColor:
        "bg-blue-100 text-blue-700 dark:bg-deep-900/50 dark:text-accent-100 dark:border dark:border-deep-700",
    },
    success: {
      title: "Payment Successful",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      badgeColor:
        "bg-green-100 text-green-700 dark:bg-deep-900/50 dark:text-accent-100 dark:border dark:border-deep-700",
    },
    pending: {
      title: "Payment Pending",
      bgColor: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      badgeColor:
        "bg-yellow-100 text-yellow-700 dark:bg-deep-900/50 dark:text-accent-100 dark:border dark:border-deep-700",
    },
    failed: {
      title: "Payment Failed",
      bgColor: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      badgeColor:
        "bg-red-100 text-red-700 dark:bg-deep-900/50 dark:text-accent-100 dark:border dark:border-deep-700",
    },
    missing: {
      title: "Invalid Request",
      bgColor: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      badgeColor:
        "bg-red-100 text-red-700 dark:bg-deep-900/50 dark:text-accent-100 dark:border dark:border-deep-700",
    },
  };

  const config = statusConfig[effectiveStatus] || statusConfig.verifying;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-400/20 dark:from-deep-950 dark:via-deep-950 dark:to-black px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-brand-200/40 dark:bg-teal-800/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sun-400/30 dark:bg-sun-600/12 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl justify-end pt-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <div className="w-full rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/85 dark:bg-deep-950/55 shadow-glass-lg dark:shadow-glass-xl backdrop-blur-xl overflow-hidden">
          {/* Status Bar */}
          <div
            className={`h-1 bg-gradient-to-r ${
              status === "success"
                ? "from-green-400 to-green-600"
                : status === "failed" || status === "missing"
                  ? "from-red-400 to-red-600"
                  : "from-blue-400 to-blue-600"
            }`}
          />

          {/* Content */}
          <div className="p-8 sm:p-12 text-center">
            {/* Icon */}
            <div className="text-6xl mb-6 animate-bounce">{effectiveIcon}</div>

            {/* Status Badge */}
            <div
              className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${config.badgeColor} mb-6`}
            >
              {config.title}
            </div>

            {/* Main Message */}
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink-900 mb-3">
              {config.title}
            </h1>

            <p className="text-base text-slate-700 dark:text-mid-300 mb-8 leading-relaxed max-w-md mx-auto">
              {effectiveMessage}
            </p>

            <div className="bg-slate-50/80 dark:bg-deep-900/35 rounded-lg p-4 mb-8 border border-slate-200/70 dark:border-deep-700/70">
              <p className="text-xs text-slate-600 dark:text-mid-400 font-medium mb-2">
                PAYMENT REFERENCE
              </p>
              <p className="font-mono text-sm text-slate-900 dark:text-accent-100 break-all">
                {reference || "N/A"}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 sm:flex sm:gap-3 sm:justify-center sm:space-y-0">
              <Link to="/dashboard" className="block">
                <Button variant="primary" className="w-full sm:w-auto">
                  🏠 Back to Dashboard
                </Button>
              </Link>
              {effectiveStatus === "success" && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleDownloadReceipt}
                >
                  ⬇️ Download receipt (PDF)
                </Button>
              )}
              {effectiveStatus !== "success" && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (redirectTimerRef.current) {
                      clearTimeout(redirectTimerRef.current);
                      redirectTimerRef.current = null;
                    }
                    navigate(retryTo);
                  }}
                >
                  ← Try Again
                </Button>
              )}
            </div>

            {/* Footer Note */}
            <p className="text-xs text-slate-600 dark:text-mid-400 mt-8">
              {effectiveStatus === "success"
                ? "Your payment has been successfully processed"
                : "If you have any questions, please contact support"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
