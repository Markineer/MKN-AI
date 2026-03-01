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
    nameAr: body.nameAr,
    trackId: body.trackId,
    members: body.members, // [{ userId, fullName, personalEmail, universityEmail, studentId, college, major, techLink, role, memberRole }]
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
