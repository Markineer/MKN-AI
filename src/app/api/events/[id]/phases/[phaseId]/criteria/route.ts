import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: fetch phase criteria
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const criteria = await prisma.phaseCriteria.findMany({
    where: { phaseId: params.phaseId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(criteria);
}

// POST: create a phase criterion
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const body = await req.json();
  const { name, nameAr, description, descriptionAr, maxScore = 10, weight = 1.0 } = body;

  if (!nameAr) {
    return NextResponse.json({ error: "اسم المعيار مطلوب" }, { status: 400 });
  }

  // Auto sort order
  const last = await prisma.phaseCriteria.findFirst({
    where: { phaseId: params.phaseId },
    orderBy: { sortOrder: "desc" },
  });

  const criterion = await prisma.phaseCriteria.create({
    data: {
      phaseId: params.phaseId,
      name: name || nameAr,
      nameAr,
      description,
      descriptionAr,
      maxScore: parseFloat(String(maxScore)),
      weight: parseFloat(String(weight)),
      sortOrder: (last?.sortOrder || 0) + 1,
    },
  });

  return NextResponse.json(criterion, { status: 201 });
}

// PUT: update a phase criterion
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const body = await req.json();
  const { criteriaId, name, nameAr, description, descriptionAr, maxScore, weight, sortOrder } = body;

  if (!criteriaId) {
    return NextResponse.json({ error: "معرف المعيار مطلوب" }, { status: 400 });
  }

  const criterion = await prisma.phaseCriteria.update({
    where: { id: criteriaId },
    data: {
      ...(name !== undefined && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(description !== undefined && { description }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(maxScore !== undefined && { maxScore: parseFloat(String(maxScore)) }),
      ...(weight !== undefined && { weight: parseFloat(String(weight)) }),
      ...(sortOrder !== undefined && { sortOrder: parseInt(String(sortOrder)) }),
    },
  });

  return NextResponse.json(criterion);
}

// DELETE: deactivate/delete a phase criterion
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const criteriaId = req.nextUrl.searchParams.get("criteriaId");

  if (!criteriaId) {
    return NextResponse.json({ error: "معرف المعيار مطلوب" }, { status: 400 });
  }

  await prisma.phaseCriteria.delete({ where: { id: criteriaId } });

  return NextResponse.json({ success: true });
}
