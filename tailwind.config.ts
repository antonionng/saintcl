import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        panel: "var(--panel)",
        "panel-strong": "var(--panel-strong)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
    },
  },
};

export default config;
