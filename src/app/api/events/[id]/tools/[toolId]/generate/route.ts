import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { duplicateTemplate } from "@/lib/tool-integrations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; toolId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = ((session.user as any).roles as string[]) || [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "platform_admin", "organization_admin"].includes(r)
  );
  if (!isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tool = await prisma.eventTool.findUnique({
    where: { id: params.toolId },
  });

  if (!tool || tool.eventId !== params.id)
    return NextResponse.json({ error: "الأداة غير موجودة" }, { status: 404 });

  if (tool.toolType !== "TEMPLATE")
    return NextResponse.json(
      { error: "هذه الأداة ليست من نوع تامبلت" },
      { status: 400 }
    );

  if (!tool.templateUrl || !tool.apiToken)
    return NextResponse.json(
      { error: "رابط التامبلت أو مفتاح API مفقود" },
      { status: 400 }
    );

  const body = await req.json().catch(() => ({}));
  const teamIds: string[] | undefined = body.teamIds;

  // Get teams
  const where: any = { eventId: params.id, status: { not: "DISQUALIFIED" } };
  if (teamIds?.length) where.id = { in: teamIds };

  const teams = await prisma.team.findMany({
    where,
    select: { id: true, name: true, nameAr: true },
  });

  // Get existing entries
  const existingEntries = await prisma.teamToolEntry.findMany({
    where: { eventToolId: tool.id },
    select: { teamId: true, status: true },
  });
  const existingMap = new Map(existingEntries.map((e) => [e.teamId, e.status]));

  let generated = 0;
  let failed = 0;
  let skipped = 0;
  const errors: { teamId: string; teamName: string; error: string }[] = [];

  for (const team of teams) {
    const existingStatus = existingMap.get(team.id);
    // Skip if already generated or submitted
    if (existingStatus === "GENERATED" || existingStatus === "SUBMITTED") {
      skipped++;
      continue;
    }

    const teamName = team.nameAr || team.name;
    const entryName = `${teamName} - ${tool.nameAr}`;

    const result = await duplicateTemplate(
      tool.provider,
      tool.templateUrl,
      tool.apiToken,
      entryName
    );

    if (result.success && result.url) {
      await prisma.teamToolEntry.upsert({
        where: { eventToolId_teamId: { eventToolId: tool.id, teamId: team.id } },
        update: {
          generatedUrl: result.url,
          status: "GENERATED",
          errorMessage: null,
          generatedAt: new Date(),
        },
        create: {
          eventToolId: tool.id,
          teamId: team.id,
          generatedUrl: result.url,
          status: "GENERATED",
          generatedAt: new Date(),
        },
      });
      generated++;
    } else {
      await prisma.teamToolEntry.upsert({
        where: { eventToolId_teamId: { eventToolId: tool.id, teamId: team.id } },
        update: {
          status: "FAILED",
          errorMessage: result.error || "Unknown error",
        },
        create: {
          eventToolId: tool.id,
          teamId: team.id,
          status: "FAILED",
          errorMessage: result.error || "Unknown error",
        },
      });
      failed++;
      errors.push({ teamId: team.id, teamName, error: result.error || "Unknown error" });
    }
  }

  return NextResponse.json({
    success: true,
    generated,
    failed,
    skipped,
    total: teams.length,
    errors,
  });
}
