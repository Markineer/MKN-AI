import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: {
      organization: { select: { id: true, nameAr: true, name: true, type: true } },
    },
  });

  if (!invitation) return NextResponse.json({ error: "الدعوة غير موجودة" }, { status: 404 });
  if (invitation.acceptedAt) return NextResponse.json({ error: "تم قبول هذه الدعوة مسبقاً", accepted: true }, { status: 400 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "انتهت صلاحية الدعوة" }, { status: 410 });

  // Get department name if applicable
  let deptNameAr: string | null = null;
  if (invitation.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: invitation.departmentId },
      select: { nameAr: true },
    });
    deptNameAr = dept?.nameAr || null;
  }

  return NextResponse.json({
    email: invitation.email,
    orgNameAr: invitation.organization.nameAr,
    role: invitation.role,
    deptNameAr,
    titleAr: invitation.titleAr,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password, firstNameAr, lastNameAr } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "التوكن وكلمة المرور مطلوبان" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, nameAr: true } } },
  });

  if (!invitation) return NextResponse.json({ error: "الدعوة غير موجودة" }, { status: 404 });
  if (invitation.acceptedAt) return NextResponse.json({ error: "تم قبول هذه الدعوة مسبقاً" }, { status: 400 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "انتهت صلاحية الدعوة" }, { status: 410 });

  const hashedPassword = await bcrypt.hash(password, 12);

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email: invitation.email } });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        firstNameAr: firstNameAr || "",
        lastNameAr: lastNameAr || "",
        firstName: firstNameAr || "",
        lastName: lastNameAr || "",
        isActive: true,
        isVerified: true,
      },
    });
  } else {
    // Update existing user's password if they accept the invite
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, isActive: true, isVerified: true },
    });
  }

  // Add as organization member
  const existingMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
  });

  if (!existingMember) {
    await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
        departmentId: invitation.departmentId,
        titleAr: invitation.titleAr,
      },
    });
  }

  // Mark invitation as accepted
  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.json({
    message: "تم قبول الدعوة بنجاح! يمكنك الآن تسجيل الدخول.",
    email: invitation.email,
  });
}
