import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/mail";

const roleLabels: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مدير المؤسسة",
  DEPARTMENT_HEAD: "رئيس قسم",
  COORDINATOR: "منسق",
  MEMBER: "عضو",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, organizationId, role, departmentId, titleAr } = body;

  if (!email?.trim() || !organizationId) {
    return NextResponse.json({ error: "البريد الإلكتروني ومعرف المؤسسة مطلوبان" }, { status: 400 });
  }

  // Validate org exists
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, nameAr: true },
  });
  if (!org) return NextResponse.json({ error: "المؤسسة غير موجودة" }, { status: 404 });

  // Check if user already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: existingUser.id } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "المستخدم عضو بالفعل في هذه المؤسسة" }, { status: 409 });
    }
  }

  // Check for pending invitation
  const pendingInvite = await prisma.organizationInvitation.findFirst({
    where: { organizationId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pendingInvite) {
    return NextResponse.json({ error: "يوجد دعوة معلقة لهذا البريد الإلكتروني بالفعل" }, { status: 409 });
  }

  // Get department name if specified
  let deptNameAr: string | null = null;
  if (departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { nameAr: true },
    });
    deptNameAr = dept?.nameAr || null;
  }

  // Generate token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation
  const invitation = await prisma.organizationInvitation.create({
    data: {
      organizationId,
      email,
      role: role || "MEMBER",
      departmentId: departmentId || null,
      titleAr: titleAr || null,
      invitedBy: (session.user as any).id || null,
      token,
      expiresAt,
    },
  });

  // Build role title
  let roleTitleAr = roleLabels[role || "MEMBER"] || "عضو";
  if (deptNameAr && role === "DEPARTMENT_HEAD") {
    roleTitleAr = `رئيس قسم ${deptNameAr}`;
  } else if (deptNameAr) {
    roleTitleAr = `${roleTitleAr} في قسم ${deptNameAr}`;
  }

  // Send email
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitation/accept?token=${token}`;
  let emailSent = false;

  try {
    await sendInvitationEmail({
      to: email,
      orgNameAr: org.nameAr,
      roleTitleAr,
      deptNameAr,
      inviterNameAr: (session.user as any).nameAr || (session.user as any).name || "المدير",
      token,
    });
    emailSent = true;
  } catch (err: any) {
    console.error("[invitation] Email failed:", err.message);
  }

  return NextResponse.json({
    invitation,
    message: emailSent
      ? "تم إرسال الدعوة بنجاح على البريد الإلكتروني"
      : "تم إنشاء الدعوة بنجاح",
    emailSent,
    acceptUrl,
  }, { status: 201 });
}
