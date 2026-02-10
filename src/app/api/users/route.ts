import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { canUser } from "@/lib/permissions";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canRead = await canUser(session.user.id, "users.read", { sessionPermissions: sp });
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { firstNameAr: { contains: search, mode: "insensitive" } },
      { lastNameAr: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.platformRoles = { some: { role: { name: role } } };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        firstNameAr: true,
        lastName: true,
        lastNameAr: true,
        phone: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        platformRoles: {
          select: {
            role: {
              select: { name: true, nameAr: true, level: true, color: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp2 = (session.user as any).permissions || [];
  const canCreate = await canUser(session.user.id, "users.create", { sessionPermissions: sp2 });
  if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { email, password, firstName, firstNameAr, lastName, lastNameAr, phone, roleId } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(password || "Temp@123", 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      phone,
      ...(roleId && {
        platformRoles: {
          create: { roleId, assignedBy: session.user.id },
        },
      }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
