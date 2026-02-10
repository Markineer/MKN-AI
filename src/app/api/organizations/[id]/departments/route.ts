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

  const departments = await prisma.department.findMany({
    where: { organizationId: params.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true },
          },
        },
      },
      events: {
        select: { id: true, title: true, titleAr: true, type: true, status: true, startDate: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { members: true, events: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ departments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.nameAr?.trim()) {
    return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const department = await prisma.department.create({
    data: {
      organizationId: params.id,
      name: body.name || body.nameAr,
      nameAr: body.nameAr,
      headId: body.headId || null,
    },
    include: {
      _count: { select: { members: true, events: true } },
    },
  });

  return NextResponse.json(department, { status: 201 });
}
