import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch evaluations for an event (admin view or judge's own)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const evaluatorId = searchParams.get("evaluatorId");
  const phaseId = searchParams.get("phaseId");

  const where: any = {
    submission: { eventId: params.id },
    type: "JUDGE_MANUAL",
  };
  if (teamId) where.teamId = teamId;
  if (evaluatorId) where.evaluatorId = evaluatorId;

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      evaluator: {
        select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true },
      },
      team: {
        select: { id: true, name: true, nameAr: true, trackId: true },
      },
    },
    orderBy: { evaluatedAt: "desc" },
  });

  // Get criteria: use phase criteria if phaseId provided, otherwise event-level
  let criteria: any[];
  if (phaseId) {
    criteria = await prisma.phaseCriteria.findMany({
      where: { phaseId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } else {
    criteria = await prisma.evaluationCriteria.findMany({
      where: { eventId: params.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  // Get teams with their evaluations summary
  const teams = await prisma.team.findMany({
    where: { eventId: params.id, status: { in: ["ACTIVE", "FORMING", "SUBMITTED"] } },
    select: { id: true, name: true, nameAr: true, trackId: true },
  });

  // Build team averages
  const teamAverages: Record<string, {
    teamId: string;
    teamName: string;
    trackId: string | null;
    evaluationCount: number;
    averageScore: number;
    criteriaAverages: Record<string, number>;
  }> = {};

  for (const team of teams) {
    const teamEvals = evaluations.filter(e => e.teamId === team.id);
    const criteriaAvgs: Record<string, number> = {};

    if (teamEvals.length > 0) {
      // Calculate average per criterion
      for (const c of criteria) {
        const scores = teamEvals
          .map(e => (e.scores as Record<string, number>)?.[c.id])
          .filter((s): s is number => s !== undefined && s !== null);
        criteriaAvgs[c.id] = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      }
    }

    const avgScore = teamEvals.length > 0
      ? teamEvals.reduce((sum, e) => sum + e.totalScore, 0) / teamEvals.length
      : 0;

    teamAverages[team.id] = {
      teamId: team.id,
      teamName: team.nameAr || team.name,
      trackId: team.trackId,
      evaluationCount: teamEvals.length,
      averageScore: Math.round(avgScore * 100) / 100,
      criteriaAverages: criteriaAvgs,
    };
  }

  // Get tracks
  const tracks = await prisma.eventTrack.findMany({
    where: { eventId: params.id, isActive: true },
    select: { id: true, name: true, nameAr: true, color: true },
    orderBy: { sortOrder: "asc" },
  });

  // Get judge assignments for per-team completion stats
  const assignmentFilter: any = { eventId: params.id };
  if (phaseId) assignmentFilter.phaseId = phaseId;

  const assignments = await prisma.judgeAssignment.findMany({
    where: assignmentFilter,
    select: { judgeId: true, teamId: true, status: true },
  });

  // Enrich teamAverages with assignment stats
  const enrichedAverages = Object.values(teamAverages).map((ta) => {
    const teamAssignments = assignments.filter((a) => a.teamId === ta.teamId);
    return {
      ...ta,
      assignedJudges: teamAssignments.length,
      completedJudges: teamAssignments.filter((a) => a.status === "COMPLETED").length,
    };
  });

  return NextResponse.json({
    evaluations,
    criteria,
    teamAverages: enrichedAverages,
    tracks,
    stats: {
      totalTeams: teams.length,
      evaluatedTeams: enrichedAverages.filter(t => t.evaluationCount > 0).length,
      totalEvaluations: evaluations.length,
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter((a) => a.status === "COMPLETED").length,
    },
  });
}

// POST: submit an evaluation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { teamId, scores, feedback, feedbackAr, strengths, weaknesses, phaseId } = body;

  if (!teamId || !scores) {
    return NextResponse.json({ error: "teamId و scores مطلوبان" }, { status: 400 });
  }

  // Verify judge is assigned to this event
  const judgeMember = await prisma.eventMember.findFirst({
    where: { eventId: params.id, userId, role: "JUDGE", status: "APPROVED" },
  });
  if (!judgeMember) {
    return NextResponse.json({ error: "أنت لست محكماً في هذه الفعالية" }, { status: 403 });
  }

  // Get criteria: use phase criteria if phaseId provided, otherwise event-level
  let criteria: any[];
  if (phaseId) {
    criteria = await prisma.phaseCriteria.findMany({
      where: { phaseId, isActive: true },
    });
  } else {
    criteria = await prisma.evaluationCriteria.findMany({
      where: { eventId: params.id, isActive: true },
    });
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of criteria) {
    const score = scores[c.id];
    if (score !== undefined && score !== null) {
      weightedSum += (score / c.maxScore) * c.weight;
      totalWeight += c.weight;
    }
  }
  const totalScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  // Find or create a submission for this team (needed for Evaluation relation)
  let submission = await prisma.submission.findFirst({
    where: { eventId: params.id, teamId },
  });

  if (!submission) {
    submission = await prisma.submission.create({
      data: {
        eventId: params.id,
        teamId,
        userId, // judge as submitter placeholder
        type: "TEAM",
        status: "SUBMITTED",
        content: "تقييم الفريق",
        submittedAt: new Date(),
      },
    });
  }

  // Check if judge already evaluated this team
  const existingEval = await prisma.evaluation.findFirst({
    where: { submissionId: submission.id, evaluatorId: userId, type: "JUDGE_MANUAL" },
  });

  let evaluation;
  if (existingEval) {
    // Update existing evaluation
    evaluation = await prisma.evaluation.update({
      where: { id: existingEval.id },
      data: {
        scores,
        totalScore: Math.round(totalScore * 100) / 100,
        feedback,
        feedbackAr,
        strengths,
        weaknesses,
        evaluatedAt: new Date(),
      },
    });
  } else {
    // Create new evaluation
    evaluation = await prisma.evaluation.create({
      data: {
        submissionId: submission.id,
        evaluatorId: userId,
        teamId,
        type: "JUDGE_MANUAL",
        scores,
        totalScore: Math.round(totalScore * 100) / 100,
        feedback,
        feedbackAr,
        strengths,
        weaknesses,
      },
    });
  }

  // Update JudgeAssignment status if exists
  await prisma.judgeAssignment.updateMany({
    where: {
      eventId: params.id,
      judgeId: judgeMember.id,
      teamId,
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Create/update PhaseResult if phaseId provided
  if (phaseId) {
    const roundedScore = Math.round(totalScore * 100) / 100;
    const existingResult = await prisma.phaseResult.findFirst({
      where: { phaseId, teamId, evaluatedBy: userId },
    });
    if (existingResult) {
      await prisma.phaseResult.update({
        where: { id: existingResult.id },
        data: { totalScore: roundedScore, status: "EVALUATED", evaluatedAt: new Date() },
      });
    } else {
      await prisma.phaseResult.create({
        data: {
          phaseId,
          teamId,
          totalScore: roundedScore,
          status: "EVALUATED",
          evaluatedBy: userId,
          evaluatedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({ evaluation, totalScore: Math.round(totalScore * 100) / 100 }, { status: 201 });
}
