import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: fetch participant's progress in a specific event
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { eventId } = params;

  // 1. Verify user is an approved participant in this event
  const membership = await prisma.eventMember.findFirst({
    where: {
      eventId,
      userId,
      role: "PARTICIPANT",
      status: "APPROVED",
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "لست مشاركاً معتمداً في هذه الفعالية" },
      { status: 403 }
    );
  }

  // 2. Fetch event with basic info and phases
  const event = await prisma.event.findUnique({
    where: { id: eventId },
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
      phases: {
        where: { isActive: true },
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
          isElimination: true,
          passThreshold: true,
          evaluationMethod: true,
          deliverableConfig: true,
          criteria: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              nameAr: true,
              maxScore: true,
              weight: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: "الفعالية غير موجودة" },
      { status: 404 }
    );
  }

  // 3. Fetch user's team in this event
  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId,
      isActive: true,
      team: { eventId },
    },
    include: {
      team: {
        include: {
          track: {
            select: {
              name: true,
              nameAr: true,
              color: true,
            },
          },
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

  const team = teamMembership
    ? {
        id: teamMembership.team.id,
        name: teamMembership.team.name,
        nameAr: teamMembership.team.nameAr || null,
        trackName:
          teamMembership.team.track?.nameAr ||
          teamMembership.team.track?.name ||
          null,
        trackColor: teamMembership.team.track?.color || null,
        members: teamMembership.team.members.map((m) => ({
          name:
            m.user.firstNameAr && m.user.lastNameAr
              ? `${m.user.firstNameAr} ${m.user.lastNameAr}`
              : `${m.user.firstName} ${m.user.lastName}`,
          role: m.role,
        })),
        projectTitle:
          teamMembership.team.projectTitle ||
          teamMembership.team.projectTitleAr ||
          null,
      }
    : null;

  const teamId = team?.id || null;

  // 4. Fetch phase results and submission status for each phase
  const phaseIds = event.phases.map((p) => p.id);

  // Get all phase results for this team (or user if no team)
  const phaseResults = teamId
    ? await prisma.phaseResult.findMany({
        where: {
          phaseId: { in: phaseIds },
          teamId,
        },
        select: {
          phaseId: true,
          score: true,
          totalScore: true,
          status: true,
          feedback: true,
          feedbackAr: true,
        },
      })
    : await prisma.phaseResult.findMany({
        where: {
          phaseId: { in: phaseIds },
          userId,
        },
        select: {
          phaseId: true,
          score: true,
          totalScore: true,
          status: true,
          feedback: true,
          feedbackAr: true,
        },
      });

  // Group results by phaseId (take the one with totalScore or the latest)
  const resultsByPhase = new Map<
    string,
    {
      score: number | null;
      totalScore: number | null;
      status: string;
      feedback: string | null;
      feedbackAr: string | null;
    }
  >();

  for (const r of phaseResults) {
    const existing = resultsByPhase.get(r.phaseId);
    // Prefer result with totalScore, or ADVANCED/ELIMINATED status
    if (
      !existing ||
      r.totalScore !== null ||
      r.status === "ADVANCED" ||
      r.status === "ELIMINATED"
    ) {
      resultsByPhase.set(r.phaseId, {
        score: r.totalScore ?? r.score,
        totalScore: r.totalScore,
        status: r.status,
        feedback: r.feedbackAr || r.feedback,
        feedbackAr: r.feedbackAr,
      });
    }
  }

  // Check which phases have submissions (deliverables) from this team
  let submissionPhaseIds: Set<string> = new Set();

  if (teamId) {
    const submissions = await prisma.submission.findMany({
      where: {
        eventId,
        teamId,
        type: "TEAM",
        status: { not: "DRAFT" },
      },
      select: {
        metadata: true,
      },
    });

    for (const sub of submissions) {
      const meta = sub.metadata as any;
      if (meta?.phaseId) {
        submissionPhaseIds.add(meta.phaseId);
      }
    }
  }

  // 5. Build phases response with results and submission status
  const phases = event.phases.map((phase) => {
    const result = resultsByPhase.get(phase.id);
    return {
      id: phase.id,
      name: phase.name,
      nameAr: phase.nameAr,
      phaseNumber: phase.phaseNumber,
      phaseType: phase.phaseType,
      status: phase.status,
      startDate: phase.startDate,
      endDate: phase.endDate,
      isElimination: phase.isElimination,
      passThreshold: phase.passThreshold,
      evaluationMethod: phase.evaluationMethod,
      deliverableConfig: phase.deliverableConfig,
      result: result
        ? {
            score: result.score,
            status: result.status,
            feedback: result.feedback,
          }
        : null,
      hasSubmitted: submissionPhaseIds.has(phase.id),
    };
  });

  // 6. Calculate progress
  const totalPhases = phases.length;
  const completedPhases = phases.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const activePhase = phases.find((p) => p.status === "ACTIVE");
  const currentPhase = activePhase ? activePhase.phaseNumber : null;
  const percentage =
    totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      titleAr: event.titleAr,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      primaryColor: event.primaryColor,
    },
    team,
    phases,
    progress: {
      totalPhases,
      completedPhases,
      currentPhase,
      percentage,
    },
  });
}
