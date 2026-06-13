import type { User as ClerkUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DEFAULT_ACCENT_COLOR, DEFAULT_THEME_MODE } from "@/lib/theme";

function getClerkDisplayName(clerkUser: ClerkUser): string | null {
  return (
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
  );
}

export async function syncClerkUser(clerkUser: ClerkUser) {
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const clerkName = getClerkDisplayName(clerkUser);

  const existingUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingUser) {
    return db.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        email,
        name: clerkName,
      },
    });
  }

  return db.user.create({
    data: {
      clerkId: clerkUser.id,
      email,
      name: clerkName,
      accentColor: DEFAULT_ACCENT_COLOR,
      themeMode: DEFAULT_THEME_MODE,
    },
  });
}
