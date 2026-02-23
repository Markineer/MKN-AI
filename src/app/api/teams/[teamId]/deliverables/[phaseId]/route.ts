import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: fetch phase config + team's current deliverables for this phase
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string; phaseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { teamId, phaseId } = params;

  // Verify user is an active team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId, isActive: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "أنت لست عضواً في هذا الفريق" }, { status: 403 });
  }

  // Get team with deliverable fields
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true, name: true, nameAr: true,
      projectTitle: true, projectTitleAr: true,
      projectDescription: true, projectDescriptionAr: true,
      repositoryUrl: true, presentationUrl: true, demoUrl: true, miroBoard: true,
      eventId: true,
    },
  });

  if (!team) {
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });
  }

  // Get phase with config
  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: {
      id: true, nameAr: true, name: true, status: true,
      startDate: true, endDate: true,
      deliverableConfig: true,
    },
  });

  if (!phase) {
    return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
  }

  // Get existing submission for this phase
  const submission = await prisma.submission.findFirst({
    where: {
      teamId,
      eventId: team.eventId,
      type: "TEAM",
      metadata: { path: ["phaseId"], equals: phaseId },
    },
    select: {
      id: true, content: true, fileUrl: true, repositoryUrl: true,
      metadata: true, status: true, submittedAt: true,
    },
  });

  const meta = (submission?.metadata as any) || {};

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.nameAr || team.name,
      projectTitle: team.projectTitle || team.projectTitleAr || "",
      projectDescription: team.projectDescription || team.projectDescriptionAr || "",
      repositoryUrl: team.repositoryUrl || "",
      presentationUrl: team.presentationUrl || "",
      demoUrl: team.demoUrl || "",
      miroBoard: team.miroBoard || "",
    },
    phase: {
      id: phase.id,
      name: phase.nameAr || phase.name,
      status: phase.status,
      endDate: phase.endDate,
    },
    deliverableConfig: phase.deliverableConfig || null,
    submission: submission ? {
      id: submission.id,
      content: submission.content || "",
      fileUrl: submission.fileUrl || "",
      repositoryUrl: submission.repositoryUrl || "",
      presentationUrl: meta.presentationUrl || "",
      demoUrl: meta.demoUrl || "",
      miroUrl: meta.miroUrl || "",
      oneDriveUrl: meta.oneDriveUrl || "",
      status: submission.status,
      submittedAt: submission.submittedAt,
    } : null,
  });
}

// POST: submit/update team deliverables for a phase
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string; phaseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { teamId, phaseId } = params;

  // Verify user is an active team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId, isActive: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "أنت لست عضواً في هذا الفريق" }, { status: 403 });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { eventId: true },
  });

  if (!team) {
    return NextResponse.json({ error: "الفريق غير موجود" }, { status: 404 });
  }

  const body = await req.json();
  const { description, repositoryUrl, presentationUrl, demoUrl, miroUrl, oneDriveUrl, fileUrl } = body;

  // Get phase config for validation
  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: { deliverableConfig: true },
  });

  const config = phase?.deliverableConfig as any;
  if (config?.fields) {
    const requiredFields = config.fields.filter((f: any) => f.enabled && f.required);
    const fieldValues: Record<string, any> = {
      repository: repositoryUrl,
      presentation: presentationUrl || fileUrl,
      demo: demoUrl,
      miro: miroUrl,
      onedrive: oneDriveUrl,
      file: fileUrl,
      description: description,
    };
    for (const field of requiredFields) {
      if (!fieldValues[field.type]) {
        return NextResponse.json(
          { error: `الحقل "${field.label}" مطلوب`, missingField: field.type },
          { status: 400 }
        );
      }
    }
  }

  // Update team-level fields
  const teamUpdate: any = {};
  if (repositoryUrl !== undefined) teamUpdate.repositoryUrl = repositoryUrl || null;
  if (presentationUrl !== undefined) teamUpdate.presentationUrl = presentationUrl || null;
  if (demoUrl !== undefined) teamUpdate.demoUrl = demoUrl || null;
  if (miroUrl !== undefined) teamUpdate.miroBoard = miroUrl || null;
  if (description !== undefined) {
    teamUpdate.projectDescription = description || null;
    teamUpdate.projectDescriptionAr = description || null;
  }

  if (Object.keys(teamUpdate).length > 0) {
    await prisma.team.update({ where: { id: teamId }, data: teamUpdate });
  }

  // Create/update submission
  const existingSub = await prisma.submission.findFirst({
    where: {
      eventId: team.eventId, teamId, type: "TEAM",
      metadata: { path: ["phaseId"], equals: phaseId },
    },
  });

  const submissionData = {
    content: description || null,
    fileUrl: fileUrl || null,
    repositoryUrl: repositoryUrl || null,
    metadata: {
      phaseId,
      presentationUrl: presentationUrl || null,
      demoUrl: demoUrl || null,
      miroUrl: miroUrl || null,
      oneDriveUrl: oneDriveUrl || null,
    },
    status: "SUBMITTED" as const,
    submittedAt: new Date(),
  };

  let submission;
  if (existingSub) {
    submission = await prisma.submission.update({
      where: { id: existingSub.id },
      data: submissionData,
    });
  } else {
    submission = await prisma.submission.create({
      data: {
        eventId: team.eventId,
        teamId,
        userId,
        type: "TEAM",
        ...submissionData,
      },
    });
  }

  return NextResponse.json({ success: true, submission });
}
