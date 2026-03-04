import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: list all tracks for an event with counts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tracks = await prisma.eventTrack.findMany({
    where: { eventId: params.id },
    include: {
      _count: { select: { teams: true } },
      teams: {
        select: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Compute participant counts from team members
  const result = tracks.map(({ teams, ...track }) => ({
    ...track,
    _count: {
      ...track._count,
      participants: teams.reduce((sum, t) => sum + t._count.members, 0),
    },
  }));

  return NextResponse.json({ tracks: result });
}

// POST: create a new track
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, nameAr, description, descriptionAr, color, domain, maxTeams, icon } = body;

  if (!nameAr?.trim()) {
    return NextResponse.json({ error: "اسم المسار مطلوب" }, { status: 400 });
  }

  // Get next sort order
  const lastTrack = await prisma.eventTrack.findFirst({
    where: { eventId: params.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const track = await prisma.eventTrack.create({
    data: {
      eventId: params.id,
      name: name || nameAr,
      nameAr,
      description: description || null,
      descriptionAr: descriptionAr || null,
      color: color || null,
      domain: domain || "GENERAL",
      maxTeams: maxTeams ? parseInt(maxTeams) : null,
      icon: icon || null,
      sortOrder: (lastTrack?.sortOrder ?? -1) + 1,
    },
    include: {
      _count: { select: { teams: true } },
      teams: {
        select: { _count: { select: { members: true } } },
      },
    },
  });

  const { teams, ...rest } = track;
  const result = {
    ...rest,
    _count: { ...rest._count, participants: teams.reduce((s, t) => s + t._count.members, 0) },
  };

  return NextResponse.json({ track: result }, { status: 201 });
}

// PUT: update an existing track
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { trackId, name, nameAr, description, descriptionAr, color, domain, maxTeams, icon, isActive } = body;

  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  const track = await prisma.eventTrack.update({
    where: { id: trackId },
    data: {
      ...(name !== undefined && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(description !== undefined && { description: description || null }),
      ...(descriptionAr !== undefined && { descriptionAr: descriptionAr || null }),
      ...(color !== undefined && { color: color || null }),
      ...(domain !== undefined && { domain }),
      ...(maxTeams !== undefined && { maxTeams: maxTeams ? parseInt(maxTeams) : null }),
      ...(icon !== undefined && { icon: icon || null }),
      ...(isActive !== undefined && { isActive }),
    },
    include: {
      _count: { select: { teams: true } },
      teams: {
        select: { _count: { select: { members: true } } },
      },
    },
  });

  const { teams, ...rest } = track;
  const result = {
    ...rest,
    _count: { ...rest._count, participants: teams.reduce((s, t) => s + t._count.members, 0) },
  };

  return NextResponse.json({ track: result });
}

// DELETE: delete a track
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");

  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  // Check if track has teams
  const teamCount = await prisma.team.count({ where: { trackId } });
  if (teamCount > 0) {
    return NextResponse.json(
      { error: `لا يمكن حذف المسار لأنه يحتوي على ${teamCount} فريق` },
      { status: 409 }
    );
  }

  await prisma.eventTrack.delete({ where: { id: trackId } });

  return NextResponse.json({ success: true });
}
