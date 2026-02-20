import { useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";

const iconForType = (type) => {
  switch (type) {
    case "success":
      return "✅";
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    default:
      return "ℹ️";
  }
};

const badgeClassForType = (type) => {
  switch (type) {
    case "success":
      return "bg-green-100 text-green-700 dark:bg-deep-900/40 dark:text-accent-100";
    case "error":
      return "bg-red-100 text-red-700 dark:bg-deep-900/40 dark:text-accent-100";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-deep-900/40 dark:text-accent-100";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-deep-900/40 dark:text-accent-100";
  }
};

const formatTimestamp = (ts) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
};

const NotificationsBell = () => {
  const { activities, unreadCount, markAllSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const hasUnread = unreadCount > 0;

  const displayCount = useMemo(() => {
    if (!hasUnread) return "";
    if (unreadCount > 9) return "9+";
    return String(unreadCount);
  }, [hasUnread, unreadCount]);

  useEffect(() => {
    if (!open) return;

    markAllSeen();

    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, markAllSeen]);

  const toggle = () => {
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/40"
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
      >
        🔔
        {hasUnread && (
          <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white dark:bg-deep-950 shadow-glass overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-900 dark:text-accent-100">
              Notifications
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-mid-400 dark:hover:text-accent-100"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="border-t border-slate-200/70 dark:border-deep-700/70" />

          <div className="max-h-80 overflow-auto">
            {activities.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-700 dark:text-mid-300">
                No notifications in this session.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-deep-800">
                {activities.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center text-sm ${badgeClassForType(
                          a.type,
                        )}`}
                      >
                        {iconForType(a.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-accent-100 break-words">
                          {a.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-mid-400">
                          {formatTimestamp(a.ts)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
