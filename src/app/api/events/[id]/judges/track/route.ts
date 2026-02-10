import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { memberId, trackId } = body;

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  const member = await prisma.eventMember.update({
    where: { id: memberId },
    data: { trackId: trackId || null },
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
      track: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          color: true,
        },
      },
    },
  });

  return NextResponse.json(member);
}
