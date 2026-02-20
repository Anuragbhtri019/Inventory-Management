/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Use .dark class on html/body for manual toggle; auto via prefers-color-scheme if you add dark: variants
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core palette – navy / gray / cream (60-30-10 inspired)
        deep: {
          950: "#1a1f2e", // near-black navy for dark mode deepest
          900: "#30364F", // main dominant color (60%)
          800: "#3a425e",
          700: "#4a536e",
          600: "#5c677f",
        },
        mid: {
          300: "#d0d7df", // light gray-cream mix
          400: "#c2c9d3",
          500: "#ACBAC4", // core secondary (30%)
          600: "#8e9fac",
          700: "#6f8293",
        },
        accent: {
          100: "#f9f7f2",
          200: "#f0eade",
          300: "#e8dfc9",
          400: "#E1D9BC", // warm cream accent (10%)
          500: "#d4c8a0",
          600: "#c0b080",
        },

        // Optional: kept your original teal brand family (can remove if not needed)
        teal: {
          50: "#f3f9f9",
          100: "#dff2f1",
          200: "#b7e1dd",
          300: "#86cac4",
          400: "#4fb0a7",
          500: "#2f8e86",
          600: "#1f6f68",
          700: "#17544f",
          800: "#123f3b",
          900: "#0d2b28",
        },

        // Backward-compatible alias (existing components use brand-* classes)
        brand: {
          50: "#f3f9f9",
          100: "#dff2f1",
          200: "#b7e1dd",
          300: "#86cac4",
          400: "#4fb0a7",
          500: "#2f8e86",
          600: "#1f6f68",
          700: "#17544f",
          800: "#123f3b",
          900: "#0d2b28",
        },

        // Warm sun tones (for highlights/warnings if needed)
        sun: {
          400: "#f7b24a",
          500: "#f09a31",
          600: "#db7f22",
        },

        // Dark text base
        ink: {
          900: "#0b1220",
        },
      },

      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },

      borderRadius: {
        "2.5xl": "1.25rem", // common for glass cards
        "4xl": "2rem",
      },

      boxShadow: {
        soft: "0 18px 50px -20px rgba(15, 23, 42, 0.28)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.18)", // glassmorphism base
        "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.22)",
        "glass-xl": "0 24px 64px rgba(48, 54, 79, 0.20)", // deeper in dark mode
        neumorph:
          "8px 8px 16px rgba(0,0,0,0.25), -8px -8px 16px rgba(255,255,255,0.08)", // optional light neumorph
      },

      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },

      backgroundOpacity: {
        15: "0.15",
        25: "0.25",
        35: "0.35",
      },

      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.7s ease-out",
        float: "float 6s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },

      backgroundImage: {
        "radial-soft":
          "radial-gradient(circle at 20% 20%, rgba(225, 217, 188, 0.08), transparent 60%)",
        "radial-cool":
          "radial-gradient(circle at 80% 80%, rgba(172, 186, 196, 0.06), transparent 60%)",
        "gradient-glass-dark":
          "linear-gradient(135deg, rgba(48,54,79,0.4) 0%, rgba(48,54,79,0.1) 100%)",
        "gradient-glass-light":
          "linear-gradient(135deg, rgba(225,217,188,0.35) 0%, rgba(172,186,196,0.15) 100%)",
      },
    },
  },
  plugins: [],
};
