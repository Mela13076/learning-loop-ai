import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that do NOT require authentication.
// Everything else is protected and will redirect signed-out users to /login.
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/login(.*)",
  "/signup(.*)",
]);

// In Next.js 16 the `middleware` file convention was renamed to `proxy`.
// Clerk 7+ detects either filename on Next 16, so `clerkMiddleware()` runs here.
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
