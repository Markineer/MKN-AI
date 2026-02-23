import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: fetch all phases for an event with criteria, results, and stats
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

  const phases = await prisma.eventPhase.findMany({
    where: { eventId },
    include: {
      criteria: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      results: {
        include: {
          criteria: { select: { id: true, name: true, nameAr: true } },
        },
      },
      assignments: {
        select: { id: true, judgeId: true, teamId: true, status: true },
      },
    },
    orderBy: { phaseNumber: "asc" },
  });

  // Get teams for stats
  const teams = await prisma.team.findMany({
    where: { eventId },
    select: { id: true, name: true, nameAr: true, trackId: true, status: true },
  });

  const enriched = phases.map((phase) => {
    const phaseTeamResults = phase.results.filter((r) => r.teamId);
    const uniqueTeams = new Set(phaseTeamResults.map((r) => r.teamId));
    const advanced = phaseTeamResults.filter((r) => r.status === "ADVANCED").length;
    const eliminated = phaseTeamResults.filter((r) => r.status === "ELIMINATED").length;
    const evaluated = phaseTeamResults.filter((r) => r.status === "EVALUATED" || r.status === "ADVANCED" || r.status === "ELIMINATED").length;

    return {
      ...phase,
      totalParticipants: teams.length,
      evaluatedTeams: uniqueTeams.size,
      advanced,
      eliminated,
      pendingEvaluation: teams.length - evaluated,
    };
  });

  return NextResponse.json({ phases: enriched, totalTeams: teams.length });
}

// POST: create a new phase
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  const body = await req.json();

  const {
    name,
    nameAr,
    phaseType = "GENERAL",
    startDate,
    endDate,
    isElimination = false,
    passThreshold,
    maxAdvancing,
    advancePercent,
    evaluationMethod,
    advancementMode = "OVERALL",
    autoFilterRules,
  } = body;

  if (!nameAr || !startDate || !endDate) {
    return NextResponse.json(
      { error: "الاسم وتاريخ البداية والنهاية مطلوبة" },
      { status: 400 }
    );
  }

  // Auto-calculate phase number
  const lastPhase = await prisma.eventPhase.findFirst({
    where: { eventId },
    orderBy: { phaseNumber: "desc" },
  });
  const phaseNumber = (lastPhase?.phaseNumber || 0) + 1;

  const phase = await prisma.eventPhase.create({
    data: {
      eventId,
      name: name || nameAr,
      nameAr,
      phaseNumber,
      phaseType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isElimination,
      passThreshold: passThreshold ? parseFloat(passThreshold) : null,
      maxAdvancing: maxAdvancing ? parseInt(maxAdvancing) : null,
      advancePercent: advancePercent ? parseFloat(advancePercent) : null,
      evaluationMethod: evaluationMethod || null,
      advancementMode,
      autoFilterRules: autoFilterRules || null,
    },
    include: {
      criteria: true,
      results: true,
    },
  });

  // Update event totalPhases
  await prisma.event.update({
    where: { id: eventId },
    data: {
      hasPhases: true,
      totalPhases: phaseNumber,
    },
  });

  return NextResponse.json(phase, { status: 201 });
}
