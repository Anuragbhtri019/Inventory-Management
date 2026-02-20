import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button";
import Input from "../components/Input";
import ThemeToggle from "../components/ThemeToggle";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const send = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/request-password-reset", { email });
      toast.success(data.message || "Reset code sent");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-400/20 dark:from-deep-950 dark:via-deep-950 dark:to-black px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-brand-200/40 dark:bg-teal-800/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sun-400/30 dark:bg-sun-600/12 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-xl justify-end pt-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-xl items-center">
        <div className="w-full rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/85 dark:bg-deep-950/55 shadow-glass-lg backdrop-blur-xl p-8">
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Forgot password
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300 mt-2">
            We’ll email you a 6-digit reset code.
          </p>

          <form className="mt-6 space-y-4" onSubmit={send}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset code"}
            </Button>
          </form>

          <div className="mt-6 text-sm">
            <Link to="/login" className="font-semibold text-slate-700 dark:text-mid-300 hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
