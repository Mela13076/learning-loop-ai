import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_THEME_MODE,
  isAccentColor,
  isThemeMode,
} from "@/lib/theme";
import { syncClerkUser } from "@/lib/user";

export default async function SettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  const dbUser = await syncClerkUser(clerkUser);

  const accentColor = isAccentColor(dbUser.accentColor)
    ? dbUser.accentColor
    : DEFAULT_ACCENT_COLOR;

  const themeMode = isThemeMode(dbUser.themeMode)
    ? dbUser.themeMode
    : DEFAULT_THEME_MODE;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground">
              LL
            </span>
            <span className="text-lg">Learning Loop AI</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Dashboard
            </Link>
            <Link
              href="/paths"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Learning Paths
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your site appearance preferences.
          </p>
        </div>

        <ProfileSettingsForm
          initialAccentColor={accentColor}
          initialThemeMode={themeMode}
          email={dbUser.email}
        />
      </main>
    </div>
  );
}
