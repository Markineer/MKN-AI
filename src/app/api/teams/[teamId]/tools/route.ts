import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Verify user is a team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId: params.teamId, userId, isActive: true },
    include: { team: { select: { eventId: true } } },
  });

  if (!membership)
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const now = new Date();

  const tools = await prisma.eventTool.findMany({
    where: {
      eventId: membership.team.eventId,
      isActive: true,
    },
    include: {
      phase: { select: { id: true, nameAr: true, name: true } },
      entries: {
        where: { teamId: params.teamId },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const toolsData = tools
    .filter((tool) => {
      // Filter by opensAt
      if (tool.opensAt && tool.opensAt > now) return false;
      return true;
    })
    .map((tool) => ({
      id: tool.id,
      nameAr: tool.nameAr,
      name: tool.name,
      descriptionAr: tool.descriptionAr,
      toolType: tool.toolType,
      provider: tool.provider,
      icon: tool.icon,
      externalUrl: tool.externalUrl,
      opensAt: tool.opensAt,
      closesAt: tool.closesAt,
      isLocked: tool.closesAt ? tool.closesAt < now : false,
      phaseId: tool.phaseId,
      phaseName: tool.phase?.nameAr || tool.phase?.name || null,
      entry: tool.entries[0]
        ? {
            id: tool.entries[0].id,
            status: tool.entries[0].status,
            generatedUrl: tool.entries[0].generatedUrl,
            submittedUrl: tool.entries[0].submittedUrl,
          }
        : null,
    }));

  return NextResponse.json({ tools: toolsData });
}
