import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch all events where current user is a judge
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Find all events where user is a JUDGE
  const memberships = await prisma.eventMember.findMany({
    where: { userId, role: "JUDGE", status: "APPROVED" },
    include: {
      event: {
        select: { id: true, title: true, titleAr: true },
      },
      track: {
        select: { id: true, nameAr: true, color: true },
      },
    },
  });

  // For each event, get assignment stats
  const events = await Promise.all(
    memberships.map(async (m) => {
      // Get assignments for this judge in this event
      const assignments = await prisma.judgeAssignment.findMany({
        where: { eventId: m.eventId, judgeId: m.id },
      });

      // Also count evaluations by this judge in this event
      const evaluations = await prisma.evaluation.count({
        where: {
          evaluatorId: userId,
          type: "JUDGE_MANUAL",
          submission: { eventId: m.eventId },
        },
      });

      // Only show formally assigned teams — no fallback
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter(a => a.status === "COMPLETED").length;

      return {
        eventId: m.eventId,
        eventTitle: m.event.title,
        eventTitleAr: m.event.titleAr,
        trackNameAr: m.track?.nameAr || null,
        trackColor: m.track?.color || null,
        totalAssignments,
        completedAssignments,
        pendingAssignments: Math.max(0, totalAssignments - completedAssignments),
      };
    })
  );

  return NextResponse.json({ events });
}
