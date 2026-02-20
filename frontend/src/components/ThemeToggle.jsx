import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold " +
        "border-slate-200 bg-white/80 text-slate-800 hover:bg-slate-50 " +
        "focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 " +
        "dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900 " +
        className
      }
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Dark mode (click to switch)" : "Light mode (click to switch)"}
    >
      <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
};

export default ThemeToggle;
