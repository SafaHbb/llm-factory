import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F4F0",
        panel: "#FBFAF8",
        ink: "#1C1B19",
        muted: "#7D7A72",
        line: "#E3E0D8",
        accent: { DEFAULT: "#D4622A", soft: "#FBEDE4", line: "#F0C7B0" },
        steel: { DEFAULT: "#3A6B8C", soft: "#E9F0F5", line: "#BBD0DE" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
