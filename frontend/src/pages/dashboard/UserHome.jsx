import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";

const UserHome = ({ user, totalItems }) => {
  const heroImage =
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=80";
  const cardImages = {
    arrivals:
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80",
    picks:
      "https://images.unsplash.com/photo-1557825835-70d97c4aa567?auto=format&fit=crop&w=1200&q=80",
    secure:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero (reference-style) */}
        <section className="rounded-3xl overflow-hidden border border-white/40 dark:border-deep-700/70 bg-white/50 dark:bg-deep-950/30 backdrop-blur-xl shadow-glass">
          <div className="relative min-h-[420px] sm:min-h-[520px] lg:min-h-[600px]">
            <img
              src={heroImage}
              alt="Organized shelves in a warehouse"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-deep-950/85 via-deep-950/55 to-transparent" />

            <div className="relative p-8 sm:p-12 lg:p-14">
              <p className="text-xs font-semibold tracking-widest uppercase text-mid-300">
                Inventory Manager
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold text-white max-w-3xl">
                Shop smarter. Track faster. Checkout securely.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-mid-300 max-w-3xl leading-relaxed">
                Welcome{user?.name ? `, ${user.name}` : ""}. Browse products,
                add items to your cart, and checkout with confidence.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/products" className="inline-flex no-underline">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold shadow-glass">
                    🆕 New arrivals
                  </span>
                </Link>
                <Link to="/cart" className="inline-flex no-underline">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/40 bg-white/10 text-white font-semibold backdrop-blur-xl">
                    🛒 Open cart
                    {typeof totalItems === "number" && totalItems > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-sun-500 text-white text-[11px] font-bold">
                        {totalItems}
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits strip */}
        <section className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/40 dark:border-deep-700/70 bg-white/65 dark:bg-deep-950/30 backdrop-blur-xl shadow-glass p-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
              Fast checkout
            </p>
            <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
              Add to cart in one tap.
            </p>
          </div>
          <div className="rounded-2xl border border-white/40 dark:border-deep-700/70 bg-white/65 dark:bg-deep-950/30 backdrop-blur-xl shadow-glass p-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
              Purchase history
            </p>
            <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
              Track orders and totals.
            </p>
          </div>
          <div className="rounded-2xl border border-white/40 dark:border-deep-700/70 bg-white/65 dark:bg-deep-950/30 backdrop-blur-xl shadow-glass p-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
              Secure payments
            </p>
            <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
              Pay safely and get confirmation.
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-accent-100">
                  Quick links
                </h2>
                <p className="text-sm text-slate-700 dark:text-mid-300 mt-1">
                  Jump to the most common actions.
                </p>
              </div>
              <Link
                to="/settings"
                className="hidden sm:inline-flex no-underline"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 text-sm font-semibold text-slate-800 dark:text-mid-300 hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors">
                  ⚙️ Account
                </span>
              </Link>
            </div>

            <nav className="mt-4 flex flex-wrap gap-3" aria-label="Quick links">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-accent-100 dark:text-deep-950 px-4 py-2 text-sm font-semibold no-underline shadow-glass"
              >
                🛍️ View products
              </Link>
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-mid-300 no-underline hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors"
              >
                🛒 Open cart
                {typeof totalItems === "number" && totalItems > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-sun-500 text-white text-[11px] font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link
                to="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-mid-300 no-underline hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors"
              >
                🧾 Purchase history
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-mid-300 no-underline hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors"
              >
                👤 Edit profile
              </Link>
              <Link
                to="/settings"
                className="sm:hidden inline-flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-mid-300 no-underline hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors"
              >
                ⚙️ Account
              </Link>
            </nav>

            <div className="mt-7 grid sm:grid-cols-3 gap-4">
              <Link
                to="/products"
                className="group rounded-2xl overflow-hidden border border-white/40 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/25 backdrop-blur-xl shadow-glass no-underline"
              >
                <div className="relative h-28">
                  <img
                    src={cardImages.arrivals}
                    alt="New products on shelves"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-950/70 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
                    New arrivals
                  </p>
                  <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                    Fresh items added recently.
                  </p>
                </div>
              </Link>

              <Link
                to="/products"
                className="group rounded-2xl overflow-hidden border border-white/40 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/25 backdrop-blur-xl shadow-glass no-underline"
              >
                <div className="relative h-28">
                  <img
                    src={cardImages.picks}
                    alt="Products arranged neatly"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-950/70 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
                    Popular picks
                  </p>
                  <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                    Shop what others love.
                  </p>
                </div>
              </Link>

              <Link
                to="/cart"
                className="group rounded-2xl overflow-hidden border border-white/40 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/25 backdrop-blur-xl shadow-glass no-underline"
              >
                <div className="relative h-28">
                  <img
                    src={cardImages.secure}
                    alt="Secure payment"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-950/70 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
                    Ready to checkout
                  </p>
                  <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                    Review your cart in seconds.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass p-6">
            <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
              Account
            </p>
            <p className="text-xs text-slate-600 dark:text-mid-400 mt-1 break-all">
              {user?.email || ""}
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-700 dark:text-mid-300">
                Email verified:{" "}
                <span className="font-semibold">
                  {user?.isEmailVerified ? "Yes" : "No"}
                </span>
              </p>
              {typeof totalItems === "number" ? (
                <p className="text-sm text-slate-700 dark:text-mid-300">
                  Cart items:{" "}
                  <span className="font-semibold">{totalItems}</span>
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link to="/profile" className="inline-flex no-underline">
                <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 text-sm font-semibold text-slate-800 dark:text-mid-300 hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors">
                  👤 Edit profile
                </span>
              </Link>
              <Link to="/history" className="inline-flex no-underline">
                <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 text-sm font-semibold text-slate-800 dark:text-mid-300 hover:bg-slate-50 dark:hover:bg-deep-900/30 transition-colors">
                  🧾 View history
                </span>
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </AppLayout>
  );
};

export default UserHome;
