"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.toggle("light", next === "light");
    root.dataset.theme = next;
    try {
      localStorage.setItem("jb-theme", next);
    } catch {
      /* storage can be unavailable in private modes */
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        compact
          ? "flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-line/5 hover:text-fg"
          : "flex h-9 w-9 items-center justify-center rounded-sm border border-line/10 text-muted transition-colors hover:border-line/20 hover:text-fg"
      }
    >
      {mounted && theme === "light" ? (
        <Sun className="h-[15px] w-[15px]" strokeWidth={1.6} />
      ) : (
        <Moon className="h-[15px] w-[15px]" strokeWidth={1.6} />
      )}
    </button>
  );
}
