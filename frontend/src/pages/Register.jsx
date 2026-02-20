import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import Input from "../components/Input";
import ThemeToggle from "../components/ThemeToggle";

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const verifyEmailIssuedAtKeyForEmail = (email) =>
  `verifyEmail.otpIssuedAt.v1:${String(email || "")
    .trim()
    .toLowerCase()}`;

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordAlert = (value) => {
    if (!/[A-Z]/.test(value))
      return "Password must include at least 1 capital letter.";
    if (!/\d/.test(value)) return "Password must include at least 1 number.";
    if (!/[^A-Za-z0-9]/.test(value))
      return "Password must include at least 1 special character.";
    if (!PASSWORD_COMPLEXITY_REGEX.test(value))
      return "Password must include at least 1 capital letter, 1 number, and 1 special character.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordAlert("");

    const alert = getPasswordAlert(password);
    if (alert) {
      setPasswordAlert(alert);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordAlert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await register(name, email, password);
      toast.success("OTP sent. Please check your email.");
      const registered = (data?.email || email || "").trim();

      try {
        sessionStorage.setItem(
          verifyEmailIssuedAtKeyForEmail(registered),
          String(Date.now()),
        );
      } catch {
        // ignore
      }

      navigate(`/verify-email?email=${encodeURIComponent(registered)}`);
    } catch (err) {
      const errorMsg = err.message || "Registration failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-brand-50 via-white to-sun-400/20 dark:from-deep-950 dark:via-deep-950 dark:to-black px-4 sm:px-6 lg:px-8 text-slate-950 dark:text-accent-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-10 h-72 w-72 rounded-full bg-brand-200/35 dark:bg-teal-800/18 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sun-400/25 dark:bg-sun-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl justify-end pt-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-start lg:items-center py-10 lg:py-0">
        <div className="grid w-full gap-10 items-start lg:items-center lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Registration Form */}
          <div className="relative w-full max-w-none ml-auto lg:max-w-lg lg:justify-self-end min-h-[460px] sm:min-h-[520px] rounded-2xl border border-slate-200/70 dark:border-deep-700 bg-white dark:bg-deep-950 backdrop-blur-xl p-7 sm:p-9 shadow-glass-lg dark:shadow-glass-xl dark:ring-1 dark:ring-white/10 text-slate-950 dark:text-accent-100">
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sun-400 to-sun-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                ✨
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 dark:text-accent-100">
                Create account
              </h2>
              <p className="mt-3 text-sm text-slate-700 dark:text-mid-300">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-brand-700 hover:text-brand-800 dark:text-sun-400 dark:hover:text-sun-300 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <Input
                label="Full name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              {passwordAlert && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-deep-700 dark:bg-deep-950/35 dark:text-red-200">
                  {passwordAlert}
                </div>
              )}

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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordAlert) setPasswordAlert("");
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
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

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-900 dark:text-mid-300 flex items-center gap-1"
                >
                  Confirm password{" "}
                  <span className="text-red-500 text-lg">*</span>
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordAlert) setPasswordAlert("");
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className={
                      "w-full px-4 pr-14 py-3 rounded-lg border-2 bg-white dark:bg-deep-950 font-medium text-slate-950 dark:text-accent-100 placeholder:text-slate-400 dark:placeholder:text-mid-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-deep-950 transition-all duration-200 " +
                      (passwordAlert === "Passwords do not match"
                        ? "border-red-500 focus:ring-red-500 focus:border-red-600"
                        : "border-slate-200/70 dark:border-deep-700 focus:ring-brand-400 focus:border-brand-400 hover:border-slate-300 dark:hover:border-deep-600")
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-mid-400 dark:hover:text-accent-100"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? "⊘" : "👁"}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md flex items-center justify-center gap-2 opacity-80">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Account...
                </div>
              ) : (
                <input
                  type="submit"
                  value="Create account"
                  style={{ display: "block" }}
                  className="w-full h-12 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-deep-950"
                />
              )}

              <div className="text-center text-xs text-slate-600 dark:text-mid-400 pt-2 mt-8">
                By signing up, you agree to our terms and conditions
              </div>
            </form>
          </div>

          {/* Right Column: Marketing */}
          <div className="hidden lg:flex flex-col justify-center gap-6">
            <p className="text-xs uppercase tracking-[0.25em] text-sun-600 dark:text-sun-400 font-bold">
              🚀 Get Started
            </p>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-ink-900 dark:text-accent-100 leading-tight">
              Build a cleaner inventory flow.
            </h1>
            <p className="text-base text-slate-600 dark:text-mid-300 leading-relaxed">
              Add products, track quantities, and review totals from a single
              dashboard. Manage everything with ease.
            </p>
            <div className="flex flex-col gap-4 text-sm">
              <div className="rounded-xl border border-brand-200/70 dark:border-deep-700 bg-brand-50/80 dark:bg-deep-950/35 px-4 py-3 font-medium text-brand-900 dark:text-accent-100">
                ⚡ Fast setup with just email and password.
              </div>
              <div className="rounded-xl border border-sun-200/70 dark:border-deep-700 bg-sun-50/80 dark:bg-deep-950/35 px-4 py-3 font-medium text-sun-900 dark:text-accent-100">
                📊 Keep a clear overview of SKUs and stock levels.
              </div>
              <div className="rounded-xl border border-slate-200/70 dark:border-deep-700 bg-slate-50/80 dark:bg-deep-950/35 px-4 py-3 font-medium text-slate-900 dark:text-accent-100">
                💡 See totals at a glance while you work.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
