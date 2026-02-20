import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import NotificationsBell from "./NotificationsBell";

const shortName = (user) => {
  const name = user?.name?.trim();
  if (name) return name.split(" ")[0];
  const email = user?.email?.trim();
  if (!email) return "User";
  return email.split("@")[0];
};

const initials = (text) => {
  const t = String(text || "").trim();
  if (!t) return "U";
  const parts = t.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
};

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive
      ? "bg-slate-900 text-white dark:bg-accent-100 dark:text-deep-950"
      : "text-slate-700 hover:bg-slate-100 dark:text-mid-300 dark:hover:bg-deep-900/40"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = Boolean(user?.isAdmin);

  const displayName = useMemo(() => shortName(user), [user]);
  const avatarText = useMemo(() => initials(user?.name || user?.email), [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/40 backdrop-blur-xl shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/40"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
              📦
            </div>
            <span className="text-xl font-display font-bold text-slate-900 dark:text-accent-100">
              Inventory Manager
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2 ml-2">
            <NavLink to="/dashboard" className={navLinkClass}>
              Home
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink to="/admin/users" className={navLinkClass}>
                  Users
                </NavLink>
                <NavLink to="/admin/transactions" className={navLinkClass}>
                  Transactions
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/products" className={navLinkClass}>
                  Products
                </NavLink>
                <NavLink to="/favourites" className={navLinkClass}>
                  Favourites
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />

          <NotificationsBell />

          {!isAdmin && (
            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/40"
              aria-label="Cart"
              title="Cart"
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-sun-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-10 rounded-lg border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/40 px-3"
              aria-label="User menu"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sun-400 to-brand-500 text-white font-bold flex items-center justify-center text-xs">
                {avatarText}
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-slate-900 dark:text-accent-100 max-w-[140px] truncate">
                {displayName}
              </span>
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white dark:bg-accent-100 dark:text-deep-950">
                  Admin
                </span>
              )}
              <span className="text-slate-600 dark:text-mid-400">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white dark:bg-deep-950 shadow-glass overflow-hidden">
                <Link
                  className="block px-4 py-3 text-sm font-semibold text-slate-800 dark:text-accent-100 hover:bg-slate-50 dark:hover:bg-deep-900/40"
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                {isAdmin ? (
                  <>
                    <Link
                      className="block px-4 py-3 text-sm font-semibold text-slate-800 dark:text-accent-100 hover:bg-slate-50 dark:hover:bg-deep-900/40"
                      to="/admin/users"
                      onClick={() => setMenuOpen(false)}
                    >
                      Users
                    </Link>
                    <Link
                      className="block px-4 py-3 text-sm font-semibold text-slate-800 dark:text-accent-100 hover:bg-slate-50 dark:hover:bg-deep-900/40"
                      to="/admin/transactions"
                      onClick={() => setMenuOpen(false)}
                    >
                      Transactions
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="block px-4 py-3 text-sm font-semibold text-slate-800 dark:text-accent-100 hover:bg-slate-50 dark:hover:bg-deep-900/40"
                      to="/history"
                      onClick={() => setMenuOpen(false)}
                    >
                      Purchase history
                    </Link>
                    <Link
                      className="block px-4 py-3 text-sm font-semibold text-slate-800 dark:text-accent-100 hover:bg-slate-50 dark:hover:bg-deep-900/40"
                      to="/favourites"
                      onClick={() => setMenuOpen(false)}
                    >
                      Favourites
                    </Link>
                  </>
                )}
                <Link
                  className="block px-4 py-3 text-sm font-semibold text-slate-800 dark:text-accent-100 hover:bg-slate-50 dark:hover:bg-deep-900/40"
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                <div className="border-t border-slate-200/70 dark:border-deep-700/70" />
                <div className="p-2">
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-white/30 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <NavLink
              to="/dashboard"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Home
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink
                  to="/admin/users"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Users
                </NavLink>
                <NavLink
                  to="/admin/transactions"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Transactions
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/products"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Products
                </NavLink>
                <NavLink
                  to="/favourites"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Favourites
                </NavLink>
                <NavLink
                  to="/history"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Purchase history
                </NavLink>
                <NavLink
                  to="/cart"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Cart
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
