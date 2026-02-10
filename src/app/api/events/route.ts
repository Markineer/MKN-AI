import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { canUser } from "@/lib/permissions";
import { generateSlug } from "@/lib/utils";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const organizationId = searchParams.get("organizationId") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { titleAr: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (status) where.status = status;
  if (organizationId) where.organizationId = organizationId;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        organization: { select: { name: true, nameAr: true, logo: true } },
        _count: {
          select: { members: true, tracks: true, teams: true, submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({
    events,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const sp = (session.user as any).permissions || [];
  const canCreate = await canUser(session.user.id, "events.create", {
    organizationId: body.organizationId,
    sessionPermissions: sp,
  });
  if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const slug = generateSlug(body.title) + "-" + Date.now().toString(36);

  const event = await prisma.event.create({
    data: {
      organizationId: body.organizationId,
      title: body.title,
      titleAr: body.titleAr,
      slug,
      type: body.type,
      category: body.category || "GENERAL",
      status: body.status || "DRAFT",
      visibility: body.visibility || "PUBLIC",
      description: body.description,
      descriptionAr: body.descriptionAr,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      registrationStart: body.registrationStart ? new Date(body.registrationStart) : null,
      registrationEnd: body.registrationEnd ? new Date(body.registrationEnd) : null,
      location: body.location || null,
      locationAr: body.locationAr || null,
      isOnline: body.isOnline ?? false,
      maxParticipants: body.maxParticipants ?? null,
      registrationMode: body.registrationMode || "INDIVIDUAL",
      minTeamSize: body.minTeamSize ?? null,
      maxTeamSize: body.maxTeamSize ?? null,
      allowIndividual: body.allowIndividual ?? true,
      hasPhases: body.hasPhases ?? false,
      hasElimination: body.hasElimination ?? false,
      totalPhases: body.totalPhases ?? 1,
      aiEvaluationEnabled: body.aiEvaluationEnabled ?? false,
      questionSource: body.questionSource || "MANUAL",
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      members: {
        create: {
          userId: session.user.id,
          role: "ORGANIZER",
          status: "APPROVED",
        },
      },
    },
  });

  // Create evaluation criteria if provided
  if (Array.isArray(body.criteria) && body.criteria.length > 0) {
    await prisma.evaluationCriteria.createMany({
      data: body.criteria.map((c: { name: string; maxScore: number }, idx: number) => ({
        eventId: event.id,
        name: c.name,
        nameAr: c.name,
        maxScore: c.maxScore || 10,
        weight: 1.0,
        sortOrder: idx,
      })),
    });
  }

  // Create phases + phase criteria if provided
  if (Array.isArray(body.phases) && body.phases.length > 0) {
    const evStart = new Date(body.startDate).getTime();
    const evEnd = new Date(body.endDate).getTime();
    const phaseDuration = (evEnd - evStart) / body.phases.length;

    for (const [idx, p] of body.phases.entries()) {
      const phaseStart = new Date(evStart + phaseDuration * idx);
      const phaseEnd = new Date(evStart + phaseDuration * (idx + 1));

      const phase = await prisma.eventPhase.create({
        data: {
          eventId: event.id,
          name: p.name,
          nameAr: p.nameAr || p.name,
          phaseNumber: p.phaseNumber || idx + 1,
          phaseType: p.phaseType || "GENERAL",
          startDate: phaseStart,
          endDate: phaseEnd,
          isElimination: p.isElimination ?? false,
          passThreshold: p.passThreshold ?? null,
          maxAdvancing: p.maxAdvancing ?? null,
          advancePercent: p.advancePercent ?? null,
        },
      });

      // Create phase criteria
      if (Array.isArray(p.criteria) && p.criteria.length > 0) {
        await prisma.phaseCriteria.createMany({
          data: p.criteria.map((c: { name: string; maxScore: number }, ci: number) => ({
            phaseId: phase.id,
            name: c.name,
            nameAr: c.name,
            maxScore: c.maxScore || 10,
            weight: 1.0,
            sortOrder: ci,
          })),
        });
      }
    }
  }

  return NextResponse.json(event, { status: 201 });
}
