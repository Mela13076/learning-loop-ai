import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

// Placeholder protected page. The real dashboard is built in Step 5.
// Route protection is enforced in src/proxy.ts — signed-out users are
// redirected to /login before this component ever renders.
export default async function DashboardPage() {
  const user = await currentUser();
  const greetingName = user?.firstName ?? "there";

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-md bg-teal-600 text-sm text-white">
              LL
            </span>
            <span className="text-lg">Learning Loop AI</span>
          </Link>
          <UserButton />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {greetingName} 👋
        </h1>
        <p className="mt-3 text-muted-foreground">
          You&apos;re signed in. The full dashboard — study time, streaks, quiz
          scores, and recommendations — arrives in Step 5.
        </p>
      </main>
    </div>
  );
}
