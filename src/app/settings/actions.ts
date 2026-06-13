"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAccentColor, isThemeMode } from "@/lib/theme";
import { syncClerkUser } from "@/lib/user";

const profileSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60, "Name is too long."),
  accentColor: z.string().refine(isAccentColor, "Choose a valid accent color."),
  themeMode: z.string().refine(isThemeMode, "Choose a valid theme mode."),
});

export type ProfileSettingsState = {
  errors?: {
    name?: string[];
    accentColor?: string[];
    themeMode?: string[];
  };
  success?: string;
};

export async function updateProfileSettings(
  _prevState: ProfileSettingsState,
  formData: FormData
): Promise<ProfileSettingsState> {
  const { userId } = await auth();
  if (!userId) {
    return { errors: { name: ["You must be signed in."] } };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { errors: { name: ["You must be signed in."] } };
  }

  const validated = profileSettingsSchema.safeParse({
    name: formData.get("name"),
    accentColor: formData.get("accentColor"),
    themeMode: formData.get("themeMode"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const dbUser = await syncClerkUser(clerkUser);

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      name: validated.data.name,
      accentColor: validated.data.accentColor,
      themeMode: validated.data.themeMode,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("learning-loop-accent-color", validated.data.accentColor, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set("learning-loop-theme-mode", validated.data.themeMode, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  revalidatePath("/paths");
  revalidatePath("/timer");
  revalidatePath("/settings");

  return { success: "Profile updated." };
}
