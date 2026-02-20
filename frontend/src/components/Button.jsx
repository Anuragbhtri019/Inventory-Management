const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 rounded-lg font-semibold
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
    whitespace-nowrap
  `;

  const sizes = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants = {
    primary: `
      bg-gradient-to-br from-brand-600 to-brand-700 text-white
      hover:from-brand-700 hover:to-brand-800 focus:ring-brand-300
      shadow-md hover:shadow-lg
    `,
    secondary: `
      bg-gradient-to-br from-slate-800 to-slate-900 text-white
      hover:from-slate-900 hover:to-black focus:ring-slate-900
      shadow-md hover:shadow-lg
    `,
    danger: `
      bg-gradient-to-br from-red-600 to-red-700 text-white
      hover:from-red-700 hover:to-red-800 focus:ring-red-300
      shadow-md hover:shadow-lg
    `,
    outline: `
      border-2 border-brand-300 bg-white text-brand-700
      hover:bg-brand-50 hover:border-brand-400 focus:ring-brand-200
      dark:border-deep-700 dark:bg-deep-950/35 dark:text-accent-100
      dark:hover:bg-deep-900/45 dark:focus:ring-deep-700
      font-semibold
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;