import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organization: { select: { id: true, name: true, nameAr: true, logo: true } },
      tracks: { orderBy: { sortOrder: "asc" } },
      phases: { orderBy: { phaseNumber: "asc" } },
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true },
          },
        },
      },
      teams: {
        include: {
          members: {
            include: {
              user: { select: { id: true, firstNameAr: true, lastNameAr: true, email: true } },
            },
          },
          track: { select: { id: true, nameAr: true, color: true } },
        },
      },
      evaluationCriteria: { orderBy: { sortOrder: "asc" } },
      challenges: {
        include: { questions: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { members: true, teams: true, submissions: true, certificates: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.visibility !== undefined && { visibility: body.visibility }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.registrationStart !== undefined && { registrationStart: body.registrationStart ? new Date(body.registrationStart) : null }),
      ...(body.registrationEnd !== undefined && { registrationEnd: body.registrationEnd ? new Date(body.registrationEnd) : null }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.locationAr !== undefined && { locationAr: body.locationAr }),
      ...(body.isOnline !== undefined && { isOnline: body.isOnline }),
      ...(body.onlineLink !== undefined && { onlineLink: body.onlineLink }),
      ...(body.maxParticipants !== undefined && { maxParticipants: body.maxParticipants }),
      ...(body.registrationMode !== undefined && { registrationMode: body.registrationMode }),
      ...(body.minTeamSize !== undefined && { minTeamSize: body.minTeamSize }),
      ...(body.maxTeamSize !== undefined && { maxTeamSize: body.maxTeamSize }),
      ...(body.hasPhases !== undefined && { hasPhases: body.hasPhases }),
      ...(body.hasElimination !== undefined && { hasElimination: body.hasElimination }),
      ...(body.totalPhases !== undefined && { totalPhases: body.totalPhases }),
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.secondaryColor !== undefined && { secondaryColor: body.secondaryColor }),
      ...(body.aiEvaluationEnabled !== undefined && { aiEvaluationEnabled: body.aiEvaluationEnabled }),
      ...(body.questionSource !== undefined && { questionSource: body.questionSource }),
      ...(body.rules !== undefined && { rules: body.rules }),
      ...(body.rulesAr !== undefined && { rulesAr: body.rulesAr }),
      ...(body.prizes !== undefined && { prizes: body.prizes }),
      ...(body.status === "PUBLISHED" && !existing.publishedAt && { publishedAt: new Date() }),
    },
    include: {
      organization: { select: { name: true, nameAr: true } },
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  await prisma.event.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
