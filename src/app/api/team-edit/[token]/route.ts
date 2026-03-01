import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Parse bio string to extract university_email and tech_link
function parseBio(bio: string | null): { universityEmail: string; studentId: string; college: string; major: string; techLink: string; role: string } {
  if (!bio) return { universityEmail: "", studentId: "", college: "", major: "", techLink: "", role: "" };
  const get = (label: string) => {
    const match = bio.match(new RegExp(`${label}:\\s*([^|]+)`));
    return match ? match[1].trim() : "";
  };
  return {
    universityEmail: get("الإيميل الجامعي"),
    studentId: get("الرقم الجامعي"),
    college: get("الكلية"),
    major: get("التخصص"),
    techLink: get("الملف التقني"),
    role: get("الدور"),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const editRequest = await prisma.teamEditRequest.findUnique({
    where: { token: params.token },
  });

  if (!editRequest)
    return NextResponse.json({ error: "رابط غير صالح" }, { status: 404 });

  if (editRequest.expiresAt < new Date()) {
    await prisma.teamEditRequest.update({
      where: { id: editRequest.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "انتهت صلاحية الرابط" }, { status: 410 });
  }

  if (editRequest.status !== "PENDING")
    return NextResponse.json(
      { error: "تم استخدام هذا الرابط مسبقاً", status: editRequest.status },
      { status: 410 }
    );

  const team = await prisma.team.findUnique({
    where: { id: editRequest.teamId },
    include: {
      event: {
        select: { id: true, title: true, titleAr: true, minTeamSize: true, maxTeamSize: true },
      },
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
              bio: true, bioAr: true,
            },
          },
        },
      },
    },
  });

  if (!team)
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });

  // Build member data with registration fields
  const members = team.members.map((m) => {
    const bioData = parseBio(m.user.bio);
    return {
      userId: m.user.id,
      role: m.role,
      fullName: m.user.firstNameAr
        ? `${m.user.firstNameAr} ${m.user.lastNameAr || ""}`.trim()
        : `${m.user.firstName} ${m.user.lastName || ""}`.trim(),
      personalEmail: m.user.email,
      universityEmail: bioData.universityEmail,
      studentId: m.user.nationalId || bioData.studentId,
      college: m.user.collegeAr || m.user.college || bioData.college,
      major: m.user.majorAr || m.user.major || bioData.major,
      techLink: bioData.techLink,
      memberRole: bioData.role,
    };
  });

  return NextResponse.json({
    team: {
      id: team.id,
      nameAr: team.nameAr || team.name,
      members,
    },
    event: team.event,
  });
}
