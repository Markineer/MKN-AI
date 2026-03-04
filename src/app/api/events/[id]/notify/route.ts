import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendCustomPhaseNotification } from "@/lib/mail";

/**
 * GET: Fetch event data needed for the communications page
 *  - phases with results summary
 *  - teams with member counts
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get event info
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, titleAr: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });

  // Get phases with result counts
  const phases = await prisma.eventPhase.findMany({
    where: { eventId: params.id },
    select: {
      id: true,
      nameAr: true,
      name: true,
      phaseNumber: true,
      status: true,
      isElimination: true,
      _count: {
        select: { results: true },
      },
    },
    orderBy: { phaseNumber: "asc" },
  });

  // Get result stats per phase
  const phasesWithStats = await Promise.all(
    phases.map(async (p) => {
      const advanced = await prisma.phaseResult.count({
        where: { phaseId: p.id, status: "ADVANCED" },
      });
      const eliminated = await prisma.phaseResult.count({
        where: { phaseId: p.id, status: "ELIMINATED" },
      });
      // Count unique teams in this phase (teams that participated)
      const phaseTeams = await prisma.phaseResult.findMany({
        where: { phaseId: p.id, teamId: { not: null } },
        select: { teamId: true },
        distinct: ["teamId"],
      });
      return {
        ...p,
        advanced,
        eliminated,
        totalTeams: phaseTeams.length,
      };
    })
  );

  // Get all event teams
  const teams = await prisma.team.findMany({
    where: { eventId: params.id },
    select: {
      id: true,
      name: true,
      nameAr: true,
      track: { select: { nameAr: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { nameAr: "asc" },
  });

  return NextResponse.json({
    event,
    phases: phasesWithStats,
    teams,
  });
}

/**
 * POST: Send notifications
 * Body: {
 *   phaseId?: string           - Target phase (optional for event-wide)
 *   recipients: "ALL" | "ADVANCED" | "ELIMINATED" | "SPECIFIC"
 *   teamIds?: string[]         - When recipients = "SPECIFIC"
 *   messageType: "ACCEPTANCE" | "REJECTION" | "CUSTOM"
 *   message: string            - Email message body
 *   acceptanceDate?: string    - Optional date
 *   imageUrl?: string          - Optional image
 *   subject?: string           - Optional custom subject
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { phaseId, recipients, teamIds, messageType, message, acceptanceDate, imageUrl } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
  }

  // Get event info
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, titleAr: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });

  // Get phase info (if specified)
  let phaseName = "";
  if (phaseId) {
    const phase = await prisma.eventPhase.findUnique({
      where: { id: phaseId },
      select: { nameAr: true, name: true },
    });
    if (!phase) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
    phaseName = phase.nameAr || phase.name;
  }

  // Determine target teams
  let targetTeamIds: string[] = [];
  const teamStatusMap = new Map<string, string>();

  if (recipients === "SPECIFIC" && teamIds?.length) {
    // Send to specific teams
    targetTeamIds = teamIds;
    teamIds.forEach((id: string) => teamStatusMap.set(id, messageType === "REJECTION" ? "ELIMINATED" : "ADVANCED"));
  } else if (phaseId && (recipients === "ADVANCED" || recipients === "ELIMINATED")) {
    // Send to teams based on phase results
    const targetStatuses = recipients === "ADVANCED" ? ["ADVANCED"] : ["ELIMINATED"];
    const results = await prisma.phaseResult.findMany({
      where: {
        phaseId,
        status: { in: targetStatuses as any },
        teamId: { not: null },
      },
      select: { teamId: true, status: true },
      distinct: ["teamId"],
    });
    targetTeamIds = results.map((r) => r.teamId!);
    results.forEach((r) => teamStatusMap.set(r.teamId!, r.status));
  } else if (recipients === "ALL") {
    if (phaseId) {
      // All teams in the phase
      const results = await prisma.phaseResult.findMany({
        where: { phaseId, teamId: { not: null } },
        select: { teamId: true, status: true },
        distinct: ["teamId"],
      });
      if (results.length > 0) {
        targetTeamIds = results.map((r) => r.teamId!);
        results.forEach((r) => teamStatusMap.set(r.teamId!, r.status));
      } else {
        // No results yet, get all event teams
        const allTeams = await prisma.team.findMany({
          where: { eventId: params.id },
          select: { id: true },
        });
        targetTeamIds = allTeams.map((t) => t.id);
        allTeams.forEach((t) => teamStatusMap.set(t.id, "ADVANCED"));
      }
    } else {
      // All event teams
      const allTeams = await prisma.team.findMany({
        where: { eventId: params.id },
        select: { id: true },
      });
      targetTeamIds = allTeams.map((t) => t.id);
      allTeams.forEach((t) => teamStatusMap.set(t.id, "ADVANCED"));
    }
  }

  if (targetTeamIds.length === 0) {
    return NextResponse.json({ error: "لا توجد فرق لإرسال الإشعار لها" }, { status: 400 });
  }

  // Get team members
  const teams = await prisma.team.findMany({
    where: { id: { in: targetTeamIds } },
    select: {
      id: true,
      name: true,
      nameAr: true,
      members: {
        where: { isActive: true },
        select: {
          user: { select: { email: true } },
        },
      },
    },
  });

  const eventName = event.titleAr || event.title;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const team of teams) {
    const teamName = team.nameAr || team.name;
    const status = teamStatusMap.get(team.id) || "ADVANCED";
    const isAdvanced = messageType === "REJECTION" ? false : status === "ADVANCED";
    const emails = team.members.map((m) => m.user.email).filter(Boolean);

    for (const email of emails) {
      try {
        await sendCustomPhaseNotification({
          to: email,
          teamName,
          eventName,
          phaseName: phaseName || eventName,
          message,
          acceptanceDate: acceptanceDate || null,
          imageUrl: imageUrl || null,
          isAdvanced,
        });
        sent++;
      } catch (err: any) {
        failed++;
        errors.push(`${email}: ${err.message}`);
        console.error(`[notify] Failed to send to ${email}:`, err.message);
      }
    }
  }

  return NextResponse.json({
    sent,
    failed,
    totalTeams: teams.length,
    totalEmails: sent + failed,
    errors: errors.slice(0, 5),
  });
}
