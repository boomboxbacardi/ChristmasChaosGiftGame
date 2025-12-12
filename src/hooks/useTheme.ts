import { useCallback, useEffect, useState } from "react";

type Theme = "default" | "holiday";

const STORAGE_KEY = "ccgg-theme";

const setDocumentTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
};

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "default";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "holiday") return "holiday";
  if (stored === "default") return "default";
  return "default";
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    setDocumentTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "holiday" ? "default" : "holiday")),
    []
  );

  return {
    theme,
    isHoliday: theme === "holiday",
    setTheme,
    toggleTheme,
  };
};
