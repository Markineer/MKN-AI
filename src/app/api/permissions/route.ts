import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const module = searchParams.get("module") || "";

  const where: any = {};
  if (module) where.module = module;

  const permissions = await prisma.permission.findMany({
    where,
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });

  // Group by module
  const grouped = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<string, typeof permissions>
  );

  return NextResponse.json({ permissions, grouped });
}
