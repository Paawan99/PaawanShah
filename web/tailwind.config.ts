import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cosmic: {
          deep: "#0b0b1f",
          mid: "#1a1a3a",
          accent: "#e0c878",
          ink: "#f5f0e1",
          muted: "#8c8aa3",
        },
      },
      fontFamily: {
        display: ["Cinzel", "ui-serif", "Georgia"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        nebula:
          "radial-gradient(ellipse at top, rgba(224,200,120,0.18), transparent 60%), radial-gradient(ellipse at bottom, rgba(120,90,200,0.15), transparent 70%)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
