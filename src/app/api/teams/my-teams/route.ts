import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch all teams for the current user with active phases
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const memberships = await prisma.teamMember.findMany({
    where: { userId, isActive: true },
    include: {
      team: {
        include: {
          event: {
            select: {
              id: true, title: true, titleAr: true,
              phases: {
                where: { isActive: true },
                orderBy: { phaseNumber: "asc" },
                select: {
                  id: true, nameAr: true, name: true, status: true,
                  endDate: true, deliverableConfig: true,
                },
              },
            },
          },
          track: { select: { nameAr: true, name: true, color: true } },
          members: { where: { isActive: true }, select: { id: true } },
        },
      },
    },
  });

  const teams = memberships.map((m) => ({
    teamId: m.team.id,
    teamName: m.team.nameAr || m.team.name,
    eventId: m.team.event.id,
    eventName: m.team.event.titleAr || m.team.event.title,
    trackName: m.team.track?.nameAr || m.team.track?.name || null,
    trackColor: m.team.track?.color || null,
    memberCount: m.team.members.length,
    phases: m.team.event.phases.map((p) => ({
      id: p.id,
      nameAr: p.nameAr || p.name,
      status: p.status,
      endDate: p.endDate,
      hasDeliverableConfig: !!(p.deliverableConfig as any)?.fields?.some((f: any) => f.enabled),
    })),
  }));

  return NextResponse.json({ teams });
}
