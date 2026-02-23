import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch team info + criteria + existing evaluation + deliverables for judge
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { eventId, teamId } = params;
  const phaseId = req.nextUrl.searchParams.get("phaseId");

  // Verify judge membership
  const judgeMember = await prisma.eventMember.findFirst({
    where: { eventId, userId, role: "JUDGE", status: "APPROVED" },
  });

  if (!judgeMember) {
    return NextResponse.json({ error: "أنت لست محكماً في هذه الفعالية" }, { status: 403 });
  }

  // Get team info with deliverables
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      track: { select: { nameAr: true, color: true } },
      members: {
        where: { isActive: true },
        include: {
          user: { select: { firstNameAr: true, firstName: true, lastNameAr: true, lastName: true } },
        },
      },
      submissions: {
        where: { type: "TEAM" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true, content: true, fileUrl: true, repositoryUrl: true,
          metadata: true, status: true, submittedAt: true,
        },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });
  }

  // Get criteria: use phase criteria if phaseId provided, otherwise event-level
  let criteria: any[];
  if (phaseId) {
    criteria = await prisma.phaseCriteria.findMany({
      where: { phaseId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } else {
    criteria = await prisma.evaluationCriteria.findMany({
      where: { eventId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  // Check for existing evaluation by this judge
  const existingEval = await prisma.evaluation.findFirst({
    where: {
      evaluatorId: userId,
      teamId,
      type: "JUDGE_MANUAL",
    },
    select: {
      scores: true,
      totalScore: true,
      feedback: true,
      feedbackAr: true,
      strengths: true,
      weaknesses: true,
    },
  });

  // Build deliverables from team fields + submissions
  const latestSub = team.submissions[0];
  const subMeta = (latestSub?.metadata as any) || {};

  const deliverables = {
    projectTitle: team.projectTitle || team.projectTitleAr || null,
    projectDescription: team.projectDescription || team.projectDescriptionAr || null,
    repositoryUrl: team.repositoryUrl || latestSub?.repositoryUrl || null,
    presentationUrl: team.presentationUrl || subMeta.presentationUrl || null,
    demoUrl: team.demoUrl || subMeta.demoUrl || null,
    miroBoard: team.miroBoard || subMeta.miroUrl || null,
    oneDriveUrl: subMeta.oneDriveUrl || null,
    fileUrl: latestSub?.fileUrl || null,
    submissionContent: latestSub?.content || null,
  };

  // Fetch deliverable config for the phase (if provided)
  let deliverableConfig = null;
  if (phaseId) {
    const phaseData = await prisma.eventPhase.findUnique({
      where: { id: phaseId },
      select: { deliverableConfig: true },
    });
    deliverableConfig = phaseData?.deliverableConfig || null;
  }

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      nameAr: team.nameAr,
      trackNameAr: team.track?.nameAr || null,
      trackColor: team.track?.color || null,
      memberCount: team.members.length,
      members: team.members.map(m => ({
        name: `${m.user.firstNameAr || m.user.firstName} ${m.user.lastNameAr || m.user.lastName}`.trim(),
        role: m.role,
      })),
    },
    criteria,
    existingEvaluation: existingEval || null,
    deliverables,
    deliverableConfig,
    phaseId: phaseId || null,
  });
}
