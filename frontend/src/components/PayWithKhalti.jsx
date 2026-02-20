import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import api from "../services/api";

const PayWithKhalti = ({ amount, onAmountChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setError("");
    setLoading(true);

    try {
      const orderId = `INV-${Date.now()}`;
      const response = await api.post("/payment/initiate", {
        amount: Math.round(Number(amount || 0) * 100),
        orderId,
        orderName: "Inventory Manager",
      });

      const payload = response.data?.data || response.data;
      if (!payload?.payment_url) {
        throw new Error("Payment URL missing from response");
      }

      if (payload?.pidx) {
        sessionStorage.setItem("lastPaymentPidx", String(payload.pidx));
        sessionStorage.setItem("lastPaymentStartedAt", String(Date.now()));
      }

      window.location.href = payload.payment_url;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || Number(amount) <= 0;

  return (
    <div className="space-y-4">
      <Input
        label="Amount (NPR)"
        type="number"
        min="1"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="Enter amount"
      />
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handlePayment}
        disabled={isDisabled}
      >
        {loading ? "Starting payment..." : "Pay with Khalti"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        You will be redirected to Khalti to complete the payment.
      </p>
    </div>
  );
};

export default PayWithKhalti;
