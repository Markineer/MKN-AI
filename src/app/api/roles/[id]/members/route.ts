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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canManage = await canUser(session.user.id, "users.roles.assign", { sessionPermissions: sp });
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.userPlatformRole.findMany({
    where: { roleId: params.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          avatar: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canManage = await canUser(session.user.id, "users.roles.assign", { sessionPermissions: sp });
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId } = body;

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const role = await prisma.platformRole.findUnique({ where: { id: params.id } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.userPlatformRole.findUnique({
    where: { userId_roleId: { userId, roleId: params.id } },
  });
  if (existing) return NextResponse.json({ error: "User already has this role" }, { status: 400 });

  const assignment = await prisma.userPlatformRole.create({
    data: {
      userId,
      roleId: params.id,
      assignedBy: session.user.id,
    },
    include: {
      user: {
        select: { id: true, email: true, firstNameAr: true, lastNameAr: true, avatar: true },
      },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canManage = await canUser(session.user.id, "users.roles.assign", { sessionPermissions: sp });
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const existing = await prisma.userPlatformRole.findUnique({
    where: { userId_roleId: { userId, roleId: params.id } },
  });
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.userPlatformRole.delete({
    where: { userId_roleId: { userId, roleId: params.id } },
  });

  return NextResponse.json({ success: true });
}
