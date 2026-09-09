import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cad: {
          bg: "#0d1117",
          panel: "#161b22",
          border: "#30363d",
          accent: "#2563eb",
          hover: "#1f293d",
          text: "#e6edf3",
          muted: "#8b949e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
