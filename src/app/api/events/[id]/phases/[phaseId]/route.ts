import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT: update a phase
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { phaseId } = params;
  const body = await req.json();

  const {
    name,
    nameAr,
    phaseType,
    startDate,
    endDate,
    isElimination,
    passThreshold,
    maxAdvancing,
    advancePercent,
    evaluationMethod,
    advancementMode,
    judgesPerTeam,
    qualificationMode,
    autoFilterRules,
    deliverableConfig,
  } = body;

  const phase = await prisma.eventPhase.update({
    where: { id: phaseId },
    data: {
      ...(name !== undefined && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(phaseType !== undefined && { phaseType }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(isElimination !== undefined && { isElimination }),
      ...(passThreshold !== undefined && {
        passThreshold: passThreshold ? parseFloat(passThreshold) : null,
      }),
      ...(maxAdvancing !== undefined && {
        maxAdvancing: maxAdvancing ? parseInt(maxAdvancing) : null,
      }),
      ...(advancePercent !== undefined && {
        advancePercent: advancePercent ? parseFloat(advancePercent) : null,
      }),
      ...(evaluationMethod !== undefined && {
        evaluationMethod: evaluationMethod || null,
      }),
      ...(advancementMode !== undefined && { advancementMode }),
      ...(judgesPerTeam !== undefined && {
        judgesPerTeam: parseInt(String(judgesPerTeam)) || 1,
      }),
      ...(qualificationMode !== undefined && { qualificationMode }),
      ...(autoFilterRules !== undefined && { autoFilterRules }),
      ...(deliverableConfig !== undefined && { deliverableConfig }),
    },
    include: { criteria: true, results: true },
  });

  return NextResponse.json(phase);
}

// DELETE: delete a phase
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  await prisma.eventPhase.delete({ where: { id: phaseId } });

  // Re-number remaining phases
  const remaining = await prisma.eventPhase.findMany({
    where: { eventId },
    orderBy: { phaseNumber: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].phaseNumber !== i + 1) {
      await prisma.eventPhase.update({
        where: { id: remaining[i].id },
        data: { phaseNumber: i + 1 },
      });
    }
  }

  // Update event totalPhases
  await prisma.event.update({
    where: { id: eventId },
    data: { totalPhases: remaining.length, hasPhases: remaining.length > 0 },
  });

  return NextResponse.json({ success: true });
}

// PATCH: change phase status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { phaseId } = params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["UPCOMING", "ACTIVE", "COMPLETED"].includes(status)) {
    return NextResponse.json(
      { error: "الحالة غير صالحة" },
      { status: 400 }
    );
  }

  const phase = await prisma.eventPhase.update({
    where: { id: phaseId },
    data: { status },
  });

  return NextResponse.json(phase);
}
