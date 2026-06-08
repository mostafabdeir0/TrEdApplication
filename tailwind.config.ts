import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: "#6B1A2A",
          dark: "#4A0F1C",
        },
        berytus: "#8B2E2E",
        "bliss-blue": "#1B4F8A",
        cream: "#FBF9F4",
        "aub-ink": "#1B1C19",
        "aub-muted": "#554243",
        "aub-line": "#DBC0C2",
        "aub-soft": "#F5F3EE",
        "aub-panel": "#F0EEE9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
