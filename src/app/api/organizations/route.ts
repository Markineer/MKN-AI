import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { canUser } from "@/lib/permissions";
import { generateSlug } from "@/lib/utils";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = (session.user as any).permissions || [];
  const canRead = await canUser(session.user.id, "organizations.read", { sessionPermissions: sp });
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { nameAr: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: { select: { members: true, events: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ]);

  return NextResponse.json({
    organizations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp2 = (session.user as any).permissions || [];
  const canCreate = await canUser(session.user.id, "organizations.create", { sessionPermissions: sp2 });
  if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const slug = generateSlug(body.name);

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Organization name already taken" }, { status: 400 });

  const organization = await prisma.organization.create({
    data: {
      name: body.name,
      nameAr: body.nameAr,
      slug,
      type: body.type,
      sector: body.sector,
      description: body.description,
      descriptionAr: body.descriptionAr,
      email: body.email,
      phone: body.phone,
      city: body.city,
      country: body.country || "SA",
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json(organization, { status: 201 });
}
