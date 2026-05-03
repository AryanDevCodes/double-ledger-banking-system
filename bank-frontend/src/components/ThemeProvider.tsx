import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

type UiStyle = "modern" | "classic" | "solid";
type Accent = "emerald" | "ocean" | "royal" | "ember" | "jade";

const UI_STYLE_KEY = "ui-style";
const UI_ACCENT_KEY = "ui-accent";

function ThemeInitializer() {
  useEffect(() => {
    try {
      const style = (localStorage.getItem(UI_STYLE_KEY) as UiStyle | null) || "modern";
      const accent = (localStorage.getItem(UI_ACCENT_KEY) as Accent | null) || "emerald";
      const root = document.documentElement;
      root.setAttribute("data-ui-style", style);
      root.setAttribute("data-accent", accent);
    } catch {
      const root = document.documentElement;
      root.setAttribute("data-ui-style", "modern");
      root.setAttribute("data-accent", "emerald");
    }
  }, []);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeInitializer />
      {children}
    </NextThemesProvider>
  );
}
