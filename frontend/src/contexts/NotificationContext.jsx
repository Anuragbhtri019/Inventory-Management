import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
const NotificationContext = createContext(null);

const STORAGE_KEY = "inventory.notifications.activities.v1";
const STORAGE_LAST_SEEN_KEY = "inventory.notifications.lastSeenAt.v1";
const STORAGE_SESSION_ID_KEY = "inventory.notifications.sessionId.v1";
const STORAGE_DEDUPE_KEY = "inventory.notifications.dedupeKeys.v1";

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const now = () => Date.now();

const newSessionId = () => {
  return `sess_${now()}_${Math.random().toString(16).slice(2)}`;
};

export const NotificationProvider = ({ children }) => {
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
    const all = Array.from(set);
    const bounded = all.slice(Math.max(0, all.length - 300));
    sessionStorage.setItem(STORAGE_DEDUPE_KEY, JSON.stringify(bounded));
  }, []);

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

  const addActivity = useCallback(
    ({ type = "info", message, dedupeKey } = {}) => {
      const msg = String(message || "").trim();
      if (!msg) return;

      if (dedupeKey) {
        const key = String(dedupeKey);
        if (dedupeKeysRef.current.has(key)) return;
        const nextDedupe = new Set(dedupeKeysRef.current);
        nextDedupe.add(key);
        dedupeKeysRef.current = nextDedupe;
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

  const markAllSeen = useCallback(() => {
    const ts = now();
    setLastSeenAt(ts);
    persistLastSeenAt(ts);
  }, [persistLastSeenAt]);

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
