"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  ACCENT_OPTIONS,
  type AccentColor,
  type ThemeMode,
} from "@/lib/theme";
import {
  type ProfileSettingsState,
  updateProfileSettings,
} from "@/app/settings/actions";
import { updateThemePreference } from "@/components/theme/ThemeProvider";

interface ProfileSettingsFormProps {
  initialAccentColor: AccentColor;
  initialThemeMode: ThemeMode;
  email: string;
}

const initialState: ProfileSettingsState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function ProfileSettingsForm({
  initialAccentColor,
  initialThemeMode,
  email,
}: ProfileSettingsFormProps) {
  const [state, formAction] = useActionState(updateProfileSettings, initialState);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);
  const [accentColor, setAccentColor] =
    useState<AccentColor>(initialAccentColor);

  useEffect(() => {
    updateThemePreference(themeMode, accentColor);
  }, [accentColor, themeMode]);

  const selectedAccent = useMemo(
    () => ACCENT_OPTIONS.find((option) => option.value === accentColor),
    [accentColor]
  );

  return (
    <form action={formAction} className="space-y-8">
      <section className="rounded-xl border border-primary/50 bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your name is managed in Clerk. This page only controls app-specific preferences.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-primary/50 bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the accent color and default color mode for the site.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Accent color</span>
            <select
              name="accentColor"
              value={accentColor}
              onChange={(event) =>
                setAccentColor(event.target.value as AccentColor)
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
            >
              {ACCENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.errors?.accentColor?.[0] && (
              <p className="text-sm text-red-500">
                {state.errors.accentColor[0]}
              </p>
            )}
            <div className="flex items-center gap-3 rounded-lg border border-primary/50 bg-background px-3 py-3">
              <span
                className="size-5 rounded-full border border-black/10 dark:border-white/10"
                style={{ backgroundColor: selectedAccent?.light }}
              />
              <span className="text-sm text-muted-foreground">
                {selectedAccent?.label} accent
              </span>
            </div>
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Theme mode</legend>
            <input type="hidden" name="themeMode" value={themeMode} />
            <label className="flex items-start gap-3 rounded-lg border border-primary/50 bg-background px-4 py-3">
              <input
                type="radio"
                checked={themeMode === "dark"}
                onChange={() => setThemeMode("dark")}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">Dark</span>
                <span className="block text-sm text-muted-foreground">
                  Default study-focused theme.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-primary/50 bg-background px-4 py-3">
              <input
                type="radio"
                checked={themeMode === "light"}
                onChange={() => setThemeMode("light")}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">Light</span>
                <span className="block text-sm text-muted-foreground">
                  Brighter UI with the same accent system.
                </span>
              </span>
            </label>
            {state.errors?.themeMode?.[0] && (
              <p className="text-sm text-red-500">{state.errors.themeMode[0]}</p>
            )}
          </fieldset>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div className="min-h-5 text-sm text-muted-foreground">
          {state.success ? (
            <span className="text-green-600 dark:text-green-400">
              {state.success}
            </span>
          ) : null}
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
