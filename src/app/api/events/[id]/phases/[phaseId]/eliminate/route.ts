import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPhaseAdvancementEmail, sendPhaseEliminationEmail } from "@/lib/mail";

// GET: preview elimination/advancement results
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: {
      nameAr: true,
      isElimination: true,
      passThreshold: true,
      maxAdvancing: true,
      advancePercent: true,
      advancementMode: true,
      qualificationMode: true,
      judgesPerTeam: true,
    },
  });

  if (!phase) {
    return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
  }

  // ── ADVANCE_ALL mode: everyone advances ──
  if (phase.qualificationMode === "ADVANCE_ALL") {
    const teams = await prisma.team.findMany({
      where: { eventId, status: { in: ["ACTIVE", "FORMING", "SUBMITTED"] } },
      select: { id: true, name: true, nameAr: true, trackId: true },
    });

    return NextResponse.json({
      advancing: teams.map((t, i) => ({
        teamId: t.id,
        teamName: t.nameAr || t.name,
        trackId: t.trackId,
        avgScore: 0,
        rank: i + 1,
      })),
      eliminated: [],
      stats: { total: teams.length, advancing: teams.length, eliminated: 0 },
      phase: { ...phase },
    });
  }

  // ── MANUAL and SCORE_BASED: compute scores ──
  const evaluations = await prisma.evaluation.findMany({
    where: { submission: { eventId } },
    include: {
      team: { select: { id: true, name: true, nameAr: true, trackId: true, status: true } },
    },
  });

  const existingResults = await prisma.phaseResult.findMany({
    where: { phaseId, teamId: { not: null } },
  });

  // Calculate average score per team
  const teamScores: Record<
    string,
    { teamId: string; teamName: string; trackId: string | null; scores: number[]; avgScore: number }
  > = {};

  for (const ev of evaluations) {
    if (!ev.teamId || !ev.team) continue;
    if (!teamScores[ev.teamId]) {
      teamScores[ev.teamId] = {
        teamId: ev.teamId,
        teamName: ev.team.nameAr || ev.team.name,
        trackId: ev.team.trackId,
        scores: [],
        avgScore: 0,
      };
    }
    teamScores[ev.teamId].scores.push(ev.totalScore);
  }

  for (const r of existingResults) {
    if (!r.teamId || !r.totalScore) continue;
    if (!teamScores[r.teamId]) {
      const team = await prisma.team.findUnique({
        where: { id: r.teamId },
        select: { id: true, name: true, nameAr: true, trackId: true },
      });
      if (!team) continue;
      teamScores[r.teamId] = {
        teamId: r.teamId,
        teamName: team.nameAr || team.name,
        trackId: team.trackId,
        scores: [],
        avgScore: 0,
      };
    }
    teamScores[r.teamId].scores.push(r.totalScore);
  }

  for (const ts of Object.values(teamScores)) {
    ts.avgScore = ts.scores.length > 0
      ? ts.scores.reduce((a, b) => a + b, 0) / ts.scores.length
      : 0;
  }

  let sortedTeams = Object.values(teamScores).sort((a, b) => b.avgScore - a.avgScore);

  // ── MANUAL mode: return all teams with scores, no auto-classification ──
  if (phase.qualificationMode === "MANUAL") {
    // Also include teams without scores
    const allTeams = await prisma.team.findMany({
      where: { eventId, status: { in: ["ACTIVE", "FORMING", "SUBMITTED"] } },
      select: { id: true, name: true, nameAr: true, trackId: true },
    });

    const teamsWithScores = allTeams.map((t) => {
      const scored = teamScores[t.id];
      return {
        teamId: t.id,
        teamName: t.nameAr || t.name,
        trackId: t.trackId,
        avgScore: scored?.avgScore || 0,
        evaluationCount: scored?.scores.length || 0,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);

    return NextResponse.json({
      teams: teamsWithScores,
      advancing: [],
      eliminated: [],
      stats: { total: teamsWithScores.length, advancing: 0, eliminated: 0 },
      phase: { ...phase },
    });
  }

  // ── SCORE_BASED mode: existing elimination logic ──
  const advancing: any[] = [];
  const eliminated: any[] = [];

  if (phase.advancementMode === "PER_TRACK") {
    const byTrack: Record<string, typeof sortedTeams> = {};
    for (const t of sortedTeams) {
      const key = t.trackId || "no_track";
      if (!byTrack[key]) byTrack[key] = [];
      byTrack[key].push(t);
    }

    for (const [, trackTeams] of Object.entries(byTrack)) {
      applyElimination(trackTeams, phase, advancing, eliminated);
    }
  } else {
    applyElimination(sortedTeams, phase, advancing, eliminated);
  }

  return NextResponse.json({
    advancing: advancing.map((t, i) => ({ ...t, rank: i + 1 })),
    eliminated,
    stats: {
      total: sortedTeams.length,
      advancing: advancing.length,
      eliminated: eliminated.length,
    },
    phase: {
      passThreshold: phase.passThreshold,
      maxAdvancing: phase.maxAdvancing,
      advancePercent: phase.advancePercent,
      advancementMode: phase.advancementMode,
      qualificationMode: phase.qualificationMode,
    },
  });
}

function applyElimination(
  teams: any[],
  phase: { passThreshold: number | null; maxAdvancing: number | null; advancePercent: number | null },
  advancing: any[],
  eliminated: any[]
) {
  let maxCount = teams.length;

  if (phase.maxAdvancing) {
    maxCount = Math.min(maxCount, phase.maxAdvancing);
  }
  if (phase.advancePercent) {
    maxCount = Math.min(maxCount, Math.ceil(teams.length * phase.advancePercent / 100));
  }

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const passesThreshold = !phase.passThreshold || team.avgScore >= phase.passThreshold;
    const withinLimit = i < maxCount;

    if (passesThreshold && withinLimit) {
      advancing.push(team);
    } else {
      eliminated.push(team);
    }
  }
}

