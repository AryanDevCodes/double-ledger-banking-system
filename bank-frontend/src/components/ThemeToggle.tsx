import { useTheme } from "next-themes";
import { Moon, Sun, Laptop, Palette, Sparkles, Landmark, Waves, Gem } from "lucide-react";
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

type UiStyle = "modern" | "classic";
type Accent = "emerald" | "ocean" | "royal";

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

export function ThemeToggle({ withLabel = false, className }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const [uiStyle, setUiStyle] = useState<UiStyle>("modern");
  const [accent, setAccent] = useState<Accent>("emerald");

  useEffect(() => {
    const savedStyle = ((localStorage.getItem(UI_STYLE_KEY) as UiStyle | null) || "modern");
    const savedAccent = ((localStorage.getItem(UI_ACCENT_KEY) as Accent | null) || "emerald");
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={withLabel ? "outline" : "ghost"}
          size={withLabel ? "sm" : "icon"}
          aria-label="Theme settings"
          className={cn(withLabel ? "gap-2" : undefined, className)}
        >
          {current === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {withLabel ? <span>Theme</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Color Mode</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}
          className={current === "light" ? "font-semibold" : undefined}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}
          className={current === "dark" ? "font-semibold" : undefined}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}
          className={current === "system" ? "font-semibold" : undefined}
        >
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>UI Style</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleStyleChange("modern")}
          className={uiStyle === "modern" ? "font-semibold" : undefined}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Modern
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStyleChange("classic")}
          className={uiStyle === "classic" ? "font-semibold" : undefined}
        >
          <Landmark className="mr-2 h-4 w-4" />
          Classic
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accent</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleAccentChange("emerald")}
          className={accent === "emerald" ? "font-semibold" : undefined}
        >
          <Palette className="mr-2 h-4 w-4" />
          Emerald
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAccentChange("ocean")}
          className={accent === "ocean" ? "font-semibold" : undefined}
        >
          <Waves className="mr-2 h-4 w-4" />
          Ocean
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAccentChange("royal")}
          className={accent === "royal" ? "font-semibold" : undefined}
        >
          <Gem className="mr-2 h-4 w-4" />
          Royal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
