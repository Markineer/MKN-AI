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
  const teamId = searchParams.get("teamId");
  const role = searchParams.get("role");
  const search = searchParams.get("search");

  // Get all participants from EventMember with PARTICIPANT role
  const where: any = { eventId: params.id, role: "PARTICIPANT" };
  if (trackId) where.trackId = trackId;

  const participants = await prisma.eventMember.findMany({
    where,
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
          phone: true,
          nationalId: true,
        },
      },
      track: {
        select: { id: true, name: true, nameAr: true, color: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get team memberships for these users
  const userIds = participants.map(p => p.userId);
  const teamMembers = await prisma.teamMember.findMany({
    where: {
      userId: { in: userIds },
      team: { eventId: params.id },
      isActive: true,
    },
    include: {
      team: {
        select: { id: true, name: true, nameAr: true, status: true, trackId: true },
      },
    },
  });

  // Build a map: userId -> teamMember info
  const teamMap: Record<string, { teamId: string; teamName: string; teamNameAr: string | null; teamRole: string }> = {};
  for (const tm of teamMembers) {
    teamMap[tm.userId] = {
      teamId: tm.team.id,
      teamName: tm.team.name,
      teamNameAr: tm.team.nameAr,
      teamRole: tm.role,
    };
  }

  // Filter by search
  let filtered = participants.map(p => ({
    ...p,
    team: teamMap[p.userId] || null,
  }));

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      (p.user.firstNameAr && p.user.firstNameAr.includes(q)) ||
      (p.user.lastNameAr && p.user.lastNameAr.includes(q)) ||
      p.user.firstName.toLowerCase().includes(q) ||
      p.user.lastName.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q)
    );
  }

  // Filter by team
  if (teamId) {
    filtered = filtered.filter(p => p.team?.teamId === teamId);
  }

  // Filter by team role
  if (role) {
    filtered = filtered.filter(p => p.team?.teamRole === role);
  }

  // Tracks for filter
  const tracks = await prisma.eventTrack.findMany({
    where: { eventId: params.id, isActive: true },
    select: { id: true, name: true, nameAr: true, color: true },
    orderBy: { sortOrder: "asc" },
  });

  // Teams for filter
  const teams = await prisma.team.findMany({
    where: { eventId: params.id },
    select: { id: true, name: true, nameAr: true },
    orderBy: { name: "asc" },
  });

  const stats = {
    total: filtered.length,
    withTeam: filtered.filter(p => p.team).length,
    leaders: filtered.filter(p => p.team?.teamRole === "LEADER").length,
    members: filtered.filter(p => p.team?.teamRole === "MEMBER").length,
  };

  return NextResponse.json({ participants: filtered, tracks, teams, stats });
}
