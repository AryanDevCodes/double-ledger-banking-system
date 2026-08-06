"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import type { ReactNode } from "react";

/* ───────────────────────────────────────────
   Theme Provider v2.0
   Initializes UI style + accent from localStorage
   before first paint to prevent flash.
   ─────────────────────────────────────────── */

type UiStyle = "modern" | "classic" | "solid";
type Accent = "emerald" | "ocean" | "royal" | "ember" | "jade";

const UI_STYLE_KEY = "ui-style";
const UI_ACCENT_KEY = "ui-accent";

function ThemeInitializer() {
  useEffect(() => {
    const root = document.documentElement;
    try {
      const style = (localStorage.getItem(UI_STYLE_KEY) as UiStyle | null) ?? "modern";
      const accent = (localStorage.getItem(UI_ACCENT_KEY) as Accent | null) ?? "royal";
      root.setAttribute("data-ui-style", style);
      root.setAttribute("data-accent", accent);
    } catch {
      root.setAttribute("data-ui-style", "modern");
      root.setAttribute("data-accent", "royal");
    }
  }, []);

  return null;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ThemeInitializer />
      {children}
    </NextThemesProvider>
  );
}