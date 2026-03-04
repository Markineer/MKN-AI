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
  judgesPerTeam: number;
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

/**
 * Balanced multi-judge distribution algorithm.
 * Each team gets exactly N judges (judgesPerTeam from the phase).
 * Judges are assigned by load-balancing (least-loaded judge first).
 */
function distributeJudges(
  judges: { id: string; memberId: string; name: string }[],
  teams: { id: string; name: string }[],
  judgesPerTeam: number
): { judgeId: string; judgeName: string; teamId: string; teamName: string }[] {
  const assignments: { judgeId: string; judgeName: string; teamId: string; teamName: string }[] = [];

  const n = Math.min(judgesPerTeam, judges.length);
  if (n === 0 || teams.length === 0) return assignments;

  // Track load per judge
  const judgeLoad: Record<string, number> = {};
  judges.forEach((j) => { judgeLoad[j.memberId] = 0; });

  const shuffledTeams = shuffle(teams);

  for (const team of shuffledTeams) {
    // Sort judges by load (ascending), shuffle ties for fairness
    const sorted = [...judges].sort((a, b) => {
      const diff = (judgeLoad[a.memberId] || 0) - (judgeLoad[b.memberId] || 0);
      if (diff !== 0) return diff;
      return Math.random() - 0.5; // random tie-breaking
    });

    const selected = sorted.slice(0, n);

    for (const judge of selected) {
      assignments.push({
        judgeId: judge.memberId,
        judgeName: judge.name,
        teamId: team.id,
        teamName: team.name,
      });
      judgeLoad[judge.memberId] = (judgeLoad[judge.memberId] || 0) + 1;
    }
  }

  return assignments;
}

async function buildDistribution(eventId: string, phaseId: string) {
  // Fetch phase for judgesPerTeam
  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: { judgesPerTeam: true },
  });

  const judgesPerTeam = phase?.judgesPerTeam || 1;

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

  // Helper to format judge info
  const formatJudge = (j: typeof judges[0]) => ({
    id: j.user.id,
    memberId: j.id,
    name: `${j.user.firstNameAr || j.user.firstName} ${j.user.lastNameAr || j.user.lastName}`.trim(),
  });

  if (tracks.length === 0) {
    // No tracks — distribute all judges to all teams
    if (judges.length === 0) {
      warnings.push("لا يوجد محكمون معتمدون في الفعالية");
      return { distributions, warnings, judgesPerTeam };
    }
    if (teams.length === 0) {
      warnings.push("لا يوجد فرق مسجلة في الفعالية");
      return { distributions, warnings, judgesPerTeam };
    }

    if (judges.length < judgesPerTeam) {
      warnings.push(`عدد المحكمين (${judges.length}) أقل من المطلوب لكل فريق (${judgesPerTeam}). سيتم تعيين ${judges.length} محكم لكل فريق.`);
    }

    const judgeList = judges.map(formatJudge);
    const teamList = teams.map((t) => ({ id: t.id, name: t.nameAr || t.name }));
    const assignments = distributeJudges(judgeList, teamList, judgesPerTeam);

    const effectiveN = Math.min(judgesPerTeam, judges.length);
    distributions.push({
      trackId: "",
      trackName: "جميع الفرق",
      trackColor: null,
      judges: judgeList,
      teams: teamList,
      assignments,
      teamsPerJudge: Math.ceil((teams.length * effectiveN) / judges.length),
      judgesPerTeam: effectiveN,
    });
  } else {
    // Per-track distribution
    // Judges with trackId=null can be assigned to any track
    const globalJudges = judges.filter((j) => !j.trackId);

    for (const track of tracks) {
      // Track-specific judges + global judges (no trackId)
      const trackJudges = judges.filter((j) => j.trackId === track.id);
      const availableJudges = [...trackJudges, ...globalJudges];
      const trackTeams = teams.filter((t) => t.trackId === track.id);

      if (availableJudges.length === 0) {
        warnings.push(`المسار "${track.nameAr || track.name}" لا يوجد فيه محكمون`);
        continue;
      }
      if (trackTeams.length === 0) {
        warnings.push(`المسار "${track.nameAr || track.name}" لا يوجد فيه فرق`);
        continue;
      }

      if (availableJudges.length < judgesPerTeam) {
        warnings.push(`المسار "${track.nameAr || track.name}": عدد المحكمين (${availableJudges.length}) أقل من المطلوب (${judgesPerTeam}).`);
      }

      const judgeList = availableJudges.map(formatJudge);
      const teamList = trackTeams.map((t) => ({ id: t.id, name: t.nameAr || t.name }));
      const assignments = distributeJudges(judgeList, teamList, judgesPerTeam);

      const effectiveN = Math.min(judgesPerTeam, availableJudges.length);
      distributions.push({
        trackId: track.id,
        trackName: track.nameAr || track.name,
        trackColor: track.color,
        judges: judgeList,
        teams: teamList,
        assignments,
        teamsPerJudge: Math.ceil((trackTeams.length * effectiveN) / availableJudges.length),
        judgesPerTeam: effectiveN,
      });
    }

    // Check for untracked teams
    const untrackedTeams = teams.filter((t) => !t.trackId);
    if (untrackedTeams.length > 0) {
      warnings.push(`يوجد ${untrackedTeams.length} فريق بدون مسار محدد`);
    }
  }

  return { distributions, warnings, judgesPerTeam };
}
