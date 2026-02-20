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

  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  // Build where clause
  const where: any = { eventId: params.id };
  if (trackId) where.trackId = trackId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { nameAr: { contains: search, mode: "insensitive" } },
    ];
  }

  const teams = await prisma.team.findMany({
    where,
    include: {
      track: {
        select: { id: true, name: true, nameAr: true, color: true },
      },
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
              email: true,
              avatar: true,
              bio: true,
              bioAr: true,
            },
          },
        },
        orderBy: { role: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tracks = await prisma.eventTrack.findMany({
    where: { eventId: params.id, isActive: true },
    select: { id: true, name: true, nameAr: true, color: true },
    orderBy: { sortOrder: "asc" },
  });

  // Stats
  const stats = {
    total: teams.length,
    active: teams.filter(t => t.status === "ACTIVE").length,
    forming: teams.filter(t => t.status === "FORMING").length,
    submitted: teams.filter(t => t.status === "SUBMITTED").length,
    totalMembers: teams.reduce((acc, t) => acc + t.members.length, 0),
  };

  return NextResponse.json({ teams, tracks, stats });
}
