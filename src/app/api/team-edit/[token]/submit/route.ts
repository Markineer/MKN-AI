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

  if (!body.nameAr?.trim())
    return NextResponse.json({ error: "اسم الفريق مطلوب" }, { status: 400 });

  if (!Array.isArray(body.members) || body.members.length === 0)
    return NextResponse.json({ error: "يجب أن يكون هناك عضو واحد على الأقل" }, { status: 400 });

  const proposedData = {
    nameAr: body.nameAr,
    members: body.members, // [{ userId, fullName, personalEmail, universityEmail, studentId, college, major, techLink, role, memberRole, isNew? }]
  };

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
