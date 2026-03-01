import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = ((session.user as any).roles as string[]) || [];
  const isAdmin = roles.some((r) =>
    ["super_admin", "platform_admin", "organization_admin"].includes(r)
  );
  if (!isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const editRequest = await prisma.teamEditRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!editRequest || editRequest.eventId !== params.id)
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (editRequest.status !== "SUBMITTED")
    return NextResponse.json(
      { error: "هذا الطلب غير قابل للمراجعة في حالته الحالية" },
      { status: 400 }
    );

  const body = await req.json();
  const { action, reviewNote } = body;

  if (action !== "approve" && action !== "reject")
    return NextResponse.json(
      { error: "الإجراء يجب أن يكون approve أو reject" },
      { status: 400 }
    );

  const userId = (session.user as any).id;

  if (action === "reject") {
    await prisma.teamEditRequest.update({
      where: { id: editRequest.id },
      data: {
        status: "REJECTED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });
    return NextResponse.json({ message: "تم رفض الطلب" });
  }

  // APPROVE — apply changes in a transaction
  const proposed = editRequest.proposedData as any;
  if (!proposed)
    return NextResponse.json(
      { error: "لا توجد تعديلات مقترحة" },
      { status: 400 }
    );

  // Re-validate track capacity
  if (proposed.trackId) {
    const original = editRequest.originalData as any;
    if (proposed.trackId !== original.trackId) {
      const targetTrack = await prisma.eventTrack.findUnique({
        where: { id: proposed.trackId },
        include: { _count: { select: { teams: true } } },
      });
      if (
        targetTrack?.maxTeams !== null &&
        targetTrack &&
        targetTrack._count.teams >= targetTrack.maxTeams!
      ) {
        return NextResponse.json(
          {
            error:
              "المسار المطلوب أصبح مكتمل العدد. يرجى رفض الطلب وإنشاء طلب جديد.",
          },
          { status: 409 }
        );
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    // Update team-level fields
    const teamUpdate: any = {};
    if (proposed.nameAr !== undefined) teamUpdate.nameAr = proposed.nameAr;
    if (proposed.trackId !== undefined) teamUpdate.trackId = proposed.trackId;

    if (Object.keys(teamUpdate).length > 0) {
      await tx.team.update({
        where: { id: editRequest.teamId },
        data: teamUpdate,
      });
    }

    // Update member registration fields
    if (Array.isArray(proposed.members)) {
      for (const member of proposed.members) {
        // Build bio string from registration fields
        const bioParts = [
          member.college ? `الكلية: ${member.college}` : null,
          member.major ? `التخصص: ${member.major}` : null,
          member.memberRole ? `الدور: ${member.memberRole}` : null,
          member.universityEmail ? `الإيميل الجامعي: ${member.universityEmail}` : null,
          member.studentId ? `الرقم الجامعي: ${member.studentId}` : null,
          member.techLink ? `الملف التقني: ${member.techLink}` : null,
        ].filter(Boolean);

        const userUpdate: any = {
          bio: bioParts.join(" | "),
        };

        // Update name from fullName
        if (member.fullName) {
          const nameParts = member.fullName.trim().split(/\s+/);
          userUpdate.firstNameAr = nameParts[0] || "";
          userUpdate.lastNameAr = nameParts.slice(1).join(" ") || "";
        }

        // Update email if changed
        if (member.personalEmail) {
          userUpdate.email = member.personalEmail;
        }

        // Update structured fields
        if (member.college) userUpdate.collegeAr = member.college;
        if (member.major) userUpdate.majorAr = member.major;
        if (member.studentId) userUpdate.nationalId = member.studentId;

        await tx.user.update({
          where: { id: member.userId },
          data: userUpdate,
        });
      }
    }

    // Mark request as approved
    await tx.teamEditRequest.update({
      where: { id: editRequest.id },
      data: {
        status: "APPROVED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });
  });

  return NextResponse.json({ message: "تمت الموافقة على التعديلات وتم تحديث بيانات الفريق" });
}
