import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: params.id },
    include: {
      user: {
        select: {
          id: true, firstName: true, firstNameAr: true,
          lastName: true, lastNameAr: true, email: true, avatar: true, isActive: true,
        },
      },
      department: { select: { id: true, nameAr: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json({ members });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود. يجب إنشاء حساب أولاً" }, { status: 404 });
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: params.id, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "المستخدم عضو بالفعل في هذه المؤسسة" }, { status: 409 });
  }

  const member = await prisma.organizationMember.create({
    data: {
      organizationId: params.id,
      userId: user.id,
      role: body.role || "MEMBER",
      departmentId: body.departmentId || null,
      titleAr: body.titleAr || null,
    },
    include: {
      user: {
        select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true },
      },
      department: { select: { id: true, nameAr: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.memberId) {
    return NextResponse.json({ error: "memberId مطلوب" }, { status: 400 });
  }

  const member = await prisma.organizationMember.update({
    where: { id: body.memberId },
    data: {
      ...(body.role !== undefined && { role: body.role }),
      ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
      ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: {
      user: {
        select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true },
      },
      department: { select: { id: true, nameAr: true } },
    },
  });

  return NextResponse.json(member);
}
