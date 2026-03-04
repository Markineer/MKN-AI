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
  const { memberId, trackIds } = body;
  // Backward compat
  const resolvedTrackIds: string[] = trackIds && Array.isArray(trackIds)
    ? trackIds
    : body.trackId !== undefined ? (body.trackId ? [body.trackId] : []) : [];

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  const member = await prisma.eventMember.update({
    where: { id: memberId },
    data: {
      trackId: resolvedTrackIds[0] || null,
      trackIds: resolvedTrackIds,
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
