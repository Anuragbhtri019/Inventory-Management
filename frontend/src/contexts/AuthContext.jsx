import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotifications } from "./NotificationContext";

/**
 * AuthContext
 *
 * Holds the authenticated user state and exposes auth actions.
 *
 * Token handling:
 * - Tokens are stored in either localStorage ("remember me") or sessionStorage.
 * - The Axios instance in src/services/api.js reads the token from storage and
 *   injects it as `Authorization: Bearer <token>` on every request.
 */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // `user` is null when logged out.
  const [user, setUser] = useState(null);

  // `loading` gates initial render while we check whether an existing token is valid.
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addActivity, resetSession, clearSession } = useNotifications();

  // Prefer localStorage token; fall back to sessionStorage token.
  const getStoredToken = useCallback(
    () => localStorage.getItem("token") || sessionStorage.getItem("token"),
    [],
  );

  /**
   * Stores the JWT based on whether the user selected "remember me".
   * Only one storage location is used at a time to avoid ambiguity.
   */
  const storeToken = useCallback((token, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", token);
      localStorage.removeItem("token");
    }
  }, []);

  // On mount: if a token exists, validate it by calling /users/me.
  // If the token is invalid/expired, we clear it and treat the user as logged out.
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          // Backend returns { success: true, data: user }
          const { data } = await api.get("/users/me");
          setUser(data.data); // our backend returns { success: true, data: user }
        } catch {
          // Token is invalid → remove it so future requests don't loop on 401.
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [getStoredToken]);

  /**
   * Logs in and navigates to the dashboard.
   * Side effects: stores token, resets notification session, logs an activity entry.
   */
  const login = useCallback(
    async (email, password, rememberMe = true) => {
      try {
        const { data } = await api.post("/auth/login", { email, password });
        storeToken(data.token, rememberMe);
        setUser(data.user);

        // Reset notification state on a new authenticated session.
        resetSession();
        addActivity({
          type: "info",
          message: `You logged in at ${new Date().toLocaleString()}`,
          dedupeKey: "auth:login",
        });

        // After login, take user to the app.
        navigate("/dashboard");
      } catch (err) {
        const message = err.response?.data?.message || "Login failed";
        throw new Error(message, { cause: err });
      }
    },
    [addActivity, navigate, resetSession, storeToken],
  );

  /**
   * Registers a new account.
   * Backend sends an OTP email and expects the user to verify before login.
   */
  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      throw new Error(message, { cause: err });
    }
  }, []);

  /**
   * Verifies an OTP code and, on success, logs the user in.
   * This stores the token persistently (localStorage) by default.
   */
  const verifyOtp = useCallback(
    async (email, otp) => {
      try {
        const { data } = await api.post("/auth/verify-otp", { email, otp });
        // default to persistent token after verification
        storeToken(data.token, true);
        setUser(data.user);
        resetSession();
        addActivity({
          type: "info",
          message: `You logged in at ${new Date().toLocaleString()}`,
          dedupeKey: "auth:login",
        });
        navigate("/dashboard");
      } catch (err) {
        const message =
          err.response?.data?.message || "OTP verification failed";
        throw new Error(message, { cause: err });
      }
    },
    [addActivity, navigate, resetSession, storeToken],
  );

  /**
   * Requests a new OTP email for verification.
   */
  const resendOtp = useCallback(async (email) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Resend failed";
      throw new Error(message, { cause: err });
    }
  }, []);

  /**
   * Clears local auth state and navigates to /login.
   * Note: this is a client-side logout. The backend also has /auth/logout but
   * we don't call it here because the API layer already handles 401s centrally.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
    clearSession();
    navigate("/login");
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({ user, loading, login, register, verifyOtp, resendOtp, logout }),
    [user, loading, login, register, verifyOtp, resendOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to consume AuthContext.
 * Throws a clear error when used outside of AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
