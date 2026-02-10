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

  const organization = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true },
          },
        },
      },
      events: {
        select: { id: true, title: true, titleAr: true, type: true, status: true, startDate: true, endDate: true },
        orderBy: { createdAt: "desc" },
      },
      departments: {
        include: {
          _count: { select: { members: true, events: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, events: true, departments: true } },
    },
  });

  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  return NextResponse.json(organization);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const existing = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const organization = await prisma.organization.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nameAr !== undefined && { nameAr: body.nameAr }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.sector !== undefined && { sector: body.sector }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.isVerified !== undefined && { isVerified: body.isVerified, ...(body.isVerified && { verifiedAt: new Date() }) }),
      ...(body.subscriptionPlan !== undefined && { subscriptionPlan: body.subscriptionPlan }),
      ...(body.maxEvents !== undefined && { maxEvents: body.maxEvents }),
      ...(body.maxMembers !== undefined && { maxMembers: body.maxMembers }),
    },
  });

  return NextResponse.json(organization);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  await prisma.organization.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
