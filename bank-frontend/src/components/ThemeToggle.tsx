"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Laptop, Palette, Sparkles, Landmark, PanelsTopLeft, Waves, Gem, Flame, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────
   Theme Toggle v2.0
   Visual color swatches, style previews, and
   instant application of UI preferences.
   ─────────────────────────────────────────── */

type UiStyle = "modern" | "classic" | "solid";
type Accent = "emerald" | "ocean" | "royal" | "ember" | "jade";

const UI_STYLE_KEY = "ui-style";
const UI_ACCENT_KEY = "ui-accent";

function applyUiTheme(style: UiStyle, accent: Accent) {
  const root = document.documentElement;
  root.setAttribute("data-ui-style", style);
  root.setAttribute("data-accent", accent);
}

interface ThemeToggleProps {
  withLabel?: boolean;
  className?: string;
}

const ACCENTS: { key: Accent; label: string; gradient: string; icon: typeof Gem }[] = [
  { key: "emerald", label: "Emerald", gradient: "from-emerald-500 to-teal-400", icon: Leaf },
  { key: "ocean", label: "Ocean", gradient: "from-sky-500 to-cyan-400", icon: Waves },
  { key: "royal", label: "Royal", gradient: "from-violet-500 to-fuchsia-400", icon: Gem },
  { key: "ember", label: "Ember", gradient: "from-orange-500 to-red-500", icon: Flame },
  { key: "jade", label: "Jade", gradient: "from-teal-500 to-emerald-400", icon: Palette },
];

const STYLES: { key: UiStyle; label: string; icon: typeof Sparkles }[] = [
  { key: "modern", label: "Modern", icon: Sparkles },
  { key: "classic", label: "Classic", icon: Landmark },
  { key: "solid", label: "Solid", icon: PanelsTopLeft },
];

export function ThemeToggle({ withLabel = false, className }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const [uiStyle, setUiStyle] = useState<UiStyle>("modern");
  const [accent, setAccent] = useState<Accent>("royal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedStyle = (localStorage.getItem(UI_STYLE_KEY) as UiStyle | null) || "modern";
    const savedAccent = (localStorage.getItem(UI_ACCENT_KEY) as Accent | null) || "royal";
    setUiStyle(savedStyle);
    setAccent(savedAccent);
    applyUiTheme(savedStyle, savedAccent);
  }, []);

  const handleStyleChange = (style: UiStyle) => {
    setUiStyle(style);
    localStorage.setItem(UI_STYLE_KEY, style);
    applyUiTheme(style, accent);
  };

  const handleAccentChange = (nextAccent: Accent) => {
    setAccent(nextAccent);
    localStorage.setItem(UI_ACCENT_KEY, nextAccent);
    applyUiTheme(uiStyle, nextAccent);
  };

  const current = theme || "system";
  if (!mounted) return <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-xl", className)}><Sun className="h-4 w-4" /></Button>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={withLabel ? "outline" : "ghost"} size={withLabel ? "sm" : "icon"} aria-label="Theme settings" className={cn(withLabel ? "gap-2 rounded-xl" : "rounded-xl", className)}>
          {current === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {withLabel ? <span>Theme</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-0 overflow-hidden">
        {/* Color Mode */}
        <div className="p-3">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-1 pb-2">Color Mode</DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-1">
            {(["light", "dark", "system"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTheme(m)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
                  current === m ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {m === "light" ? <Sun className="h-4 w-4" /> : m === "dark" ? <Moon className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/50 mx-0" />

        {/* UI Style */}
        <div className="p-3">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-1 pb-2">UI Style</DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-1">
            {STYLES.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => handleStyleChange(s.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
                    uiStyle === s.key ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/50 mx-0" />

        {/* Accent */}
        <div className="p-3">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-1 pb-2">Accent</DropdownMenuLabel>
          <div className="grid grid-cols-5 gap-1.5">
            {ACCENTS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => handleAccentChange(a.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-2 rounded-xl transition-all",
                    accent === a.key ? "ring-1 ring-primary/30 bg-primary/5" : "hover:bg-muted/30"
                  )}
                  title={a.label}
                >
                  <div className={cn("w-6 h-6 rounded-full bg-gradient-to-br shadow-sm", a.gradient)} />
                  <span className="text-[9px] font-medium text-muted-foreground">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}