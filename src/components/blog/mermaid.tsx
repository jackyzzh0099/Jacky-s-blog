"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

/** Renders a Mermaid diagram client-side, following the current theme. */
export function Mermaid({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => (root.classList.contains("light") ? "light" : "dark");
    setTheme(read());

    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: theme === "light" ? "neutral" : "dark",
          fontFamily: "Inter, Noto Sans SC, system-ui, sans-serif",
          themeVariables:
            theme === "light"
              ? {
                  background: "#FFFFFF",
                  primaryColor: "#F4F4F0",
                  primaryBorderColor: "#C9CBD1",
                  primaryTextColor: "#16181C",
                  lineColor: "#8A8F98",
                  fontFamily: "Inter, Noto Sans SC, system-ui, sans-serif",
                }
              : {
                  background: "#101318",
                  primaryColor: "#171B21",
                  primaryBorderColor: "#2C323B",
                  primaryTextColor: "#EBEDF2",
                  lineColor: "#5E6672",
                  fontFamily: "Inter, Noto Sans SC, system-ui, sans-serif",
                },
        });

        const { svg: rendered } = await mermaid.render(idRef.current, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Diagram could not be rendered.",
          );
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  if (error) {
    return (
      <figure className="mermaid-figure">
        <div className="text-center">
          <p className="mermaid-pending">Diagram failed to render</p>
          <pre className="mt-3 max-w-full overflow-x-auto text-left font-mono text-[11px] leading-relaxed text-faint">
            {code}
          </pre>
        </div>
      </figure>
    );
  }

  return (
    <figure
      className="mermaid-figure"
      dangerouslySetInnerHTML={
        svg ? { __html: svg } : { __html: '<span class="mermaid-pending">Rendering diagram…</span>' }
      }
    />
  );
}
