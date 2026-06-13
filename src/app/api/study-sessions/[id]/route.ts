import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
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

const patchSchema = z.object({
  notes: z.string(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const session = await db.studySession.findUnique({ where: { id } })
  if (!session) return Response.json({ error: "Not found" }, { status: 404 })
  if (session.userId !== dbUser.id) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body: unknown = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 422 })

  const updated = await db.studySession.update({
    where: { id },
    data: { notes: parsed.data.notes.trim() || null },
    select: { id: true, notes: true },
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const session = await db.studySession.findUnique({ where: { id } })
  if (!session) return Response.json({ error: "Not found" }, { status: 404 })
  if (session.userId !== dbUser.id) return Response.json({ error: "Forbidden" }, { status: 403 })

  await db.studySession.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
