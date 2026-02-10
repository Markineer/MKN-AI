import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { canUser } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = await prisma.platformRole.findMany({
    include: {
      permissions: {
        include: {
          permission: {
            select: { code: true, name: true, nameAr: true, module: true, action: true },
          },
        },
      },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canManage = await canUser(session.user.id, "users.roles.assign", { sessionPermissions: sp });
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const role = await prisma.platformRole.create({
    data: {
      name: body.name,
      nameAr: body.nameAr,
      description: body.description,
      descriptionAr: body.descriptionAr,
      level: body.level,
      color: body.color,
      icon: body.icon,
      isSystem: false,
      permissions: {
        create: (body.permissionIds || []).map((permissionId: string) => ({
          permissionId,
        })),
      },
    },
    include: {
      permissions: { include: { permission: true } },
    },
  });

  return NextResponse.json(role, { status: 201 });
}
