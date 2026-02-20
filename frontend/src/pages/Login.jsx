import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import Input from "../components/Input";
import ThemeToggle from "../components/ThemeToggle";

const Login = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      toast.success("Welcome back , Login Successful!");
    } catch (err) {
      const errorMsg =
        err.message || "Failed to login. Please check your credentials.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-brand-50 via-white to-sun-400/20 dark:from-deep-950 dark:via-deep-950 dark:to-black px-4 sm:px-6 lg:px-8 text-slate-950 dark:text-accent-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-brand-200/35 dark:bg-teal-800/18 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sun-400/25 dark:bg-sun-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-end pt-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-start lg:items-center py-10 lg:py-0">
        <div className="grid w-full gap-10 lg:gap-16  items-start lg:items-center lg:grid-cols-2">
          {/* Left Column: Marketing */}
          <div className="hidden lg:flex flex-col ml-16 justify-center gap-6">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-600 dark:text-sun-400 font-bold">
              📦 Inventory Manager
            </p>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-950 dark:text-accent-100 leading-tight">
              Stay on top of every unit, every day.
            </h1>
            <p className="text-base text-slate-700 dark:text-mid-300 leading-relaxed">
              Track stock levels, pricing, and product notes from a single
              workspace built for clarity.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-mid-300">
              <span className="rounded-full border border-slate-200/70 dark:border-deep-700 bg-white/60 dark:bg-deep-950/35 px-4 py-2 font-medium text-slate-700 dark:text-mid-300">
                ✨ Real-time tracking
              </span>
              <span className="rounded-full border border-slate-200/70 dark:border-deep-700 bg-white/60 dark:bg-deep-950/35 px-4 py-2 font-medium text-slate-700 dark:text-mid-300">
                ⚡ Fast workflows
              </span>
              <span className="rounded-full border border-slate-200/70 dark:border-deep-700 bg-white/60 dark:bg-deep-950/35 px-4 py-2 font-medium text-slate-700 dark:text-mid-300">
                📊 Live summaries
              </span>
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="flex w-full justify-center lg:justify-end">
            <div className="relative w-full sm:max-w-md lg:max-w-md rounded-2xl border border-slate-200/70 dark:border-deep-700 bg-white dark:bg-deep-950 backdrop-blur-xl p-7 sm:p-9 shadow-glass-lg dark:shadow-glass-xl dark:ring-1 dark:ring-white/10 text-slate-950 dark:text-accent-100">
              <div className="text-center mb-8">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  📦
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 dark:text-accent-100">
                  Sign in
                </h2>
                <p className="mt-3 text-sm text-slate-800 dark:text-mid-300">
                  New here?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-brand-700 hover:text-brand-800 dark:text-sun-400 dark:hover:text-sun-300 hover:underline transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>

              <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-900 dark:text-mid-300 flex items-center gap-1"
                  >
                    Password <span className="text-red-500 text-lg">*</span>
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full px-4 pr-14 py-3 rounded-lg border-2 bg-white dark:bg-deep-950 font-medium text-slate-950 dark:text-accent-100 placeholder:text-slate-400 dark:placeholder:text-mid-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-deep-950 transition-all duration-200 border-slate-200/70 dark:border-deep-700 focus:ring-brand-400 focus:border-brand-400 hover:border-slate-300 dark:hover:border-deep-600"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-mid-400 dark:hover:text-accent-100"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "⊘" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-mid-300 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-deep-700 bg-white dark:bg-deep-950/40 text-brand-600 focus:ring-brand-400"
                    />
                    Remember me
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-slate-700 dark:text-mid-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {loading ? (
                  <div className="w-full h-12 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-md flex items-center justify-center gap-2 opacity-80">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  <input
                    type="submit"
                    value="Login"
                    style={{ display: "block" }}
                    className="w-full h-12 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-deep-950"
                  />
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
