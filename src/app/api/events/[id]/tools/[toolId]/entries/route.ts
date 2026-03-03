import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; toolId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tool = await prisma.eventTool.findUnique({
    where: { id: params.toolId },
  });

  if (!tool || tool.eventId !== params.id)
    return NextResponse.json({ error: "الأداة غير موجودة" }, { status: 404 });

  const entries = await prisma.teamToolEntry.findMany({
    where: { eventToolId: params.toolId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          track: { select: { nameAr: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const total = entries.length;
  const generated = entries.filter((e) => e.status === "GENERATED").length;
  const submitted = entries.filter((e) => e.status === "SUBMITTED").length;
  const pending = entries.filter((e) => e.status === "PENDING").length;
  const failed = entries.filter((e) => e.status === "FAILED").length;

  // Get total teams for completion rate
  const totalTeams = await prisma.team.count({
    where: { eventId: params.id, status: { not: "DISQUALIFIED" } },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      teamId: e.team.id,
      teamName: e.team.nameAr || e.team.name,
      trackName: e.team.track?.nameAr || e.team.track?.name || null,
      status: e.status,
      generatedUrl: e.generatedUrl,
      submittedUrl: e.submittedUrl,
      generatedAt: e.generatedAt,
      submittedAt: e.submittedAt,
      errorMessage: e.errorMessage,
    })),
    stats: {
      total,
      generated,
      submitted,
      pending,
      failed,
      totalTeams,
      completionRate: totalTeams > 0 ? Math.round(((generated + submitted) / totalTeams) * 100) : 0,
    },
  });
}
