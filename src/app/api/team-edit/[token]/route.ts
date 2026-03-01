import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const editRequest = await prisma.teamEditRequest.findUnique({
    where: { token: params.token },
  });

  if (!editRequest)
    return NextResponse.json({ error: "رابط غير صالح" }, { status: 404 });

  // Check expiry
  if (editRequest.expiresAt < new Date()) {
    await prisma.teamEditRequest.update({
      where: { id: editRequest.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "انتهت صلاحية الرابط" }, { status: 410 });
  }

  // Only PENDING requests can be edited
  if (editRequest.status !== "PENDING")
    return NextResponse.json(
      { error: "تم استخدام هذا الرابط مسبقاً", status: editRequest.status },
      { status: 410 }
    );

  // Fetch fresh team data
  const team = await prisma.team.findUnique({
    where: { id: editRequest.teamId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          minTeamSize: true,
          maxTeamSize: true,
        },
      },
      track: { select: { id: true, name: true, nameAr: true, color: true } },
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
            },
          },
        },
      },
    },
  });

  if (!team)
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });

  // Fetch tracks with capacity info
  const tracks = await prisma.eventTrack.findMany({
    where: { eventId: editRequest.eventId, isActive: true },
    include: { _count: { select: { teams: true } } },
    orderBy: { sortOrder: "asc" },
  });

  const tracksWithCapacity = tracks.map((track) => {
    const currentCount = track._count.teams;
    // Don't count the current team against its own track
    const adjustedCount =
      track.id === team.trackId ? currentCount - 1 : currentCount;
    const isFull =
      track.maxTeams !== null && adjustedCount >= track.maxTeams;
    const remaining =
      track.maxTeams !== null ? track.maxTeams - adjustedCount : null;

    return {
      id: track.id,
      name: track.name,
      nameAr: track.nameAr,
      color: track.color,
      domain: track.domain,
      maxTeams: track.maxTeams,
      currentTeams: adjustedCount,
      remaining,
      isFull,
    };
  });

  // Fetch available participants (not in any team in this event)
  const eventParticipants = await prisma.eventMember.findMany({
    where: {
      eventId: editRequest.eventId,
      role: "PARTICIPANT",
      status: "APPROVED",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
        },
      },
    },
  });

  // Get all active team members in this event (across all teams)
  const allTeamMembers = await prisma.teamMember.findMany({
    where: {
      team: { eventId: editRequest.eventId },
      isActive: true,
    },
    select: { userId: true, teamId: true },
  });

  const currentTeamMemberIds = new Set(
    allTeamMembers.filter((m) => m.teamId === team.id).map((m) => m.userId)
  );
  const takenUserIds = new Set(
    allTeamMembers.filter((m) => m.teamId !== team.id).map((m) => m.userId)
  );

  const availableParticipants = eventParticipants
    .filter(
      (ep) =>
        !takenUserIds.has(ep.userId) && !currentTeamMemberIds.has(ep.userId)
    )
    .map((ep) => ({
      userId: ep.user.id,
      email: ep.user.email,
      firstName: ep.user.firstName,
      firstNameAr: ep.user.firstNameAr,
      lastName: ep.user.lastName,
      lastNameAr: ep.user.lastNameAr,
    }));

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      nameAr: team.nameAr,
      description: team.description,
      trackId: team.trackId,
      projectTitle: team.projectTitle,
      projectTitleAr: team.projectTitleAr,
      projectDescription: team.projectDescription,
      projectDescriptionAr: team.projectDescriptionAr,
      repositoryUrl: team.repositoryUrl,
      presentationUrl: team.presentationUrl,
      demoUrl: team.demoUrl,
      miroBoard: team.miroBoard,
      members: team.members.map((m) => ({
        userId: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        firstNameAr: m.user.firstNameAr,
        lastName: m.user.lastName,
        lastNameAr: m.user.lastNameAr,
        role: m.role,
      })),
    },
    event: team.event,
    tracks: tracksWithCapacity,
    availableParticipants,
  });
}
