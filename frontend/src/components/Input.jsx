const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  error,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-semibold text-slate-900 dark:text-mid-300 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 text-lg">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
        className={`
          w-full px-4 py-3 rounded-lg border-2
          bg-white dark:bg-deep-950
          font-medium text-slate-900 dark:text-accent-100 placeholder:text-slate-400 dark:placeholder:text-mid-600
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-deep-950
          transition-all duration-200
          ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-600"
              : "border-slate-200/70 dark:border-deep-700/70 focus:ring-brand-400 focus:border-brand-400 hover:border-slate-300 dark:hover:border-deep-600"
          }
          disabled:bg-slate-100 dark:disabled:bg-deep-900/40 disabled:cursor-not-allowed disabled:text-slate-500 dark:disabled:text-mid-600
        `}
      />

      {error && (
        <p className="text-red-600 text-sm font-medium flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
