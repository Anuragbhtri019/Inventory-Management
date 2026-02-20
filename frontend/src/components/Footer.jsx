const footerlinks = {
  Product: [
    "Features",
    "Integrations",
    "Pricing",
    "FAQ",
    "Security",
    "Release Notes",
  ],
  Company: [
    "About Us",
    "Careers",
    "Press",
    "News",
    "Media Kit",
    "Blog",
    "Contact",
  ],
  Resources: [
    "Documentation",
    "Community",
    "Tutorials",
    "Webinars",
    "Case Studies",
    "API Reference",
    "Support",
  ],
  Legal: [
    "Privacy Policy",
    "Terms of Service",
    "Cookie Policy",
    "GDPR Compliance",
    "Data Protection",
  ],
};

const Section = ({ title, items }) => (
  <div>
    <h3 className="text-base font-bold text-ink-900 dark:text-accent-200">
      {title}
    </h3>
    <ul className="mt-3 space-y-2">
      {items.map((label) => (
        <li key={label}>
          <a
            href="#"
            className="text-sm text-slate-700 dark:text-mid-500 font-medium hover:underline"
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/30 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Mobile: collapse footer links to avoid overflow */}
        <div className="md:hidden rounded-2xl border border-white/30 dark:border-deep-700/70 bg-white/40 dark:bg-deep-950/20 p-5">
          <div className="space-y-3">
            {Object.entries(footerlinks).map(([title, items]) => (
              <details key={title} className="group">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-3 py-2">
                  <span className="text-base font-bold text-ink-900 dark:text-accent-200">
                    {title}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-mid-300 select-none">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <ul className="pb-3 space-y-2">
                  {items.slice(0, 4).map((label) => (
                    <li key={label}>
                      <a
                        href="#"
                        className="text-sm text-slate-700 dark:text-mid-300 font-medium hover:underline"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* Desktop/tablet: full footer grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
          <Section title="Product" items={footerlinks.Product} />
          <Section title="Company" items={footerlinks.Company} />
          <Section title="Resources" items={footerlinks.Resources} />
          <Section title="Legal" items={footerlinks.Legal} />
        </div>

        <div className="pt-6 border-t border-white/30 dark:border-deep-700/70 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700 dark:text-mid-300 font-medium">
            © {year} Inventory Manager
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-mid-300 font-semibold">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Support
            </a>
            <a href="#" className="hover:underline">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
