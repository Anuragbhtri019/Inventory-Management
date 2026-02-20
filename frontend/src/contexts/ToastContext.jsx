import React, { createContext, useCallback, useMemo } from "react";
import { toast } from "react-toastify";

/**
 * ToastContext
 *
 * Small wrapper around react-toastify so components can show toast messages
 * without importing `toast` directly.
 */
export const ToastContext = createContext();

/**
 * Custom hook to consume ToastContext.
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  // Wrap toast calls in stable callbacks to avoid re-renders.
  const showSuccess = useCallback((message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  }, []);

  const showError = useCallback((message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 4000,
    });
  }, []);

  const showInfo = useCallback((message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
    });
  }, []);

  const showWarning = useCallback((message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
    });
  }, []);

  const value = useMemo(
    () => ({ showSuccess, showError, showInfo, showWarning }),
    [showSuccess, showError, showInfo, showWarning],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export default ToastProvider;
