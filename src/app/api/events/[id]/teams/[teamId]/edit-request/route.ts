import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendTeamEditRequestEmail } from "@/lib/mail";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; teamId: string } }
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

  const { id: eventId, teamId } = params;

  // Fetch team with members and event
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      event: { select: { id: true, titleAr: true, title: true } },
      track: { select: { id: true, name: true, nameAr: true } },
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
            },
          },
        },
      },
    },
  });

  if (!team || team.eventId !== eventId)
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });

  // Find the leader
  const leader = team.members.find((m) => m.role === "LEADER");
  if (!leader)
    return NextResponse.json(
      { error: "لا يوجد قائد لهذا الفريق" },
      { status: 400 }
    );

  // Check for existing pending/submitted request
  const existing = await prisma.teamEditRequest.findFirst({
    where: {
      teamId,
      status: { in: ["PENDING", "SUBMITTED"] },
    },
  });
  if (existing)
    return NextResponse.json(
      { error: "يوجد طلب تعديل معلق بالفعل لهذا الفريق" },
      { status: 409 }
    );

  // Generate token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Snapshot current data
  const originalData = {
    name: team.name,
    nameAr: team.nameAr,
    description: team.description,
    trackId: team.trackId,
    projectTitle: team.projectTitle,
    projectTitleAr: team.projectTitleAr,
    projectDescription: team.projectDescription,
    projectDescriptionAr: team.projectDescriptionAr,
    repositoryUrl: team.repositoryUrl,
    presentationUrl: team.presentationUrl,
    demoUrl: team.demoUrl,
    miroBoard: team.miroBoard,
    members: team.members.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      firstNameAr: m.user.firstNameAr,
      lastNameAr: m.user.lastNameAr,
      role: m.role,
    })),
  };

  // Create edit request
  const editRequest = await prisma.teamEditRequest.create({
    data: {
      teamId,
      eventId,
      leaderId: leader.user.id,
      requestedBy: (session.user as any).id,
      token,
      expiresAt,
      originalData,
    },
  });

  // Send email to leader
  let emailSent = false;
  try {
    await sendTeamEditRequestEmail({
      to: leader.user.email,
      teamNameAr: team.nameAr || team.name,
      eventNameAr: team.event.titleAr || team.event.title,
      adminNameAr: (session.user as any).nameAr || (session.user as any).name || "المشرف",
      token,
    });
    emailSent = true;
  } catch (err: any) {
    console.error("[edit-request] Email failed:", err.message);
  }

  return NextResponse.json(
    {
      editRequest: { id: editRequest.id, status: editRequest.status },
      emailSent,
      message: emailSent
        ? "تم إرسال طلب التعديل للقائد بنجاح"
        : "تم إنشاء طلب التعديل (لم يتم إرسال الإيميل)",
    },
    { status: 201 }
  );
}
