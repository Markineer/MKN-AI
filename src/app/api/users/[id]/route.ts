import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      firstNameAr: true,
      lastName: true,
      lastNameAr: true,
      phone: true,
      avatar: true,
      bio: true,
      bioAr: true,
      city: true,
      country: true,
      isActive: true,
      isVerified: true,
      lastLoginAt: true,
      createdAt: true,
      platformRoles: {
        select: {
          id: true,
          role: { select: { id: true, name: true, nameAr: true, level: true, color: true, icon: true } },
          expiresAt: true,
          createdAt: true,
        },
      },
      organizationMembers: {
        select: {
          id: true,
          role: true,
          organization: { select: { id: true, name: true, nameAr: true, logo: true } },
        },
      },
      eventMembers: {
        select: {
          id: true,
          role: true,
          status: true,
          event: { select: { id: true, title: true, titleAr: true, type: true, status: true } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updateData: any = {};
  if (body.firstName !== undefined) updateData.firstName = body.firstName;
  if (body.firstNameAr !== undefined) updateData.firstNameAr = body.firstNameAr;
  if (body.lastName !== undefined) updateData.lastName = body.lastName;
  if (body.lastNameAr !== undefined) updateData.lastNameAr = body.lastNameAr;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.bioAr !== undefined) updateData.bioAr = body.bioAr;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.password) updateData.password = await bcrypt.hash(body.password, 12);

  // Handle role assignment
  if (body.roleId) {
    // Remove old roles and assign new one
    await prisma.userPlatformRole.deleteMany({ where: { userId: params.id } });
    await prisma.userPlatformRole.create({
      data: { userId: params.id, roleId: body.roleId, assignedBy: (session.user as any).id },
    });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true, email: true, firstName: true, firstNameAr: true,
      lastName: true, lastNameAr: true, isActive: true,
      platformRoles: { select: { role: { select: { name: true, nameAr: true } } } },
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Soft delete - deactivate instead of deleting
  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
