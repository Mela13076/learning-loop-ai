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

  const { id } = await params;

  const topic = await db.topic.findUnique({
    where: { id },
    include: {
      learningPath: { select: { id: true, title: true, level: true } },
    },
  });

  if (!topic) {
    return Response.json({ error: "Topic not found" }, { status: 404 });
  }

  return Response.json({ topic });
}
