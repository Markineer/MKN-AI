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
  const original = editRequest.originalData as any;
  if (!proposed)
    return NextResponse.json(
      { error: "لا توجد تعديلات مقترحة" },
      { status: 400 }
    );

  await prisma.$transaction(async (tx) => {
    // Update team name if changed
    if (proposed.nameAr !== undefined && proposed.nameAr !== original.nameAr) {
      await tx.team.update({
        where: { id: editRequest.teamId },
        data: { nameAr: proposed.nameAr },
      });
    }

    if (Array.isArray(proposed.members)) {
      const originalMemberIds = new Set(
        (original.members || []).map((m: any) => m.userId)
      );
      const proposedMemberIds = new Set(
        proposed.members.map((m: any) => m.userId)
      );

      // Deactivate removed members
      for (const om of original.members || []) {
        if (!proposedMemberIds.has(om.userId)) {
          await tx.teamMember.updateMany({
            where: { teamId: editRequest.teamId, userId: om.userId },
            data: { isActive: false },
          });
        }
      }

      // Update existing members' registration data
      for (const member of proposed.members) {
        if (member.isNew || !originalMemberIds.has(member.userId)) continue;

        const bioParts = [
          member.college ? `الكلية: ${member.college}` : null,
          member.major ? `التخصص: ${member.major}` : null,
          member.memberRole ? `الدور: ${member.memberRole}` : null,
          member.universityEmail
            ? `الإيميل الجامعي: ${member.universityEmail}`
            : null,
          member.studentId ? `الرقم الجامعي: ${member.studentId}` : null,
          member.techLink ? `الملف التقني: ${member.techLink}` : null,
        ].filter(Boolean);

        const userUpdate: any = {
          bio: bioParts.join(" | "),
        };

        if (member.fullName) {
          const nameParts = member.fullName.trim().split(/\s+/);
          userUpdate.firstNameAr = nameParts[0] || "";
          userUpdate.lastNameAr = nameParts.slice(1).join(" ") || "";
        }

        if (member.personalEmail) {
          userUpdate.email = member.personalEmail;
        }

        if (member.college) userUpdate.collegeAr = member.college;
        if (member.major) userUpdate.majorAr = member.major;
        if (member.studentId) userUpdate.nationalId = member.studentId;

        await tx.user.update({
          where: { id: member.userId },
          data: userUpdate,
        });
      }

      // Add new members — create User + TeamMember records
      for (const member of proposed.members) {
        if (!member.isNew && originalMemberIds.has(member.userId)) continue;

        const bioParts = [
          member.college ? `الكلية: ${member.college}` : null,
          member.major ? `التخصص: ${member.major}` : null,
          member.memberRole ? `الدور: ${member.memberRole}` : null,
          member.universityEmail
            ? `الإيميل الجامعي: ${member.universityEmail}`
            : null,
          member.studentId ? `الرقم الجامعي: ${member.studentId}` : null,
          member.techLink ? `الملف التقني: ${member.techLink}` : null,
        ].filter(Boolean);

        const nameParts = (member.fullName || "").trim().split(/\s+/);

        // Create or find user by email
        let user;
        if (member.personalEmail) {
          user = await tx.user.findUnique({
            where: { email: member.personalEmail },
          });
        }

        if (!user) {
          user = await tx.user.create({
            data: {
              email: member.personalEmail || `new_${Date.now()}@temp.local`,
              password: "",
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              firstNameAr: nameParts[0] || "",
              lastNameAr: nameParts.slice(1).join(" ") || "",
              bio: bioParts.join(" | "),
              collegeAr: member.college || null,
              majorAr: member.major || null,
              nationalId: member.studentId || null,
            },
          });
        }

        // Add as team member
        await tx.teamMember.upsert({
          where: {
            teamId_userId: {
              teamId: editRequest.teamId,
              userId: user.id,
            },
          },
          update: { isActive: true, role: "MEMBER" },
          create: {
            teamId: editRequest.teamId,
            userId: user.id,
            role: "MEMBER",
          },
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

  return NextResponse.json({
    message: "تمت الموافقة على التعديلات وتم تحديث بيانات الفريق",
  });
}
