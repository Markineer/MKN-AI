import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nafath Design System
        nafath: {
          purple: "#7C3AED",
          "purple-dark": "#6D28D9",
          "purple-light": "#EDE9FE",
          teal: "#14B8A6",
          "teal-dark": "#0D9488",
          "teal-light": "#CCFBF1",
        },
        // Primary purple scale
        brand: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B0764",
        },
        // Neutrals
        surface: {
          bg: "#F9FAFB",
          card: "#FFFFFF",
          border: "#E5E7EB",
          hover: "#F3F4F6",
        },
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        // Legacy aliases for easy migration
        elm: {
          navy: "#1F2937",
          purple: "#7C3AED",
          blue: "#14B8A6",
          orange: "#F59E0B",
          cyan: "#14B8A6",
          dark: "#111827",
          light: "#F9FAFB",
        },
      },
      fontFamily: {
        arabic: ["Cairo", "sans-serif"],
        display: ["Cairo", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "soft-sm": "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "soft": "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)",
        "soft-md": "0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)",
        "soft-lg": "0 8px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)",
        "brand": "0 4px 14px rgba(124, 58, 237, 0.25)",
        "brand-lg": "0 8px 24px rgba(124, 58, 237, 0.3)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
