import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phaseId = searchParams.get("phaseId");

  const where: any = { eventId: params.id };
  if (phaseId) where.phaseId = phaseId;

  const tools = await prisma.eventTool.findMany({
    where,
    include: {
      phase: { select: { id: true, nameAr: true, name: true } },
      _count: { select: { entries: true } },
      entries: {
        select: { status: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const toolsWithStats = tools.map((tool) => {
    const total = tool.entries.length;
    const generated = tool.entries.filter((e) => e.status === "GENERATED").length;
    const submitted = tool.entries.filter((e) => e.status === "SUBMITTED").length;
    const pending = tool.entries.filter((e) => e.status === "PENDING").length;
    const failed = tool.entries.filter((e) => e.status === "FAILED").length;

    const { entries, ...rest } = tool;
    return {
      ...rest,
      stats: { total, generated, submitted, pending, failed },
    };
  });

  return NextResponse.json({ tools: toolsWithStats });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const body = await req.json();
  const {
    name,
    nameAr,
    description,
    descriptionAr,
    toolType,
    provider,
    icon,
    phaseId,
    templateUrl,
    apiToken,
    externalUrl,
    opensAt,
    closesAt,
    sortOrder,
  } = body;

  if (!nameAr || !toolType || !provider) {
    return NextResponse.json(
      { error: "الاسم بالعربي ونوع الأداة والمزود مطلوبة" },
      { status: 400 }
    );
  }

  // Get max sortOrder
  const maxSort = await prisma.eventTool.aggregate({
    where: { eventId: params.id },
    _max: { sortOrder: true },
  });

  const tool = await prisma.eventTool.create({
    data: {
      eventId: params.id,
      phaseId: phaseId || null,
      name: name || nameAr,
      nameAr,
      description: description || null,
      descriptionAr: descriptionAr || null,
      toolType,
      provider,
      icon: icon || null,
      templateUrl: templateUrl || null,
      apiToken: apiToken || null,
      externalUrl: externalUrl || null,
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      sortOrder: sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
    include: {
      phase: { select: { id: true, nameAr: true, name: true } },
    },
  });

  return NextResponse.json(tool, { status: 201 });
}
