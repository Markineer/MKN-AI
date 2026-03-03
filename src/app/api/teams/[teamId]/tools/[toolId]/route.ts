import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string; toolId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Verify user is a team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId: params.teamId, userId, isActive: true },
  });

  if (!membership)
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  // Get the tool
  const tool = await prisma.eventTool.findUnique({
    where: { id: params.toolId },
  });

  if (!tool)
    return NextResponse.json({ error: "الأداة غير موجودة" }, { status: 404 });

  if (tool.toolType !== "LINK_SUBMISSION")
    return NextResponse.json(
      { error: "هذه الأداة لا تقبل إدخال روابط" },
      { status: 400 }
    );

  // Check if locked
  const now = new Date();
  if (tool.closesAt && tool.closesAt < now)
    return NextResponse.json(
      { error: "انتهت مدة التعديل على هذه الأداة" },
      { status: 400 }
    );

  const body = await req.json();
  const { url } = body;

  if (!url || typeof url !== "string")
    return NextResponse.json(
      { error: "الرابط مطلوب" },
      { status: 400 }
    );

  const entry = await prisma.teamToolEntry.upsert({
    where: {
      eventToolId_teamId: {
        eventToolId: params.toolId,
        teamId: params.teamId,
      },
    },
    update: {
      submittedUrl: url,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    create: {
      eventToolId: params.toolId,
      teamId: params.teamId,
      submittedUrl: url,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return NextResponse.json(entry);
}
