import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TrackDistribution {
  trackId: string;
  trackName: string;
  trackColor: string | null;
  judges: { id: string; memberId: string; name: string }[];
  teams: { id: string; name: string }[];
  assignments: { judgeId: string; judgeName: string; teamId: string; teamName: string }[];
  teamsPerJudge: number;
}

// GET: preview distribution (dry run)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phaseId = searchParams.get("phaseId");

  if (!phaseId) {
    return NextResponse.json({ error: "phaseId is required" }, { status: 400 });
  }

  const result = await buildDistribution(params.id, phaseId);
  return NextResponse.json(result);
}

// POST: execute distribution
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { phaseId } = body;

  if (!phaseId) {
    return NextResponse.json({ error: "phaseId is required" }, { status: 400 });
  }

  // Check if there are completed assignments (block re-distribution)
  const completedCount = await prisma.judgeAssignment.count({
    where: { eventId: params.id, phaseId, status: "COMPLETED" },
  });

  if (completedCount > 0) {
    return NextResponse.json(
      { error: "لا يمكن إعادة التوزيع بعد اكتمال تقييمات" },
      { status: 400 }
    );
  }

  // Delete existing assignments for this phase
  await prisma.judgeAssignment.deleteMany({
    where: { eventId: params.id, phaseId },
  });

  // Build distribution
  const result = await buildDistribution(params.id, phaseId);

  if (result.warnings && result.warnings.length > 0 && result.distributions.length === 0) {
    return NextResponse.json(result);
  }

  // Create assignments
  const assignmentData: {
    eventId: string;
    phaseId: string;
    judgeId: string;
    teamId: string;
    trackId: string | null;
  }[] = [];

  for (const dist of result.distributions) {
    for (const a of dist.assignments) {
      assignmentData.push({
        eventId: params.id,
        phaseId,
        judgeId: a.judgeId,
        teamId: a.teamId,
        trackId: dist.trackId || null,
      });
    }
  }

  if (assignmentData.length > 0) {
    await prisma.judgeAssignment.createMany({
      data: assignmentData,
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    ...result,
    created: assignmentData.length,
  });
}

async function buildDistribution(eventId: string, phaseId: string) {
  // Fetch tracks
  const tracks = await prisma.eventTrack.findMany({
    where: { eventId, isActive: true },
    select: { id: true, name: true, nameAr: true, color: true },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch judges (EventMembers with role=JUDGE)
  const judges = await prisma.eventMember.findMany({
    where: { eventId, role: "JUDGE", status: "APPROVED" },
    include: {
      user: {
        select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true },
      },
    },
  });

  // Fetch teams
  const teams = await prisma.team.findMany({
    where: { eventId, status: { in: ["ACTIVE", "FORMING", "SUBMITTED"] } },
    select: { id: true, name: true, nameAr: true, trackId: true },
  });

  const warnings: string[] = [];
  const distributions: TrackDistribution[] = [];

  if (tracks.length === 0) {
    // No tracks — distribute all judges to all teams
    if (judges.length === 0) {
      warnings.push("لا يوجد محكمون معتمدون في الفعالية");
      return { distributions, warnings };
    }
    if (teams.length === 0) {
      warnings.push("لا يوجد فرق مسجلة في الفعالية");
      return { distributions, warnings };
    }

    const shuffledTeams = shuffle(teams);
    const assignments: TrackDistribution["assignments"] = [];

    for (let i = 0; i < shuffledTeams.length; i++) {
      const judge = judges[i % judges.length];
      const judgeName = judge.user.firstNameAr || judge.user.firstName || "";
      const judgeLastName = judge.user.lastNameAr || judge.user.lastName || "";
      assignments.push({
        judgeId: judge.id,
        judgeName: `${judgeName} ${judgeLastName}`.trim(),
        teamId: shuffledTeams[i].id,
        teamName: shuffledTeams[i].nameAr || shuffledTeams[i].name,
      });
    }

    distributions.push({
      trackId: "",
      trackName: "جميع الفرق",
      trackColor: null,
      judges: judges.map(j => ({
        id: j.user.id,
        memberId: j.id,
        name: `${j.user.firstNameAr || j.user.firstName} ${j.user.lastNameAr || j.user.lastName}`.trim(),
      })),
      teams: teams.map(t => ({ id: t.id, name: t.nameAr || t.name })),
      assignments,
      teamsPerJudge: Math.ceil(teams.length / judges.length),
    });
  } else {
    // Per-track distribution
    for (const track of tracks) {
      const trackJudges = judges.filter(j => j.trackId === track.id);
      const trackTeams = teams.filter(t => t.trackId === track.id);

      if (trackJudges.length === 0) {
        warnings.push(`المسار "${track.nameAr || track.name}" لا يوجد فيه محكمون`);
        continue;
      }
      if (trackTeams.length === 0) {
        warnings.push(`المسار "${track.nameAr || track.name}" لا يوجد فيه فرق`);
        continue;
      }

      const shuffledTeams = shuffle(trackTeams);
      const assignments: TrackDistribution["assignments"] = [];

      for (let i = 0; i < shuffledTeams.length; i++) {
        const judge = trackJudges[i % trackJudges.length];
        const judgeName = judge.user.firstNameAr || judge.user.firstName || "";
        const judgeLastName = judge.user.lastNameAr || judge.user.lastName || "";
        assignments.push({
          judgeId: judge.id,
          judgeName: `${judgeName} ${judgeLastName}`.trim(),
          teamId: shuffledTeams[i].id,
          teamName: shuffledTeams[i].nameAr || shuffledTeams[i].name,
        });
      }

      distributions.push({
        trackId: track.id,
        trackName: track.nameAr || track.name,
        trackColor: track.color,
        judges: trackJudges.map(j => ({
          id: j.user.id,
          memberId: j.id,
          name: `${j.user.firstNameAr || j.user.firstName} ${j.user.lastNameAr || j.user.lastName}`.trim(),
        })),
        teams: trackTeams.map(t => ({ id: t.id, name: t.nameAr || t.name })),
        assignments,
        teamsPerJudge: Math.ceil(trackTeams.length / trackJudges.length),
      });
    }

    // Check for untracked teams
    const untrackedTeams = teams.filter(t => !t.trackId);
    if (untrackedTeams.length > 0) {
      warnings.push(`يوجد ${untrackedTeams.length} فريق بدون مسار محدد`);
    }
  }

  return { distributions, warnings };
}
