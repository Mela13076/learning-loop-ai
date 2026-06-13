export const ACCENT_OPTIONS = [
  {
    value: "teal",
    label: "Teal",
    light: "#0d9488",
    dark: "#2dd4bf",
    hoverLight: "#0f766e",
    hoverDark: "#14b8a6",
    subtleLight: "#f0fdfa",
    subtleDark: "#134e4a",
  },
  {
    value: "blue",
    label: "Blue",
    light: "#2563eb",
    dark: "#60a5fa",
    hoverLight: "#1d4ed8",
    hoverDark: "#3b82f6",
    subtleLight: "#eff6ff",
    subtleDark: "#172554",
  },
  {
    value: "green",
    label: "Green",
    light: "#16a34a",
    dark: "#4ade80",
    hoverLight: "#15803d",
    hoverDark: "#22c55e",
    subtleLight: "#f0fdf4",
    subtleDark: "#14532d",
  },
  {
    value: "purple",
    label: "Purple",
    light: "#9333ea",
    dark: "#c084fc",
    hoverLight: "#7e22ce",
    hoverDark: "#a855f7",
    subtleLight: "#faf5ff",
    subtleDark: "#3b0764",
  },
  {
    value: "pink",
    label: "Pink",
    light: "#db2777",
    dark: "#f472b6",
    hoverLight: "#be185d",
    hoverDark: "#ec4899",
    subtleLight: "#fdf2f8",
    subtleDark: "#500724",
  },
  {
    value: "orange",
    label: "Orange",
    light: "#ea580c",
    dark: "#fb923c",
    hoverLight: "#c2410c",
    hoverDark: "#f97316",
    subtleLight: "#fff7ed",
    subtleDark: "#431407",
  },
  {
    value: "red",
    label: "Red",
    light: "#dc2626",
    dark: "#f87171",
    hoverLight: "#b91c1c",
    hoverDark: "#ef4444",
    subtleLight: "#fef2f2",
    subtleDark: "#450a0a",
  },
  {
    value: "yellow",
    label: "Yellow",
    light: "#ca8a04",
    dark: "#facc15",
    hoverLight: "#a16207",
    hoverDark: "#eab308",
    subtleLight: "#fefce8",
    subtleDark: "#422006",
  },
] as const;

export type AccentColor = (typeof ACCENT_OPTIONS)[number]["value"];
export type ThemeMode = "dark" | "light";

export const DEFAULT_ACCENT_COLOR: AccentColor = "teal";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

export const ACCENT_VALUES = ACCENT_OPTIONS.map((option) => option.value);

export function isAccentColor(value: string): value is AccentColor {
  return ACCENT_VALUES.includes(value as AccentColor);
}

export function isThemeMode(value: string): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function getAccentOption(accentColor: string) {
  return (
    ACCENT_OPTIONS.find((option) => option.value === accentColor) ??
    ACCENT_OPTIONS[0]
  );
}
