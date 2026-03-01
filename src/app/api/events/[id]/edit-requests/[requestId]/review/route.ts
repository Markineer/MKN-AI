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
    // Update team fields
    await tx.team.update({
      where: { id: editRequest.teamId },
      data: {
        name: proposed.name,
        nameAr: proposed.nameAr,
        description: proposed.description,
        trackId: proposed.trackId,
        projectTitle: proposed.projectTitle,
        projectTitleAr: proposed.projectTitleAr,
        projectDescription: proposed.projectDescription,
        projectDescriptionAr: proposed.projectDescriptionAr,
        repositoryUrl: proposed.repositoryUrl,
        presentationUrl: proposed.presentationUrl,
        demoUrl: proposed.demoUrl,
        miroBoard: proposed.miroBoard,
      },
    });

    // Sync members
    if (Array.isArray(proposed.members)) {
      const currentMembers = await tx.teamMember.findMany({
        where: { teamId: editRequest.teamId, isActive: true },
        select: { userId: true, role: true },
      });

      const proposedMemberIds = new Set(
        proposed.members.map((m: any) => m.userId)
      );
      const currentMemberIds = new Set(currentMembers.map((m) => m.userId));

      // Deactivate removed members
      const toRemove = currentMembers.filter(
        (m) => !proposedMemberIds.has(m.userId)
      );
      for (const member of toRemove) {
        await tx.teamMember.updateMany({
          where: { teamId: editRequest.teamId, userId: member.userId },
          data: { isActive: false },
        });
      }

      // Add new members
      const toAdd = proposed.members.filter(
        (m: any) => !currentMemberIds.has(m.userId)
      );
      for (const member of toAdd) {
        await tx.teamMember.upsert({
          where: {
            teamId_userId: {
              teamId: editRequest.teamId,
              userId: member.userId,
            },
          },
          update: { isActive: true, role: member.role || "MEMBER" },
          create: {
            teamId: editRequest.teamId,
            userId: member.userId,
            role: member.role || "MEMBER",
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

  return NextResponse.json({ message: "تمت الموافقة على التعديلات وتم تحديث بيانات الفريق" });
}
