import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { db } from "@/lib/db";
import {
  type AccentColor,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_THEME_MODE,
  isAccentColor,
  isThemeMode,
  type ThemeMode,
} from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learning Loop AI",
  description:
    "Build consistent study habits and master software engineering with AI-guided tutoring, quizzes, and progress tracking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const cookieStore = await cookies();

  const cookieAccentColor = cookieStore.get("learning-loop-accent-color")?.value;
  const cookieThemeMode = cookieStore.get("learning-loop-theme-mode")?.value;

  const dbUser = userId
    ? await db.user.findUnique({
        where: { clerkId: userId },
        select: { accentColor: true, themeMode: true },
      })
    : null;

  const dbAccentColor = dbUser?.accentColor;
  const dbThemeMode = dbUser?.themeMode;

  let accentColor: AccentColor = DEFAULT_ACCENT_COLOR;
  if (isAccentColor(dbAccentColor ?? "")) {
    accentColor = dbAccentColor as AccentColor;
  } else if (isAccentColor(cookieAccentColor ?? "")) {
    accentColor = cookieAccentColor as AccentColor;
  }

  let themeMode: ThemeMode = DEFAULT_THEME_MODE;
  if (isThemeMode(dbThemeMode ?? "")) {
    themeMode = dbThemeMode as ThemeMode;
  } else if (isThemeMode(cookieThemeMode ?? "")) {
    themeMode = cookieThemeMode as ThemeMode;
  }

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${themeMode === "dark" ? "dark" : ""}`}
        data-theme={themeMode}
        data-accent={accentColor}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <ThemeScript accentColor={accentColor} themeMode={themeMode} />
          <ThemeProvider accentColor={accentColor} themeMode={themeMode}>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
