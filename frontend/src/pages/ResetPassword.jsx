import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button";
import Input from "../components/Input";
import ThemeToggle from "../components/ThemeToggle";
import api from "../services/api";

const OTP_LENGTH = 6;

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = useMemo(() => params.get("email") || "", [params]);
  const [otpDigits, setOtpDigits] = useState(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const otpInputRefs = useRef([]);
  const otp = useMemo(() => otpDigits.join(""), [otpDigits]);

  const [step, setStep] = useState("verify"); // 'verify' | 'setPassword'
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const focusOtpIndex = (idx) => {
    const el = otpInputRefs.current?.[idx];
    if (el) el.focus();
  };

  const handleOtpChange = (idx, value) => {
    const digits = String(value || "").replace(/\D/g, "");

    if (!digits) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[idx] = "";
        return next;
      });
      return;
    }

    const digit = digits[digits.length - 1];
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });

    if (idx < OTP_LENGTH - 1) focusOtpIndex(idx + 1);
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      focusOtpIndex(idx - 1);
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      focusOtpIndex(idx - 1);
    }
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      e.preventDefault();
      focusOtpIndex(idx + 1);
    }
  };

  const handleOtpPaste = (idx, e) => {
    const text = e.clipboardData?.getData("text") || "";
    const digits = text.replace(/\D/g, "");
    if (!digits) return;

    e.preventDefault();
    setOtpDigits((prev) => {
      const next = [...prev];
      let writeIndex = idx;
      for (const ch of digits) {
        if (writeIndex >= OTP_LENGTH) break;
        next[writeIndex] = ch;
        writeIndex += 1;
      }
      return next;
    });

    const nextFocus = Math.min(idx + digits.length, OTP_LENGTH - 1);
    focusOtpIndex(nextFocus);
  };

  const verifyCode = async (e) => {
    e.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      toast.success(data.message || "Code verified");
      setStep("setPassword");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid reset code");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      toast.success(data.message || "Password reset");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
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
            Reset password
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300 mt-2">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold">{email || "your email"}</span>.
          </p>

          {step === "verify" ? (
            <form className="mt-6 space-y-5" onSubmit={verifyCode}>
              <Input label="Email" type="email" value={email} disabled />

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900 dark:text-mid-300">
                  Reset Code
                </label>

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={(e) => handleOtpPaste(idx, e)}
                      onFocus={(e) => e.target.select()}
                      maxLength={1}
                      aria-label={`Reset code digit ${idx + 1}`}
                      className="h-12 w-11 sm:w-12 rounded-lg border-2 bg-white dark:bg-deep-950 text-center text-lg font-bold text-slate-950 dark:text-accent-100 placeholder:text-slate-400 dark:placeholder:text-mid-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-deep-950 transition-all duration-200 border-slate-200/70 dark:border-deep-700 focus:ring-brand-400 focus:border-brand-400 hover:border-slate-300 dark:hover:border-deep-600"
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify code"}
              </Button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <Input label="Email" type="email" value={email} disabled />

              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset password"}
              </Button>

              <button
                type="button"
                onClick={() => setStep("verify")}
                className="w-full text-sm font-semibold text-slate-700 dark:text-mid-300 hover:underline"
              >
                Back to code verification
              </button>
            </form>
          )}

          <div className="mt-6 text-sm flex justify-between">
            <Link
              to="/forgot-password"
              className="font-semibold text-slate-700 dark:text-mid-300 hover:underline"
            >
              Resend code
            </Link>
            <Link
              to="/login"
              className="font-semibold text-slate-700 dark:text-mid-300 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
