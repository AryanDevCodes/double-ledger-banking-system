import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface BrandContextType {
  brandName: string;
  consoleTagline: string;
  setBrandName: (value: string) => void;
  setConsoleTagline: (value: string) => void;
  resetBrand: () => void;
}

const DEFAULT_BRAND_NAME = "SecureBank";
const DEFAULT_CONSOLE_TAGLINE = "Enterprise Console";

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brandName, setBrandNameState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_BRAND_NAME;
    return localStorage.getItem("sb.brand.name") || DEFAULT_BRAND_NAME;
  });

  const [consoleTagline, setConsoleTaglineState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CONSOLE_TAGLINE;
    return localStorage.getItem("sb.brand.tagline") || DEFAULT_CONSOLE_TAGLINE;
  });

  const setBrandName = (value: string) => {
    const normalized = value.trim() || DEFAULT_BRAND_NAME;
    setBrandNameState(normalized);
  };

  const setConsoleTagline = (value: string) => {
    const normalized = value.trim() || DEFAULT_CONSOLE_TAGLINE;
    setConsoleTaglineState(normalized);
  };

  const resetBrand = () => {
    setBrandNameState(DEFAULT_BRAND_NAME);
    setConsoleTaglineState(DEFAULT_CONSOLE_TAGLINE);
  };

  useEffect(() => {
    localStorage.setItem("sb.brand.name", brandName);
    document.title = `${brandName} Control Center`;
  }, [brandName]);

  useEffect(() => {
    localStorage.setItem("sb.brand.tagline", consoleTagline);
  }, [consoleTagline]);

  const value = useMemo(
    () => ({
      brandName,
      consoleTagline,
      setBrandName,
      setConsoleTagline,
      resetBrand,
    }),
    [brandName, consoleTagline]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return context;
}
