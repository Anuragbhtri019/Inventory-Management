import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * NotificationContext
 *
 * Stores lightweight in-app activity entries ("you logged in", etc.).
 *
 * Design choices:
 * - Uses sessionStorage so notifications reset when the browser session ends.
 * - Includes dedupeKey support so repeated events (like refresh) don't spam users.
 */
const NotificationContext = createContext(null);

const STORAGE_KEY = "inventory.notifications.activities.v1";
const STORAGE_LAST_SEEN_KEY = "inventory.notifications.lastSeenAt.v1";
const STORAGE_SESSION_ID_KEY = "inventory.notifications.sessionId.v1";
const STORAGE_DEDUPE_KEY = "inventory.notifications.dedupeKeys.v1";

// Safe JSON parsing helper so corrupted storage doesn't break the app.
const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const now = () => Date.now();

// Generates a pseudo-unique session id to group activities.
const newSessionId = () => {
  return `sess_${now()}_${Math.random().toString(16).slice(2)}`;
};

export const NotificationProvider = ({ children }) => {
  // Activities are stored newest-first.
  const [activities, setActivities] = useState(() => {
    return safeJsonParse(sessionStorage.getItem(STORAGE_KEY), []);
  });

  const [lastSeenAt, setLastSeenAt] = useState(() => {
    const raw = Number(sessionStorage.getItem(STORAGE_LAST_SEEN_KEY));
    return Number.isFinite(raw) ? raw : 0;
  });

  const [sessionId, setSessionId] = useState(() => {
    return sessionStorage.getItem(STORAGE_SESSION_ID_KEY) || "";
  });

  const [dedupeKeys, setDedupeKeys] = useState(() => {
    const stored = safeJsonParse(
      sessionStorage.getItem(STORAGE_DEDUPE_KEY),
      [],
    );
    return new Set(Array.isArray(stored) ? stored : []);
  });

  // Ref-backed copy used for immediate dedupe checks.
  // React state updates are async; without a ref, two fast calls can both pass
  // the `dedupeKeys.has()` check before the state update is applied.
  const dedupeKeysRef = useRef(dedupeKeys);

  const persistActivities = useCallback((nextActivities) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextActivities));
  }, []);

  const persistLastSeenAt = useCallback((ts) => {
    sessionStorage.setItem(STORAGE_LAST_SEEN_KEY, String(ts));
  }, []);

  const persistSessionId = useCallback((id) => {
    if (!id) {
      sessionStorage.removeItem(STORAGE_SESSION_ID_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_SESSION_ID_KEY, id);
  }, []);

  const persistDedupeKeys = useCallback((set) => {
    // Keep storage bounded.
    const all = Array.from(set);
    const bounded = all.slice(Math.max(0, all.length - 300));
    sessionStorage.setItem(STORAGE_DEDUPE_KEY, JSON.stringify(bounded));
  }, []);

  /**
   * Starts a fresh notification session.
   * Called on login/verify OTP so previous-session activities don't leak.
   */
  const resetSession = useCallback(() => {
    const id = newSessionId();
    setSessionId(id);
    persistSessionId(id);

    setActivities([]);
    sessionStorage.removeItem(STORAGE_KEY);

    const ts = now();
    setLastSeenAt(ts);
    persistLastSeenAt(ts);

    const nextDedupe = new Set();
    setDedupeKeys(nextDedupe);
    dedupeKeysRef.current = nextDedupe;
    sessionStorage.removeItem(STORAGE_DEDUPE_KEY);
  }, [persistLastSeenAt, persistSessionId]);

  /**
   * Clears all stored session data.
   * Called on logout.
   */
  const clearSession = useCallback(() => {
    setSessionId("");
    persistSessionId("");

    setActivities([]);
    sessionStorage.removeItem(STORAGE_KEY);

    setLastSeenAt(0);
    sessionStorage.removeItem(STORAGE_LAST_SEEN_KEY);

    const nextDedupe = new Set();
    setDedupeKeys(nextDedupe);
    dedupeKeysRef.current = nextDedupe;
    sessionStorage.removeItem(STORAGE_DEDUPE_KEY);
  }, [persistSessionId]);

  /**
   * Adds a new activity entry.
   * - If dedupeKey is provided, the entry is only added once per session.
   * - Activities are capped to 100 entries to stay fast.
   */
  const addActivity = useCallback(
    ({ type = "info", message, dedupeKey } = {}) => {
      const msg = String(message || "").trim();
      if (!msg) return;

      if (dedupeKey) {
        const key = String(dedupeKey);
        // Use ref for a synchronous check to avoid duplicates.
        if (dedupeKeysRef.current.has(key)) return;

        // Update ref immediately so concurrent calls in the same tick can't add duplicates.
        const nextDedupe = new Set(dedupeKeysRef.current);
        nextDedupe.add(key);
        dedupeKeysRef.current = nextDedupe;

        // Keep state + storage in sync for UI and persistence.
        setDedupeKeys(nextDedupe);
        persistDedupeKeys(nextDedupe);
      }

      const entry = {
        id: `${now()}_${Math.random().toString(16).slice(2)}`,
        ts: now(),
        type,
        message: msg,
        sessionId: sessionId || "",
      };

      setActivities((prev) => {
        const next = [entry, ...prev].slice(0, 100);
        persistActivities(next);
        return next;
      });
    },
    [persistActivities, persistDedupeKeys, sessionId],
  );

  /**
   * Marks all activities as "seen" for unread badge calculation.
   */
  const markAllSeen = useCallback(() => {
    const ts = now();
    setLastSeenAt(ts);
    persistLastSeenAt(ts);
  }, [persistLastSeenAt]);

  // Derived count used by the notifications bell.
  const unreadCount = useMemo(() => {
    if (!activities.length) return 0;
    return activities.filter((a) => (a?.ts || 0) > lastSeenAt).length;
  }, [activities, lastSeenAt]);

  const value = useMemo(
    () => ({
      activities,
      unreadCount,
      lastSeenAt,
      sessionId,
      addActivity,
      markAllSeen,
      resetSession,
      clearSession,
    }),
    [
      activities,
      unreadCount,
      lastSeenAt,
      sessionId,
      addActivity,
      markAllSeen,
      resetSession,
      clearSession,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return ctx;
};

export default NotificationContext;
