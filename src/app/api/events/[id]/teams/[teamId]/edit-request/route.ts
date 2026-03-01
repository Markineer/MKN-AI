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
              id: true, email: true,
              firstName: true, firstNameAr: true,
              lastName: true, lastNameAr: true,
              nationalId: true, college: true, collegeAr: true,
              major: true, majorAr: true,
              bio: true,
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

  // Helper to parse bio fields
  const parseBio = (bio: string | null) => {
    if (!bio) return { universityEmail: "", studentId: "", college: "", major: "", techLink: "", role: "" };
    const get = (label: string) => { const m = bio.match(new RegExp(`${label}:\\s*([^|]+)`)); return m ? m[1].trim() : ""; };
    return { universityEmail: get("الإيميل الجامعي"), studentId: get("الرقم الجامعي"), college: get("الكلية"), major: get("التخصص"), techLink: get("الملف التقني"), role: get("الدور") };
  };

  // Snapshot current data (registration fields)
  const originalData = {
    nameAr: team.nameAr,
    trackId: team.trackId,
    members: team.members.map((m) => {
      const bio = parseBio(m.user.bio);
      return {
        userId: m.user.id,
        role: m.role,
        fullName: m.user.firstNameAr ? `${m.user.firstNameAr} ${m.user.lastNameAr || ""}`.trim() : `${m.user.firstName} ${m.user.lastName || ""}`.trim(),
        personalEmail: m.user.email,
        universityEmail: bio.universityEmail,
        studentId: m.user.nationalId || bio.studentId,
        college: m.user.collegeAr || m.user.college || bio.college,
        major: m.user.majorAr || m.user.major || bio.major,
        techLink: bio.techLink,
        memberRole: bio.role,
      };
    }),
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
