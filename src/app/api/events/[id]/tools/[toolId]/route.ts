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
    include: {
      phase: { select: { id: true, nameAr: true, name: true } },
      entries: {
        include: {
          team: { select: { id: true, name: true, nameAr: true, track: { select: { nameAr: true, name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tool || tool.eventId !== params.id)
    return NextResponse.json({ error: "الأداة غير موجودة" }, { status: 404 });

  return NextResponse.json(tool);
}

export async function PUT(
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

  const existing = await prisma.eventTool.findUnique({
    where: { id: params.toolId },
  });
  if (!existing || existing.eventId !== params.id)
    return NextResponse.json({ error: "الأداة غير موجودة" }, { status: 404 });

  const body = await req.json();
  const data: any = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.nameAr !== undefined) data.nameAr = body.nameAr;
  if (body.description !== undefined) data.description = body.description;
  if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr;
  if (body.toolType !== undefined) data.toolType = body.toolType;
  if (body.provider !== undefined) data.provider = body.provider;
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.phaseId !== undefined) data.phaseId = body.phaseId || null;
  if (body.templateUrl !== undefined) data.templateUrl = body.templateUrl;
  if (body.apiToken !== undefined) data.apiToken = body.apiToken;
  if (body.externalUrl !== undefined) data.externalUrl = body.externalUrl;
  if (body.opensAt !== undefined) data.opensAt = body.opensAt ? new Date(body.opensAt) : null;
  if (body.closesAt !== undefined) data.closesAt = body.closesAt ? new Date(body.closesAt) : null;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

  const tool = await prisma.eventTool.update({
    where: { id: params.toolId },
    data,
    include: {
      phase: { select: { id: true, nameAr: true, name: true } },
    },
  });

  return NextResponse.json(tool);
}

export async function DELETE(
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

  const existing = await prisma.eventTool.findUnique({
    where: { id: params.toolId },
  });
  if (!existing || existing.eventId !== params.id)
    return NextResponse.json({ error: "الأداة غير موجودة" }, { status: 404 });

  await prisma.eventTool.delete({ where: { id: params.toolId } });

  return NextResponse.json({ success: true });
}
