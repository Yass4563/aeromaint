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
        background: "#F5F3EE",
        surface: "#FFFFFF",
        foreground: "#1F2937",
        muted: "#5C5A55",
        border: "#DDD7CB",
        primary: "#1B4FD8",
        "primary-soft": "#DDE7FF",
        success: "#0F6E56",
        amber: "#854F0B",
        danger: "#A32D2D",
      },
    },
  },
  plugins: [],
};
export default config;
