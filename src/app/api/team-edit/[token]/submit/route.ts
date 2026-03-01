import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const editRequest = await prisma.teamEditRequest.findUnique({
    where: { token: params.token },
  });

  if (!editRequest)
    return NextResponse.json({ error: "رابط غير صالح" }, { status: 404 });

  if (editRequest.expiresAt < new Date()) {
    await prisma.teamEditRequest.update({
      where: { id: editRequest.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "انتهت صلاحية الرابط" }, { status: 410 });
  }

  if (editRequest.status !== "PENDING")
    return NextResponse.json(
      { error: "تم استخدام هذا الرابط مسبقاً" },
      { status: 410 }
    );

  const body = await req.json();
  const proposedData = {
    name: body.name,
    nameAr: body.nameAr,
    description: body.description,
    trackId: body.trackId,
    projectTitle: body.projectTitle,
    projectTitleAr: body.projectTitleAr,
    projectDescription: body.projectDescription,
    projectDescriptionAr: body.projectDescriptionAr,
    repositoryUrl: body.repositoryUrl,
    presentationUrl: body.presentationUrl,
    demoUrl: body.demoUrl,
    miroBoard: body.miroBoard,
    members: body.members, // [{ userId, role }]
  };

  // Validate track capacity if track changed
  const originalData = editRequest.originalData as any;
  if (proposedData.trackId && proposedData.trackId !== originalData.trackId) {
    const targetTrack = await prisma.eventTrack.findUnique({
      where: { id: proposedData.trackId },
      include: { _count: { select: { teams: true } } },
    });

    if (!targetTrack)
      return NextResponse.json({ error: "المسار غير موجود" }, { status: 400 });

    if (targetTrack.maxTeams !== null) {
      // Don't count the current team if it was already in this track
      const adjustedCount =
        proposedData.trackId === originalData.trackId
          ? targetTrack._count.teams - 1
          : targetTrack._count.teams;
      if (adjustedCount >= targetTrack.maxTeams)
        return NextResponse.json(
          { error: "هذا المسار مكتمل العدد. يرجى اختيار مسار آخر." },
          { status: 409 }
        );
    }
  }

  // Validate team name uniqueness if changed
  if (proposedData.name && proposedData.name !== originalData.name) {
    const nameConflict = await prisma.team.findFirst({
      where: {
        eventId: editRequest.eventId,
        name: proposedData.name,
        id: { not: editRequest.teamId },
      },
    });
    if (nameConflict)
      return NextResponse.json(
        { error: "يوجد فريق آخر بنفس الاسم في هذه الفعالية" },
        { status: 409 }
      );
  }

  // Update the request
  await prisma.teamEditRequest.update({
    where: { id: editRequest.id },
    data: {
      proposedData,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: "تم إرسال التعديلات بنجاح. بانتظار موافقة المشرف.",
  });
}
