import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const where: any = { eventId: params.id };
  if (status) where.status = status;

  const editRequests = await prisma.teamEditRequest.findMany({
    where,
    include: {
      team: { select: { id: true, name: true, nameAr: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch leader info for each request
  const leaderIds = Array.from(new Set(editRequests.map((r) => r.leaderId)));
  const leaders = await prisma.user.findMany({
    where: { id: { in: leaderIds } },
    select: {
      id: true,
      email: true,
      firstNameAr: true,
      lastNameAr: true,
      firstName: true,
      lastName: true,
    },
  });
  const leaderMap = Object.fromEntries(leaders.map((l) => [l.id, l]));

  const result = editRequests.map((r) => ({
    ...r,
    leader: leaderMap[r.leaderId] || null,
  }));

  return NextResponse.json({ editRequests: result });
}
