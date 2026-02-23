import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: fetch team deliverables for a phase
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  // Fetch phase deliverable config
  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: { deliverableConfig: true },
  });

  const teams = await prisma.team.findMany({
    where: { eventId, status: { not: "DISQUALIFIED" } },
    include: {
      track: { select: { id: true, nameAr: true, name: true, color: true } },
      members: {
        where: { isActive: true },
        select: { id: true, role: true, user: { select: { firstNameAr: true, firstName: true, lastNameAr: true, lastName: true } } },
      },
      submissions: {
        where: {
          // Match submissions to this phase via metadata
          OR: [
            { metadata: { path: ["phaseId"], equals: phaseId } },
            // Fallback: any team submission
            { type: "TEAM" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          fileUrl: true,
          repositoryUrl: true,
          metadata: true,
          status: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const deliverables = teams.map((team) => {
    const submission = team.submissions[0] || null;
    const meta = (submission?.metadata as any) || {};

    return {
      teamId: team.id,
      teamName: team.nameAr || team.name,
      trackId: team.trackId,
      trackName: team.track?.nameAr || team.track?.name || null,
      trackColor: team.track?.color || null,
      memberCount: team.members.length,
      status: team.status,
      // Team-level links
      projectTitle: team.projectTitle || team.projectTitleAr || null,
      projectDescription: team.projectDescription || team.projectDescriptionAr || null,
      repositoryUrl: team.repositoryUrl || submission?.repositoryUrl || null,
      presentationUrl: team.presentationUrl || meta.presentationUrl || null,
      demoUrl: team.demoUrl || meta.demoUrl || null,
      miroBoard: team.miroBoard || meta.miroUrl || null,
      oneDriveUrl: meta.oneDriveUrl || null,
      // Submission
      submissionContent: submission?.content || null,
      submissionFileUrl: submission?.fileUrl || null,
      submissionStatus: submission?.status || null,
      submittedAt: submission?.submittedAt || null,
      hasDeliverable: !!(
        team.repositoryUrl ||
        team.presentationUrl ||
        team.demoUrl ||
        team.miroBoard ||
        submission?.fileUrl ||
        submission?.content
      ),
    };
  });

  const stats = {
    total: deliverables.length,
    delivered: deliverables.filter((d) => d.hasDeliverable).length,
    pending: deliverables.filter((d) => !d.hasDeliverable).length,
  };

  return NextResponse.json({
    deliverables,
    stats,
    deliverableConfig: phase?.deliverableConfig || null,
  });
}

// POST: submit team deliverables for a phase
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;
  const body = await req.json();
  const { teamId, content, fileUrl, repositoryUrl, links } = body;

  if (!teamId) {
    return NextResponse.json({ error: "معرف الفريق مطلوب" }, { status: 400 });
  }

  // Validate required fields against phase deliverable config
  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: { deliverableConfig: true },
  });

  const config = phase?.deliverableConfig as any;
  if (config?.fields) {
    const requiredFields = config.fields.filter((f: any) => f.enabled && f.required);
    const fieldValues: Record<string, any> = {
      repository: repositoryUrl,
      presentation: links?.presentation || fileUrl,
      demo: links?.demo,
      miro: links?.miro,
      onedrive: links?.onedrive,
      file: fileUrl,
      description: content,
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

  // Update team-level links
  const teamUpdate: any = {};
  if (repositoryUrl) teamUpdate.repositoryUrl = repositoryUrl;
  if (links?.presentation) teamUpdate.presentationUrl = links.presentation;
  if (links?.demo) teamUpdate.demoUrl = links.demo;
  if (links?.miro) teamUpdate.miroBoard = links.miro;

  if (Object.keys(teamUpdate).length > 0) {
    await prisma.team.update({ where: { id: teamId }, data: teamUpdate });
  }

  // Find team leader for userId
  const leader = await prisma.teamMember.findFirst({
    where: { teamId, role: "LEADER" },
    select: { userId: true },
  });

  if (!leader) {
    return NextResponse.json({ error: "لم يتم العثور على قائد الفريق" }, { status: 400 });
  }

  // Create/update submission
  const existingSub = await prisma.submission.findFirst({
    where: { eventId, teamId, type: "TEAM", metadata: { path: ["phaseId"], equals: phaseId } },
  });

  const submissionData = {
    content: content || null,
    fileUrl: fileUrl || null,
    repositoryUrl: repositoryUrl || null,
    metadata: {
      phaseId,
      presentationUrl: links?.presentation || null,
      demoUrl: links?.demo || null,
      miroUrl: links?.miro || null,
      oneDriveUrl: links?.onedrive || null,
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
        eventId,
        teamId,
        userId: leader.userId,
        type: "TEAM",
        ...submissionData,
      },
    });
  }

  return NextResponse.json(submission);
}
