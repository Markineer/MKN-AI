import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch team info + criteria + existing evaluation for judge
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { eventId, teamId } = params;

  // Verify judge membership
  const judgeMember = await prisma.eventMember.findFirst({
    where: { eventId, userId, role: "JUDGE", status: "APPROVED" },
  });

  if (!judgeMember) {
    return NextResponse.json({ error: "أنت لست محكماً في هذه الفعالية" }, { status: 403 });
  }

  // Get team info
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
    },
  });

  if (!team) {
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });
  }

  // Get criteria
  const criteria = await prisma.evaluationCriteria.findMany({
    where: { eventId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

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
  });
}
