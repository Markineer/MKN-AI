import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { canUser } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canManage = await canUser(session.user.id, "users.roles.assign", { sessionPermissions: sp });
  if (!canManage)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const role = await prisma.platformRole.findUnique({
    where: { id: params.id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  if (!role)
    return NextResponse.json({ error: "Role not found" }, { status: 404 });

  return NextResponse.json(role);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canManage = await canUser(session.user.id, "users.roles.assign", { sessionPermissions: sp });
  if (!canManage)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.platformRole.findUnique({
    where: { id: params.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const body = await req.json();

  // Update role metadata if provided
  const updateData: Record<string, string> = {};
  if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
  if (body.descriptionAr !== undefined)
    updateData.descriptionAr = body.descriptionAr;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.icon !== undefined) updateData.icon = body.icon;

  if (Object.keys(updateData).length > 0) {
    await prisma.platformRole.update({
      where: { id: params.id },
      data: updateData,
    });
  }

  // Update permissions if provided
  if (body.permissionIds) {
    // Remove all existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: params.id },
    });

    // Create new role permissions
    if (body.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: body.permissionIds.map((pid: string) => ({
          roleId: params.id,
          permissionId: pid,
        })),
      });
    }
  }

  // Return updated role with permissions
  const role = await prisma.platformRole.findUnique({
    where: { id: params.id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json(role);
}
