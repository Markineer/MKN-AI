import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPhaseAdvancementEmail, sendPhaseEliminationEmail } from "@/lib/mail";

interface FilterRule {
  type: string;
  enabled: boolean;
  value?: number;
  minCount?: number;
}

// Technical specialization keywords
const TECH_KEYWORDS = [
  "computer", "software", "engineering", "it", "information technology",
  "data", "cyber", "programming", "developer", "تقنية", "حاسب", "هندسة",
  "برمجة", "معلومات", "بيانات", "أمن سيبراني", "ذكاء اصطناعي",
];

function isTechnicalSpec(bio: string | null): boolean {
  if (!bio) return false;
  const lower = bio.toLowerCase();
  return TECH_KEYWORDS.some((kw) => lower.includes(kw));
}

function evaluateTeam(
  team: any,
  rules: FilterRule[]
): { pass: boolean; passed: string[]; failed: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.type) {
      case "has_technical_member": {
        const hasTech = team.members.some(
          (m: any) =>
            isTechnicalSpec(m.user?.bio) ||
            isTechnicalSpec(m.user?.major) ||
            isTechnicalSpec(m.user?.specialization)
        );
        hasTech ? passed.push("has_technical_member") : failed.push("has_technical_member");
        break;
      }
      case "diverse_specializations": {
        const specs = new Set(
          team.members
            .map((m: any) => m.user?.major || m.user?.specialization || m.user?.college)
            .filter(Boolean)
        );
        specs.size >= (rule.minCount || 2)
          ? passed.push("diverse_specializations")
          : failed.push("diverse_specializations");
        break;
      }
      case "has_business_link": {
        team.repositoryUrl || team.demoUrl || team.presentationUrl
          ? passed.push("has_business_link")
          : failed.push("has_business_link");
        break;
      }
      case "has_repository": {
        team.repositoryUrl
          ? passed.push("has_repository")
          : failed.push("has_repository");
        break;
      }
      case "has_presentation": {
        team.presentationUrl
          ? passed.push("has_presentation")
          : failed.push("has_presentation");
        break;
      }
      case "team_size_min": {
        team.members.length >= (rule.value || 1)
          ? passed.push("team_size_min")
          : failed.push("team_size_min");
        break;
      }
      case "team_size_max": {
        team.members.length <= (rule.value || 10)
          ? passed.push("team_size_max")
          : failed.push("team_size_max");
        break;
      }
      // max_per_track is handled separately after individual team evaluation
    }
  }

  return { pass: failed.length === 0, passed, failed };
}

// GET: preview auto-filter results
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  const phase = await prisma.eventPhase.findUnique({
    where: { id: phaseId },
    select: { autoFilterRules: true, advancementMode: true },
  });

  if (!phase) {
    return NextResponse.json({ error: "المرحلة غير موجودة" }, { status: 404 });
  }

  const rules = ((phase.autoFilterRules as any)?.rules || []) as FilterRule[];

  const teams = await prisma.team.findMany({
    where: { eventId, status: { in: ["ACTIVE", "FORMING", "SUBMITTED"] } },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true, firstName: true, firstNameAr: true,
              lastName: true, lastNameAr: true, email: true,
              bio: true,
            },
          },
        },
      },
      track: { select: { id: true, name: true, nameAr: true, color: true } },
    },
  });

  const qualifying: any[] = [];
  const rejected: any[] = [];

  for (const team of teams) {
    const result = evaluateTeam(team, rules);
    const entry = {
      teamId: team.id,
      teamName: team.nameAr || team.name,
      trackId: team.trackId,
      trackName: team.track?.nameAr || team.track?.name || null,
      trackColor: team.track?.color || null,
      memberCount: team.members.length,
      passedRules: result.passed,
      failedRules: result.failed,
    };

    if (result.pass) {
      qualifying.push(entry);
    } else {
      rejected.push(entry);
    }
  }

  // Apply max_per_track rule
  const maxPerTrackRule = rules.find((r) => r.type === "max_per_track" && r.enabled);
  let finalQualifying = qualifying;
  let trackOverflow: any[] = [];

  if (maxPerTrackRule && maxPerTrackRule.value) {
    const byTrack: Record<string, any[]> = {};
    for (const t of qualifying) {
      const key = t.trackId || "no_track";
      if (!byTrack[key]) byTrack[key] = [];
      byTrack[key].push(t);
    }

    finalQualifying = [];
    for (const [trackKey, trackTeams] of Object.entries(byTrack)) {
      const limit = maxPerTrackRule.value;
      finalQualifying.push(...trackTeams.slice(0, limit));
      if (trackTeams.length > limit) {
        const overflow = trackTeams.slice(limit).map((t) => ({
          ...t,
          failedRules: [...t.failedRules, "max_per_track"],
        }));
        trackOverflow.push(...overflow);
      }
    }
  }

  // Track stats
  const byTrack: Record<string, { qualifying: number; rejected: number }> = {};
  for (const t of finalQualifying) {
    const key = t.trackName || "بدون مسار";
    if (!byTrack[key]) byTrack[key] = { qualifying: 0, rejected: 0 };
    byTrack[key].qualifying++;
  }
  for (const t of [...rejected, ...trackOverflow]) {
    const key = t.trackName || "بدون مسار";
    if (!byTrack[key]) byTrack[key] = { qualifying: 0, rejected: 0 };
    byTrack[key].rejected++;
  }

  return NextResponse.json({
    qualifying: finalQualifying,
    rejected: [...rejected, ...trackOverflow],
    stats: {
      total: teams.length,
      qualifying: finalQualifying.length,
      rejected: rejected.length + trackOverflow.length,
      byTrack,
    },
  });
}

