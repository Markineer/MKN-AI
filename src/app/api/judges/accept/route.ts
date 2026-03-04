import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: validate token and return invitation info
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });

  const invitation = await prisma.judgeInvitation.findUnique({
    where: { token },
    include: {
      event: { select: { id: true, title: true, titleAr: true } },
      track: { select: { id: true, name: true, nameAr: true, color: true } },
    },
  });

  if (!invitation) return NextResponse.json({ error: "الدعوة غير موجودة" }, { status: 404 });
  if (invitation.acceptedAt) return NextResponse.json({ error: "تم قبول هذه الدعوة مسبقاً", accepted: true }, { status: 400 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "انتهت صلاحية الدعوة" }, { status: 410 });

  return NextResponse.json({
    email: invitation.email,
    eventNameAr: invitation.event.titleAr || invitation.event.title,
    trackNameAr: invitation.track?.nameAr || null,
    trackColor: invitation.track?.color || null,
  });
}

// POST: accept invitation, create user + judge membership
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password, firstNameAr, lastNameAr } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "التوكن وكلمة المرور مطلوبان" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  const invitation = await prisma.judgeInvitation.findUnique({
    where: { token },
    include: {
      event: { select: { id: true, titleAr: true } },
    },
  });

  if (!invitation) return NextResponse.json({ error: "الدعوة غير موجودة" }, { status: 404 });
  if (invitation.acceptedAt) return NextResponse.json({ error: "تم قبول هذه الدعوة مسبقاً" }, { status: 400 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "انتهت صلاحية الدعوة" }, { status: 410 });

  const hashedPassword = await bcrypt.hash(password, 12);

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email: invitation.email } });

  if (!user) {
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
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, isActive: true, isVerified: true },
    });
  }

  // Assign judge platform role (create role if it doesn't exist)
  const judgeRole = await prisma.platformRole.upsert({
    where: { name: "judge" },
    update: {},
    create: {
      name: "judge",
      nameAr: "محكّم",
      description: "Judge role for event evaluation",
      descriptionAr: "دور المحكّم لتقييم الفعاليات",
      level: "JUDGE",
      isSystem: true,
    },
  });
  await prisma.userPlatformRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: judgeRole.id } },
    update: {},
    create: { userId: user.id, roleId: judgeRole.id },
  });

  // Add as event JUDGE member
  const existingMember = await prisma.eventMember.findFirst({
    where: { eventId: invitation.eventId, userId: user.id, role: "JUDGE" },
  });

  if (!existingMember) {
    await prisma.eventMember.create({
      data: {
        eventId: invitation.eventId,
        userId: user.id,
        role: "JUDGE",
        status: "APPROVED",
        trackId: invitation.trackId,
        trackIds: invitation.trackIds || (invitation.trackId ? [invitation.trackId] : []),
        approvedAt: new Date(),
      },
    });
  }

  // Mark invitation as accepted
  await prisma.judgeInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.json({
    message: "تم قبول الدعوة بنجاح! يمكنك الآن تسجيل الدخول.",
    email: invitation.email,
  });
}
