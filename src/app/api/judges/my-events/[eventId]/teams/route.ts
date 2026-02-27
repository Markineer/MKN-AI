import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch teams assigned to the current judge for an event
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const eventId = params.eventId;

  // Find judge membership
  const judgeMember = await prisma.eventMember.findFirst({
    where: { eventId, userId, role: "JUDGE", status: "APPROVED" },
  });

  if (!judgeMember) {
    return NextResponse.json({ error: "أنت لست محكماً في هذه الفعالية" }, { status: 403 });
  }

  // Get event info
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, titleAr: true },
  });

  // Get judge assignments
  const assignments = await prisma.judgeAssignment.findMany({
    where: { eventId, judgeId: judgeMember.id },
    select: { teamId: true, status: true },
  });

  // Only show formally assigned teams — no fallback to all teams
  const teamIds = assignments.map(a => a.teamId);

  if (teamIds.length === 0) {
    return NextResponse.json({
      teams: [],
      eventName: event?.title || "",
      eventNameAr: event?.titleAr || "",
      message: "لم يتم تعيين فرق لك بعد. سيتم إشعارك عند التعيين.",
    });
  }

  // Fetch full team data
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
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

  // Fetch existing evaluations by this judge
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatorId: userId,
      teamId: { in: teamIds },
      type: "JUDGE_MANUAL",
    },
    select: { teamId: true, totalScore: true, evaluatedAt: true },
  });

  const evalMap: Record<string, { totalScore: number; evaluatedAt: Date }> = {};
  for (const ev of evaluations) {
    if (ev.teamId) evalMap[ev.teamId] = { totalScore: ev.totalScore, evaluatedAt: ev.evaluatedAt };
  }

  // Build assignment status map
  const assignmentMap: Record<string, string> = {};
  for (const a of assignments) {
    assignmentMap[a.teamId] = a.status;
  }

  const result = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    teamNameAr: team.nameAr,
    teamCode: team.name,
    trackNameAr: team.track?.nameAr || null,
    trackColor: team.track?.color || null,
    memberCount: team.members.length,
    members: team.members.map(m => ({
      name: `${m.user.firstNameAr || m.user.firstName} ${m.user.lastNameAr || m.user.lastName}`.trim(),
      role: m.role,
    })),
    status: evalMap[team.id] ? "COMPLETED" as const : (assignmentMap[team.id] || "PENDING") as "PENDING" | "IN_PROGRESS" | "COMPLETED",
    evaluation: evalMap[team.id] ? {
      totalScore: evalMap[team.id].totalScore,
      evaluatedAt: evalMap[team.id].evaluatedAt.toISOString(),
    } : null,
  }));

  return NextResponse.json({
    teams: result,
    eventName: event?.title || "",
    eventNameAr: event?.titleAr || "",
  });
}
