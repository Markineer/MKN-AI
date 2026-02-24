import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch current user's full profile + history
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
      gender: true,
      dateOfBirth: true,
      city: true,
      country: true,
      university: true,
      universityAr: true,
      college: true,
      collegeAr: true,
      major: true,
      majorAr: true,
      specialization: true,
      specializationAr: true,
      createdAt: true,
      // Event memberships
      eventMembers: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              titleAr: true,
              type: true,
              category: true,
              status: true,
              startDate: true,
              endDate: true,
              primaryColor: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      // Team memberships
      teamMembers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              event: { select: { id: true, titleAr: true, title: true, type: true } },
              track: { select: { nameAr: true, name: true, color: true } },
              members: {
                where: { isActive: true },
                include: {
                  user: {
                    select: { firstNameAr: true, firstName: true, lastNameAr: true, lastName: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      // Certificates
      certificates: {
        include: {
          event: { select: { titleAr: true, title: true, type: true } },
        },
        orderBy: { issuedAt: "desc" },
      },
      // Platform roles
      platformRoles: {
        include: {
          role: { select: { name: true, nameAr: true, level: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  // Build profile response
  const fullName = `${user.firstNameAr || user.firstName} ${user.lastNameAr || user.lastName}`.trim();
  const roles = user.platformRoles.map((r) => r.role.nameAr || r.role.name);

  // Group events by type
  const eventHistory = user.eventMembers.map((em) => {
    const event = em.event;
    // Find team in this event
    const teamInEvent = user.teamMembers.find((tm) => tm.team.event.id === event.id);
    // Find certificates for this event
    const eventCerts = user.certificates.filter((c) => c.eventId === event.id);

    return {
      eventId: event.id,
      eventName: event.titleAr || event.title,
      eventType: event.type,
      eventCategory: event.category,
      eventStatus: event.status,
      eventColor: event.primaryColor,
      startDate: event.startDate,
      endDate: event.endDate,
      role: em.role,
      memberStatus: em.status,
      // Team info
      team: teamInEvent
        ? {
            id: teamInEvent.team.id,
            name: teamInEvent.team.nameAr || teamInEvent.team.name,
            role: teamInEvent.role,
            trackName: teamInEvent.team.track?.nameAr || teamInEvent.team.track?.name || null,
            trackColor: teamInEvent.team.track?.color || null,
            totalScore: teamInEvent.team.totalScore,
            rank: teamInEvent.team.rank,
            status: teamInEvent.team.status,
            projectTitle: teamInEvent.team.projectTitleAr || teamInEvent.team.projectTitle || null,
            members: teamInEvent.team.members.map((m) => ({
              name: `${m.user.firstNameAr || m.user.firstName} ${m.user.lastNameAr || m.user.lastName}`.trim(),
              role: m.role,
            })),
          }
        : null,
      // Certificates
      certificates: eventCerts.map((c) => ({
        id: c.id,
        type: c.type,
        title: c.titleAr || c.title,
        rank: c.rank,
        rankLabel: c.rankLabel,
        totalScore: c.totalScore,
        issuedAt: c.issuedAt,
      })),
    };
  });

  // Stats
  const hackathons = eventHistory.filter((e) => e.eventType === "HACKATHON");
  const challenges = eventHistory.filter((e) => e.eventType === "CHALLENGE");
  const competitions = eventHistory.filter((e) => e.eventType === "COMPETITION");

  return NextResponse.json({
    profile: {
      id: user.id,
      fullName,
      firstName: user.firstNameAr || user.firstName,
      lastName: user.lastNameAr || user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bioAr || user.bio,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      city: user.city,
      country: user.country,
      university: user.universityAr || user.university,
      college: user.collegeAr || user.college,
      major: user.majorAr || user.major,
      specialization: user.specializationAr || user.specialization,
      roles,
      memberSince: user.createdAt,
    },
    stats: {
      hackathons: hackathons.length,
      challenges: challenges.length,
      competitions: competitions.length,
      teams: user.teamMembers.length,
      certificates: user.certificates.length,
      bestRank: user.certificates
        .filter((c) => c.rank)
        .sort((a, b) => (a.rank || 99) - (b.rank || 99))[0]?.rank || null,
    },
    eventHistory,
  });
}

// PUT: update profile data
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const {
    firstNameAr, lastNameAr, phone, bio, bioAr,
    city, university, universityAr, college, collegeAr,
    major, majorAr, specialization, specializationAr,
  } = body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstNameAr !== undefined && { firstNameAr }),
      ...(lastNameAr !== undefined && { lastNameAr }),
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(bioAr !== undefined && { bioAr }),
      ...(city !== undefined && { city }),
      ...(university !== undefined && { university }),
      ...(universityAr !== undefined && { universityAr }),
      ...(college !== undefined && { college }),
      ...(collegeAr !== undefined && { collegeAr }),
      ...(major !== undefined && { major }),
      ...(majorAr !== undefined && { majorAr }),
      ...(specialization !== undefined && { specialization }),
      ...(specializationAr !== undefined && { specializationAr }),
    },
    select: { id: true, firstNameAr: true, lastNameAr: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
