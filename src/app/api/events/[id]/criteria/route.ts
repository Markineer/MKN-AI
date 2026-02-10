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

  const criteria = await prisma.evaluationCriteria.findMany({
    where: { eventId: params.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(criteria);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const criterion = await prisma.evaluationCriteria.create({
    data: {
      eventId: params.id,
      name: body.name,
      nameAr: body.nameAr,
      description: body.description ?? null,
      descriptionAr: body.descriptionAr ?? null,
      maxScore: body.maxScore ?? 10,
      weight: body.weight ?? 1.0,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(criterion, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Criterion id is required" }, { status: 400 });
  }

  const existing = await prisma.evaluationCriteria.findFirst({
    where: { id: body.id, eventId: params.id },
  });
  if (!existing) return NextResponse.json({ error: "Criterion not found" }, { status: 404 });

  const criterion = await prisma.evaluationCriteria.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nameAr !== undefined && { nameAr: body.nameAr }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
      ...(body.maxScore !== undefined && { maxScore: body.maxScore }),
      ...(body.weight !== undefined && { weight: body.weight }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return NextResponse.json(criterion);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let criterionId = searchParams.get("id");

  if (!criterionId) {
    try {
      const body = await req.json();
      criterionId = body.id;
    } catch {
      // No body provided
    }
  }

  if (!criterionId) {
    return NextResponse.json({ error: "Criterion id is required" }, { status: 400 });
  }

  const existing = await prisma.evaluationCriteria.findFirst({
    where: { id: criterionId, eventId: params.id },
  });
  if (!existing) return NextResponse.json({ error: "Criterion not found" }, { status: 404 });

  await prisma.evaluationCriteria.delete({ where: { id: criterionId } });

  return NextResponse.json({ success: true });
}
