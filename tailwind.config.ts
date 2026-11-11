import type { Config } from "tailwindcss";

const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: rgb("bg"),
        elev: rgb("elev"),
        card: rgb("card"),
        fg: rgb("fg"),
        muted: rgb("muted"),
        faint: rgb("faint"),
        line: rgb("line"),
        accent: rgb("accent"),
        signal: rgb("signal"),
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
        "3xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.1em" }],
      },
      letterSpacing: {
        tightest: "-0.045em",
        tighter: "-0.03em",
      },
      borderRadius: {
        xs: "3px",
        sm: "5px",
        md: "8px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        raise:
          "0 1px 0 0 rgb(var(--line) / 0.06) inset, 0 18px 40px -24px rgb(0 0 0 / 0.55)",
        float: "0 30px 80px -40px rgb(0 0 0 / 0.7)",
      },
      backgroundImage: {
        "grid-fine":
          "linear-gradient(to right, rgb(var(--line) / 0.055) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--line) / 0.055) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "56px 56px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        orbit: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        sweep: {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(400%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        marquee: "marquee 60s linear infinite",
        orbit: "orbit 48s linear infinite",
        "pulse-soft": "pulse-soft 3.2s ease-in-out infinite",
        sweep: "sweep 7s linear infinite",
      },
      transitionTimingFunction: {
        precise: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
