import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch participant's active event dashboard data
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Find user's active teams (events that are IN_PROGRESS or REGISTRATION_OPEN)
  const memberships = await prisma.teamMember.findMany({
    where: { userId, isActive: true },
    include: {
      team: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              titleAr: true,
              type: true,
              status: true,
              startDate: true,
              endDate: true,
              primaryColor: true,
            },
          },
          track: { select: { nameAr: true, name: true, color: true } },
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  firstNameAr: true,
                  lastNameAr: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Find the active event (IN_PROGRESS first)
  const activeTeam = memberships.find(
    (m) => m.team.event.status === "IN_PROGRESS"
  ) || memberships.find(
    (m) => m.team.event.status === "REGISTRATION_OPEN"
  );

  if (!activeTeam) {
    // No active event — return other teams for fallback display
    const otherTeams = memberships.map((m) => ({
      teamId: m.team.id,
      teamName: m.team.nameAr || m.team.name,
      eventId: m.team.event.id,
      eventName: m.team.event.titleAr || m.team.event.title,
      eventStatus: m.team.event.status,
      trackName: m.team.track?.nameAr || m.team.track?.name || null,
      trackColor: m.team.track?.color || null,
      memberCount: m.team.members.length,
    }));

    return NextResponse.json({ activeEvent: null, otherTeams });
  }

  const event = activeTeam.team.event;
  const team = activeTeam.team;

  // Fetch all phases for the active event
  const phases = await prisma.eventPhase.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { phaseNumber: "asc" },
    select: {
      id: true,
      name: true,
      nameAr: true,
      phaseNumber: true,
      phaseType: true,
      status: true,
      startDate: true,
      endDate: true,
      description: true,
      descriptionAr: true,
      deliverableConfig: true,
      isElimination: true,
    },
  });

  // Find the current (ACTIVE) phase
  const currentPhase = phases.find((p) => p.status === "ACTIVE") || null;

  // Check if team has submitted for the current phase
  let hasSubmitted = false;
  if (currentPhase) {
    const submission = await prisma.submission.findFirst({
      where: {
        teamId: team.id,
        eventId: event.id,
        metadata: { path: ["phaseId"], equals: currentPhase.id },
      },
    });
    hasSubmitted = !!submission;
  }

  // Fetch schedule items for the active event
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  // Get schedule items up to 5 days ahead
  const maxDate = new Date(todayStart);
  maxDate.setDate(maxDate.getDate() + 5);

  const scheduleItems = await prisma.eventScheduleItem.findMany({
    where: {
      eventId: event.id,
      isPublished: true,
      date: { gte: todayStart, lt: maxDate },
    },
    orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
  });

  // Split schedule items by day
  const todayItems = scheduleItems
    .filter((s) => {
      const d = new Date(s.date);
      return d >= todayStart && d < tomorrowStart;
    })
    .map((s) => ({
      id: s.id,
      title: s.titleAr || s.title,
      description: s.descriptionAr || s.description,
      type: s.type,
      startTime: s.startTime,
      endTime: s.endTime,
      isOnline: s.isOnline,
      isInPerson: s.isInPerson,
      onlineLink: s.onlineLink, // Full access for today
      location: s.locationAr || s.location,
      speaker: s.speakerAr || s.speaker,
    }));

  const tomorrowItems = scheduleItems
    .filter((s) => {
      const d = new Date(s.date);
      return d >= tomorrowStart && d < dayAfterTomorrow;
    })
    .map((s) => ({
      id: s.id,
      title: s.titleAr || s.title,
      type: s.type,
      startTime: s.startTime,
      endTime: s.endTime,
      isOnline: s.isOnline,
      isInPerson: s.isInPerson,
      // No links for tomorrow — only titles and times
    }));

  const upcomingItems = scheduleItems
    .filter((s) => {
      const d = new Date(s.date);
      return d >= dayAfterTomorrow;
    })
    .map((s) => ({
      id: s.id,
      title: s.titleAr || s.title,
      type: s.type,
      date: s.date,
      startTime: s.startTime,
      // Minimal info for future days
    }));

  // Calculate progress
  const totalPhases = phases.length;
  const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
  const percentage = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  // Other teams (excluding active event)
  const otherTeams = memberships
    .filter((m) => m.team.event.id !== event.id)
    .map((m) => ({
      teamId: m.team.id,
      teamName: m.team.nameAr || m.team.name,
      eventId: m.team.event.id,
      eventName: m.team.event.titleAr || m.team.event.title,
      eventStatus: m.team.event.status,
      trackName: m.team.track?.nameAr || m.team.track?.name || null,
      trackColor: m.team.track?.color || null,
      memberCount: m.team.members.length,
    }));

  return NextResponse.json({
    activeEvent: {
      id: event.id,
      titleAr: event.titleAr || event.title,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      primaryColor: event.primaryColor,
    },
    team: {
      id: team.id,
      nameAr: team.nameAr || team.name,
      trackName: team.track?.nameAr || team.track?.name || null,
      trackColor: team.track?.color || null,
      projectTitle: team.projectTitleAr || team.projectTitle,
      members: team.members.map((m) => ({
        name: m.user.firstNameAr
          ? `${m.user.firstNameAr} ${m.user.lastNameAr || ""}`
          : `${m.user.firstName} ${m.user.lastName}`,
        role: m.role,
      })),
    },
    currentPhase: currentPhase
      ? {
          id: currentPhase.id,
          nameAr: currentPhase.nameAr || currentPhase.name,
          phaseType: currentPhase.phaseType,
          status: currentPhase.status,
          startDate: currentPhase.startDate,
          endDate: currentPhase.endDate,
          descriptionAr: currentPhase.descriptionAr || currentPhase.description,
          deliverableConfig: currentPhase.deliverableConfig,
          hasSubmitted,
          isElimination: currentPhase.isElimination,
        }
      : null,
    schedule: {
      today: todayItems,
      tomorrow: tomorrowItems,
      upcoming: upcomingItems,
    },
    allPhases: phases.map((p) => ({
      id: p.id,
      nameAr: p.nameAr || p.name,
      status: p.status,
      phaseNumber: p.phaseNumber,
      phaseType: p.phaseType,
    })),
    progress: {
      totalPhases,
      completedPhases,
      percentage,
    },
    otherTeams,
  });
}
