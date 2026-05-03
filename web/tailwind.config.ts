import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /** ~87,5 % de l’échelle Tailwind par défaut — police plus compacte dans tous les modules */
      fontSize: {
        xs: ["0.65625rem", { lineHeight: "0.875rem" }],
        sm: ["0.765625rem", { lineHeight: "1.09375rem" }],
        base: ["0.875rem", { lineHeight: "1.3125rem" }],
        lg: ["0.984375rem", { lineHeight: "1.53125rem" }],
        xl: ["1.09375rem", { lineHeight: "1.53125rem" }],
        "2xl": ["1.3125rem", { lineHeight: "1.75rem" }],
        "3xl": ["1.640625rem", { lineHeight: "1.96875rem" }],
        "4xl": ["1.96875rem", { lineHeight: "2.1875rem" }],
        "5xl": ["2.625rem", { lineHeight: "1" }],
        "6xl": ["3.28125rem", { lineHeight: "1" }],
        "7xl": ["3.9375rem", { lineHeight: "1" }],
        "8xl": ["5.25rem", { lineHeight: "1" }],
        "9xl": ["7rem", { lineHeight: "1" }],
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        lux: {
          ink: "#0c0a09",
          charcoal: "#1c1917",
          mist: "#fafaf9",
          champagne: "#f5f0e8",
          gold: "#c9a227",
          "gold-bright": "#e8d48b",
          bronze: "#8b6914",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          900: "#0f172a",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)",
        premium:
          "0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 12px 24px -8px rgba(15, 23, 42, 0.1)",
        glow: "0 0 40px -8px rgba(99, 102, 241, 0.45)",
        innerGlow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
        lux:
          "0 32px 64px -16px rgba(12, 10, 9, 0.45), 0 0 0 1px rgba(201, 162, 39, 0.12), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        "lux-soft":
          "0 20px 40px -12px rgba(28, 25, 23, 0.14), 0 0 0 1px rgba(201, 162, 39, 0.08)",
        "lux-glow": "0 0 48px -8px rgba(201, 162, 39, 0.22)",
      },
      backgroundImage: {
        "gradient-premium":
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #faf5ff 100%)",
        "gradient-nav":
          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.88) 100%)",
        "mesh-premium":
          "radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.1) 0px, transparent 45%), radial-gradient(at 0% 50%, rgba(14, 165, 233, 0.08) 0px, transparent 50%)",
      },
      animation: {
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