// POST: execute elimination/advancement
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: { qualificationMode: true, nameAr: true, phaseNumber: true },
  });

  if (!phase) {
    return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
  }

  let advancing: { teamId: string; teamName: string; avgScore: number }[] = [];
  let eliminated: { teamId: string; teamName: string; avgScore: number }[] = [];

  if (phase.qualificationMode === "MANUAL") {
    // Manual mode: admin provides team lists
    const body = await req.json();
    const { advancingIds, eliminatedIds } = body as {
      advancingIds?: string[];
      eliminatedIds?: string[];
    };

    if (!advancingIds || advancingIds.length === 0) {
      return NextResponse.json({ error: "يجب تحديد الفرق المتأهلة" }, { status: 400 });
    }

    // Fetch teams
    const allIds = [...(advancingIds || []), ...(eliminatedIds || [])];
    const teams = await prisma.team.findMany({
      where: { id: { in: allIds } },
      select: { id: true, name: true, nameAr: true, totalScore: true },
    });

    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

    advancing = (advancingIds || []).map((id) => ({
      teamId: id,
      teamName: teamMap[id]?.nameAr || teamMap[id]?.name || "",
      avgScore: teamMap[id]?.totalScore || 0,
    }));

    eliminated = (eliminatedIds || []).map((id) => ({
      teamId: id,
      teamName: teamMap[id]?.nameAr || teamMap[id]?.name || "",
      avgScore: teamMap[id]?.totalScore || 0,
    }));
  } else {
    // ADVANCE_ALL or SCORE_BASED: use preview endpoint logic
    const previewUrl = new URL(req.url);
    previewUrl.search = "";
    const previewReq = new NextRequest(previewUrl, { method: "GET" });
    const previewRes = await GET(previewReq, { params });
    const previewData = await previewRes.json();
    advancing = previewData.advancing || [];
    eliminated = previewData.eliminated || [];
  }

  // Get event and next phase info
  const [event, nextPhase] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { titleAr: true, title: true } }),
    prisma.eventPhase.findFirst({
      where: {
        eventId,
        phaseNumber: { gt: phase.phaseNumber || 0 },
      },
      orderBy: { phaseNumber: "asc" },
      select: { nameAr: true },
    }),
  ]);

  const eventName = event?.titleAr || event?.title || "";
  const phaseName = phase.nameAr || "";
  const nextPhaseName = nextPhase?.nameAr || null;

  // Update PhaseResults and Team statuses
  for (let i = 0; i < advancing.length; i++) {
    const team = advancing[i];

    const existing = await prisma.phaseResult.findFirst({
      where: { phaseId, teamId: team.teamId },
    });

    if (existing) {
      await prisma.phaseResult.update({
        where: { id: existing.id },
        data: { status: "ADVANCED", totalScore: team.avgScore },
      });
    } else {
      await prisma.phaseResult.create({
        data: {
          phaseId,
          teamId: team.teamId,
          status: "ADVANCED",
          totalScore: team.avgScore,
        },
      });
    }

    await prisma.team.update({
      where: { id: team.teamId },
      data: { status: "ACTIVE", totalScore: team.avgScore, rank: i + 1 },
    });
  }

  for (const team of eliminated) {
    const existing = await prisma.phaseResult.findFirst({
      where: { phaseId, teamId: team.teamId },
    });

    if (existing) {
      await prisma.phaseResult.update({
        where: { id: existing.id },
        data: { status: "ELIMINATED", totalScore: team.avgScore },
      });
    } else {
      await prisma.phaseResult.create({
        data: {
          phaseId,
          teamId: team.teamId,
          status: "ELIMINATED",
          totalScore: team.avgScore,
        },
      });
    }

    await prisma.team.update({
      where: { id: team.teamId },
      data: { status: "EVALUATED", totalScore: team.avgScore },
    });
  }

  // Send emails
  const emailPromises: Promise<any>[] = [];

  for (const team of advancing) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: team.teamId, isActive: true },
      include: { user: { select: { email: true } } },
    });
    for (const m of members) {
      if (m.user.email) {
        emailPromises.push(
          sendPhaseAdvancementEmail({
            to: m.user.email,
            teamName: team.teamName,
            eventName,
            phaseName,
            nextPhaseName,
          })
        );
      }
    }
  }

  for (const team of eliminated) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: team.teamId, isActive: true },
      include: { user: { select: { email: true } } },
    });
    for (const m of members) {
      if (m.user.email) {
        emailPromises.push(
          sendPhaseEliminationEmail({
            to: m.user.email,
            teamName: team.teamName,
            eventName,
            phaseName,
          })
        );
      }
    }
  }

  Promise.allSettled(emailPromises).catch(console.error);

  // Update phase status
  await prisma.eventPhase.update({
    where: { id: phaseId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({
    success: true,
    advanced: advancing.length,
    eliminated: eliminated.length,
    emailsSent: emailPromises.length,
  });
}
