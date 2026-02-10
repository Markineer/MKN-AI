import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const judges = await prisma.eventMember.findMany({
    where: { eventId: params.id, role: "JUDGE" },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ judges });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const member = await prisma.eventMember.create({
    data: {
      eventId: params.id,
      userId,
      role: "JUDGE",
      status: "APPROVED",
      assignedBy: session.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  await prisma.eventMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ success: true });
}
