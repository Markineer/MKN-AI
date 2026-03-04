import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendJudgeInvitationEmail } from "@/lib/mail";

// GET: list pending invitations for this event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invitations = await prisma.judgeInvitation.findMany({
    where: { eventId: params.id },
    include: {
      track: { select: { id: true, name: true, nameAr: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invitations });
}

// POST: create a new judge invitation and send email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, trackIds } = body;
  // Backward compat: accept old `trackId` as single-element array
  const resolvedTrackIds: string[] = trackIds && Array.isArray(trackIds) && trackIds.length > 0
    ? trackIds
    : body.trackId ? [body.trackId] : [];

  if (!email?.trim()) {
    return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
  }

  // Check event exists
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, titleAr: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });

  // Check if already a judge in this event
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingJudge = await prisma.eventMember.findFirst({
      where: { eventId: params.id, userId: existingUser.id, role: "JUDGE" },
    });
    if (existingJudge) {
      return NextResponse.json({ error: "هذا المستخدم محكم بالفعل في هذه الفعالية" }, { status: 409 });
    }
  }

  // Check for pending invitation
  const pendingInvite = await prisma.judgeInvitation.findFirst({
    where: { eventId: params.id, email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pendingInvite) {
    return NextResponse.json({ error: "يوجد دعوة معلقة لهذا البريد الإلكتروني بالفعل" }, { status: 409 });
  }

  // Get track names for email
  let trackNameAr: string | null = null;
  if (resolvedTrackIds.length > 0) {
    const selectedTracks = await prisma.eventTrack.findMany({
      where: { id: { in: resolvedTrackIds } },
      select: { nameAr: true, name: true },
    });
    trackNameAr = selectedTracks.map(t => t.nameAr || t.name).join("، ");
  }

  // Generate token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation
  const invitation = await prisma.judgeInvitation.create({
    data: {
      eventId: params.id,
      email,
      trackId: resolvedTrackIds[0] || null,
      trackIds: resolvedTrackIds,
      invitedBy: (session.user as any).id || null,
      token,
      expiresAt,
    },
    include: {
      track: { select: { id: true, name: true, nameAr: true, color: true } },
    },
  });

  // Send email
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/judge/accept?token=${token}`;
  let emailSent = false;

  try {
    await sendJudgeInvitationEmail({
      to: email,
      eventNameAr: event.titleAr || event.title,
      trackNameAr,
      inviterNameAr: (session.user as any).nameAr || (session.user as any).name || "المدير",
      token,
    });
    emailSent = true;
  } catch (err: any) {
    console.error("[judge-invite] Email failed:", err.message);
  }

  return NextResponse.json({
    invitation: { ...invitation, trackIds: resolvedTrackIds },
    message: emailSent
      ? "تم إرسال الدعوة بنجاح على البريد الإلكتروني"
      : "تم إنشاء الدعوة بنجاح (لم يتم إرسال البريد)",
    emailSent,
    acceptUrl,
  }, { status: 201 });
}

// DELETE: cancel/delete an invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
  }

  await prisma.judgeInvitation.delete({
    where: { id: invitationId },
  });

  return NextResponse.json({ success: true });
}
