import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPhaseAdvancementEmail, sendPhaseEliminationEmail } from "@/lib/mail";

// GET: preview elimination results based on judge scores
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
    },
  });

  if (!phase) {
    return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
  }

  // Get all evaluations for this event, filtering by phase if evaluations have phaseId
  const evaluations = await prisma.evaluation.findMany({
    where: { submission: { eventId } },
    include: {
      team: { select: { id: true, name: true, nameAr: true, trackId: true, status: true } },
    },
  });

  // Also check PhaseResults that already have scores
  const existingResults = await prisma.phaseResult.findMany({
    where: { phaseId, teamId: { not: null } },
  });

  // Calculate average score per team
  const teamScores: Record<
    string,
    { teamId: string; teamName: string; trackId: string | null; scores: number[]; avgScore: number }
  > = {};

  // From evaluations
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

  // From PhaseResults with scores
  for (const r of existingResults) {
    if (!r.teamId || !r.totalScore) continue;
    if (!teamScores[r.teamId]) {
      // Need to fetch team info
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

  // Calculate averages
  for (const ts of Object.values(teamScores)) {
    ts.avgScore = ts.scores.length > 0
      ? ts.scores.reduce((a, b) => a + b, 0) / ts.scores.length
      : 0;
  }

  // Sort by score descending
  let sortedTeams = Object.values(teamScores).sort((a, b) => b.avgScore - a.avgScore);

  // Apply elimination logic
  const advancing: any[] = [];
  const eliminated: any[] = [];

  if (phase.advancementMode === "PER_TRACK") {
    // Group by track
    const byTrack: Record<string, typeof sortedTeams> = {};
    for (const t of sortedTeams) {
      const key = t.trackId || "no_track";
      if (!byTrack[key]) byTrack[key] = [];
      byTrack[key].push(t);
    }

    for (const [trackKey, trackTeams] of Object.entries(byTrack)) {
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

// POST: execute elimination
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  // Get preview results
  const previewUrl = new URL(req.url);
  previewUrl.search = "";
  const previewReq = new NextRequest(previewUrl, { method: "GET" });
  const previewRes = await GET(previewReq, { params });
  const previewData = await previewRes.json();

  const { advancing, eliminated } = previewData;

  // Get event and phase info
  const [event, phase, nextPhase] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { titleAr: true, title: true } }),
    prisma.eventPhase.findUnique({ where: { id: phaseId }, select: { nameAr: true, phaseNumber: true } }),
    prisma.eventPhase.findFirst({
      where: {
        eventId,
        phaseNumber: {
          gt: (await prisma.eventPhase.findUnique({ where: { id: phaseId } }))?.phaseNumber || 0,
        },
      },
      orderBy: { phaseNumber: "asc" },
      select: { nameAr: true },
    }),
  ]);

  const eventName = event?.titleAr || event?.title || "";
  const phaseName = phase?.nameAr || "";
  const nextPhaseName = nextPhase?.nameAr || null;

  // Update PhaseResults and Team statuses
  for (let i = 0; i < advancing.length; i++) {
    const team = advancing[i];

    // Upsert PhaseResult
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
