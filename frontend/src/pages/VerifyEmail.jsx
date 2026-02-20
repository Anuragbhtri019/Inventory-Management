import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Input from "../components/Input";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const OTP_EXPIRES_MS = 2 * 60 * 1000;
const OTP_LENGTH = 6;

const pad2 = (n) => String(Math.max(0, n)).padStart(2, "0");

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
};

const issuedAtKeyForEmail = (email) =>
  `verifyEmail.otpIssuedAt.v1:${String(email || "")
    .trim()
    .toLowerCase()}`;

const VerifyEmail = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const intervalRef = useRef(null);
  const issuedAtRef = useRef(0);
  const otpInputRefs = useRef([]);

  const initialEmail = useMemo(() => {
    const email = searchParams.get("email");
    return email ? email.trim() : "";
  }, [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [remainingMs, setRemainingMs] = useState(OTP_EXPIRES_MS);
  const [expired, setExpired] = useState(false);

  const otp = useMemo(() => otpDigits.join(""), [otpDigits]);

  const issuedKey = useMemo(() => issuedAtKeyForEmail(email), [email]);

  const setIssuedNow = useCallback(() => {
    const ts = Date.now();
    try {
      sessionStorage.setItem(issuedKey, String(ts));
    } catch {
      // ignore
    }
    return ts;
  }, [issuedKey]);

  const getIssuedAt = useCallback(() => {
    try {
      const raw = Number(sessionStorage.getItem(issuedKey));
      if (Number.isFinite(raw) && raw > 0) return raw;
    } catch {
      // ignore
    }
    return 0;
  }, [issuedKey]);

  const syncTimer = (issuedAt) => {
    const msLeft = OTP_EXPIRES_MS - (Date.now() - issuedAt);
    setRemainingMs(msLeft);
    setExpired(msLeft <= 0);
  };

  useEffect(() => {
    if (!email) return;

    const issuedAt = getIssuedAt() || setIssuedNow();
    issuedAtRef.current = issuedAt;
    syncTimer(issuedAtRef.current);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      syncTimer(issuedAtRef.current);
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // issuedKey changes when email changes
  }, [email, issuedKey, getIssuedAt, setIssuedNow]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (expired) {
      toast.error("Code expired. Please resend a new code.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setVerifying(true);

    try {
      await verifyOtp(email, otp);
      toast.success("Email verified. Welcome!");
      // navigation happens inside AuthContext
    } catch (err) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      issuedAtRef.current = setIssuedNow();
      setExpired(false);
      setRemainingMs(OTP_EXPIRES_MS);
      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      syncTimer(issuedAtRef.current);
      toast.success("OTP resent. Check your inbox.");
    } catch (err) {
      toast.error(err.message || "Resend failed");
    } finally {
      setResending(false);
    }
  };

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

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-brand-50 via-white to-sun-400/20 dark:from-deep-950 dark:via-deep-950 dark:to-black px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-10 h-72 w-72 rounded-full bg-brand-200/35 dark:bg-teal-800/18 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-sun-400/25 dark:bg-sun-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl justify-end pt-6">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-start lg:items-center py-10 lg:py-0">
        <div className="grid w-full gap-10 items-start lg:items-center lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative w-full max-w-none ml-auto lg:max-w-lg lg:justify-self-end min-h-[460px] sm:min-h-[520px] rounded-2xl border border-white/60 dark:border-deep-700/70 bg-white/90 dark:bg-deep-950/75 backdrop-blur-xl p-7 sm:p-9 shadow-glass-lg dark:shadow-glass-xl dark:ring-1 dark:ring-white/10">
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sun-400 to-sun-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🔐
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-ink-900 dark:text-accent-100">
                Verify your email
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-mid-300">
                Enter the 6-digit code sent to your inbox.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5 sm:space-y-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900 dark:text-mid-300">
                  Verification code
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
                      aria-label={`OTP digit ${idx + 1}`}
                      className={
                        "h-12 w-11 sm:w-12 rounded-lg border-2 bg-white dark:bg-deep-950 text-center text-lg font-bold text-slate-950 dark:text-accent-100 placeholder:text-slate-400 dark:placeholder:text-mid-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-deep-950 transition-all duration-200 " +
                        (expired
                          ? "border-red-200 focus:ring-red-300 focus:border-red-300 dark:border-deep-700"
                          : "border-slate-200/70 dark:border-deep-700 focus:ring-brand-400 focus:border-brand-400 hover:border-slate-300 dark:hover:border-deep-600")
                      }
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-mid-300">
                    Code expires in
                  </p>
                  <div
                    className={
                      "px-4 py-2 rounded-lg border text-base sm:text-lg font-mono font-bold tabular-nums " +
                      (expired
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-deep-700 dark:bg-deep-950/35 dark:text-accent-100"
                        : "border-slate-200/70 bg-white/70 text-slate-900 dark:border-deep-700/70 dark:bg-deep-950/40 dark:text-accent-100")
                    }
                    aria-label="OTP expiry countdown"
                  >
                    {formatCountdown(remainingMs)}
                  </div>
                </div>
              </div>

              {expired ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-deep-700 dark:bg-deep-950/35 dark:text-accent-100">
                  Code expired. Please resend a new code.
                </div>
              ) : null}

              {verifying ? (
                <div className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md flex items-center justify-center gap-2 opacity-80">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </div>
              ) : (
                <input
                  type="submit"
                  value="Verify email"
                  style={{ display: "block" }}
                  disabled={expired}
                  className="w-full h-12 rounded-lg bg-brand-600 px-4 sm:text-sm md:text-base lg:text-[16px] font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-deep-950"
                />
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={verifying || resending || !email}
                className="w-full rounded-lg border-2 border-brand-300 bg-brand-50 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-brand-100 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-deep-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-deep-700 dark:bg-deep-950/35 dark:text-accent-100 dark:hover:bg-deep-900/45"
              >
                {resending ? "Resending..." : "Resend code"}
              </button>

              <p className="text-center text-sm text-slate-600 dark:text-mid-300">
                Back to{" "}
                <Link
                  to="/login"
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          <div className="hidden lg:flex flex-col justify-center gap-6">
            <p className="text-xs uppercase tracking-[0.25em] text-sun-600 dark:text-sun-400 font-bold">
              ✅ One more step
            </p>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-ink-900 dark:text-accent-100 leading-tight">
              Confirm it’s really you.
            </h1>
            <p className="text-base text-slate-600 dark:text-mid-300 leading-relaxed">
              Verifying your email helps secure your account and enables login.
            </p>
            <div className="flex flex-col gap-4 text-sm">
              <div className="rounded-xl border border-brand-200/70 dark:border-deep-700 bg-brand-50/80 dark:bg-deep-950/35 px-4 py-3 font-medium text-brand-900 dark:text-accent-100">
                🕒 Codes expire in 2 minutes.
              </div>
              <div className="rounded-xl border border-sun-200/70 dark:border-deep-700 bg-sun-50/80 dark:bg-deep-950/35 px-4 py-3 font-medium text-sun-900 dark:text-accent-100">
                📩 Didn’t get it? Use “Resend code”.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
