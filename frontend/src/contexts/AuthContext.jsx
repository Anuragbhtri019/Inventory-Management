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
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addActivity, resetSession, clearSession } = useNotifications();

  const getStoredToken = useCallback(
    () => localStorage.getItem("token") || sessionStorage.getItem("token"),
    [],
  );

  const storeToken = useCallback((token, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", token);
      localStorage.removeItem("token");
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const { data } = await api.get("/users/me");
          setUser(data.data);
        } catch {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [getStoredToken]);

  const login = useCallback(
    async (email, password, rememberMe = true) => {
      try {
        const { data } = await api.post("/auth/login", { email, password });
        storeToken(data.token, rememberMe);
        setUser(data.user);

        resetSession();
        addActivity({
          type: "info",
          message: `You logged in at ${new Date().toLocaleString()}`,
          dedupeKey: "auth:login",
        });
        navigate("/dashboard");
      } catch (err) {
        const message = err.response?.data?.message || "Login failed";
        throw new Error(message, { cause: err });
      }
    },
    [addActivity, navigate, resetSession, storeToken],
  );

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

  const verifyOtp = useCallback(
    async (email, otp) => {
      try {
        const { data } = await api.post("/auth/verify-otp", { email, otp });
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

  const resendOtp = useCallback(async (email) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Resend failed";
      throw new Error(message, { cause: err });
    }
  }, []);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
