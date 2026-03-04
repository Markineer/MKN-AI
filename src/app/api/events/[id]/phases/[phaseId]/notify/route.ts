import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendCustomPhaseNotification } from "@/lib/mail";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message, acceptanceDate, imageUrl, sendToEliminated } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
  }

  // Get phase info
  const phase = await prisma.eventPhase.findUnique({
    where: { id: params.phaseId },
    select: { id: true, nameAr: true, name: true },
  });
  if (!phase) return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });

  // Get event info
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, titleAr: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });

  // Get phase results to find advanced/eliminated teams
  const targetStatuses = sendToEliminated ? ["ADVANCED", "ELIMINATED"] : ["ADVANCED"];
  const results = await prisma.phaseResult.findMany({
    where: {
      phaseId: params.phaseId,
      status: { in: targetStatuses as any },
      teamId: { not: null },
    },
    select: { teamId: true, status: true },
    distinct: ["teamId"],
  });

  if (results.length === 0) {
    return NextResponse.json(
      { error: "لا توجد فرق متأهلة لإرسال الإشعار لها" },
      { status: 400 }
    );
  }

  const teamIds = results.map((r) => r.teamId!);
  const teamStatusMap = new Map(results.map((r) => [r.teamId!, r.status]));

  // Get all team members with their emails
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true,
      name: true,
      nameAr: true,
      members: {
        where: { isActive: true },
        select: {
          user: {
            select: { email: true },
          },
        },
      },
    },
  });

  const phaseName = phase.nameAr || phase.name;
  const eventName = event.titleAr || event.title;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const team of teams) {
    const teamName = team.nameAr || team.name;
    const isAdvanced = teamStatusMap.get(team.id) === "ADVANCED";
    const emails = team.members.map((m) => m.user.email).filter(Boolean);

    for (const email of emails) {
      try {
        await sendCustomPhaseNotification({
          to: email,
          teamName,
          eventName,
          phaseName,
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
    errors: errors.slice(0, 5), // Return first 5 errors
  });
}