// POST: execute auto-filter and send emails
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  const { id: eventId, phaseId } = params;

  // Get preview results first
  const previewUrl = new URL(req.url);
  previewUrl.search = "";
  const previewReq = new NextRequest(previewUrl, { method: "GET" });
  const previewRes = await GET(previewReq, { params });
  const previewData = await previewRes.json();

  const { qualifying, rejected } = previewData;

  // Get event and phase info for emails
  const [event, phase, nextPhase] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { titleAr: true, title: true } }),
    prisma.eventPhase.findUnique({ where: { id: phaseId }, select: { nameAr: true, phaseNumber: true } }),
    prisma.eventPhase.findFirst({
      where: { eventId, phaseNumber: { gt: (await prisma.eventPhase.findUnique({ where: { id: phaseId } }))?.phaseNumber || 0 } },
      orderBy: { phaseNumber: "asc" },
      select: { nameAr: true },
    }),
  ]);

  const eventName = event?.titleAr || event?.title || "";
  const phaseName = phase?.nameAr || "";
  const nextPhaseName = nextPhase?.nameAr || null;

  // Create PhaseResults and update team statuses
  for (const team of qualifying) {
    await prisma.phaseResult.create({
      data: {
        phaseId,
        teamId: team.teamId,
        status: "ADVANCED",
        totalScore: 100,
        feedback: `اجتاز الفلترة التلقائية: ${team.passedRules.join(", ")}`,
      },
    });

    await prisma.team.update({
      where: { id: team.teamId },
      data: { status: "ACTIVE" },
    });
  }

  for (const team of rejected) {
    await prisma.phaseResult.create({
      data: {
        phaseId,
        teamId: team.teamId,
        status: "ELIMINATED",
        totalScore: 0,
        feedback: `لم يستوفِ الشروط: ${team.failedRules.join(", ")}`,
      },
    });

    await prisma.team.update({
      where: { id: team.teamId },
      data: { status: "DISQUALIFIED" },
    });
  }

  // Send emails (in background, don't block response)
  const emailPromises: Promise<any>[] = [];

  for (const team of qualifying) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: team.teamId, isActive: true },
      include: { user: { select: { email: true } } },
    });
    for (const m of members) {
      if (m.user.email) {
        emailPromises.push(
          sendPhaseAdvancementEmail({
            to: m.user.email,
            teamName: team.teamName,
            eventName,
            phaseName,
            nextPhaseName,
          })
        );
      }
    }
  }

  for (const team of rejected) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: team.teamId, isActive: true },
      include: { user: { select: { email: true } } },
    });
    for (const m of members) {
      if (m.user.email) {
        emailPromises.push(
          sendPhaseEliminationEmail({
            to: m.user.email,
            teamName: team.teamName,
            eventName,
            phaseName,
            feedback: `الشروط غير المستوفاة: ${team.failedRules.join(", ")}`,
          })
        );
      }
    }
  }

  // Fire and forget emails
  Promise.allSettled(emailPromises).catch(console.error);

  // Update phase status
  await prisma.eventPhase.update({
    where: { id: phaseId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({
    success: true,
    advanced: qualifying.length,
    eliminated: rejected.length,
    emailsSent: emailPromises.length,
  });
}
