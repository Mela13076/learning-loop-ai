"use client";

import { useEffect } from "react";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_THEME_MODE,
  type AccentColor,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeProviderProps {
  accentColor: AccentColor;
  themeMode: ThemeMode;
  children: React.ReactNode;
}

function applyTheme(themeMode: ThemeMode, accentColor: AccentColor) {
  const root = document.documentElement;
  root.classList.toggle("dark", themeMode === "dark");
  root.dataset.theme = themeMode;
  root.dataset.accent = accentColor;

  localStorage.setItem("learning-loop-theme-mode", themeMode);
  localStorage.setItem("learning-loop-accent-color", accentColor);
}

export function ThemeProvider({
  accentColor = DEFAULT_ACCENT_COLOR,
  themeMode = DEFAULT_THEME_MODE,
  children,
}: ThemeProviderProps) {
  useEffect(() => {
    applyTheme(themeMode, accentColor);
  }, [accentColor, themeMode]);

  return <>{children}</>;
}

export function updateThemePreference(
  themeMode: ThemeMode,
  accentColor: AccentColor
) {
  applyTheme(themeMode, accentColor);
}
