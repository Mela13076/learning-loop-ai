import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  const session = await db.studySession.findUnique({
    where: { id },
    include: {
      topic: { select: { id: true, title: true } },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  // Users can only fetch their own sessions
  if (session.userId !== dbUser.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ session });
}
