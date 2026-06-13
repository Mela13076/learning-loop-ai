import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_THEME_MODE,
  type AccentColor,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeScriptProps {
  accentColor: AccentColor;
  themeMode: ThemeMode;
}

export function ThemeScript({
  accentColor = DEFAULT_ACCENT_COLOR,
  themeMode = DEFAULT_THEME_MODE,
}: ThemeScriptProps) {
  const script = `
    (() => {
      const root = document.documentElement;
      const savedTheme = localStorage.getItem("learning-loop-theme-mode");
      const savedAccent = localStorage.getItem("learning-loop-accent-color");
      const themeMode = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "${themeMode}";
      const accentColor = savedAccent || "${accentColor}";

      root.classList.toggle("dark", themeMode === "dark");
      root.dataset.theme = themeMode;
      root.dataset.accent = accentColor;
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
