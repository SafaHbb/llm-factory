import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        cream: "#F4F2EE",
        sky: "#8ED1EE",
        sun: "#FFD84D",
        pink: "#F7A8D8",
        lilac: { DEFAULT: "#A88BEB", soft: "#E3D9FA" },
        mint: "#9EE493",
        coral: "#F27B5B",
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "hard-sm": "2px 2px 0 0 #1A1A1A",
        "hard-md": "3px 3px 0 0 #1A1A1A",
        hard: "4px 4px 0 0 #1A1A1A",
        "hard-lg": "8px 8px 0 0 #1A1A1A",
      },
    },
  },
  plugins: [],
};
export default config;
