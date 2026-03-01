import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/seed/test-event
// Reads real data from thakathon-2026 and clones it into thakathon-2025.
export async function POST() {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const result = await prisma.$transaction(async (tx) => {
      const summary: string[] = [];

      // ================================================================
      // 1. Find source (thakathon-2026) and target (thakathon-2025)
      // ================================================================
      const source = await tx.event.findUnique({ where: { slug: "thakathon-2026" } });
      if (!source) throw new Error("Source event thakathon-2026 not found");

      const target = await tx.event.findUnique({ where: { slug: "thakathon-2025" } });
      if (!target) throw new Error("Target event thakathon-2025 not found");

      const eventId = target.id;
      summary.push(`Source: ${source.titleAr} (${source.id})`);
      summary.push(`Target: ${target.titleAr} (${eventId})`);

      // ================================================================
      // 2. Read all data from source event
      // ================================================================
      const srcTracks = await tx.eventTrack.findMany({
        where: { eventId: source.id },
        orderBy: { sortOrder: "asc" },
      });

      const srcPhases = await tx.eventPhase.findMany({
        where: { eventId: source.id },
        orderBy: { phaseNumber: "asc" },
      });

      const srcCriteria = await tx.evaluationCriteria.findMany({
        where: { eventId: source.id },
        orderBy: { sortOrder: "asc" },
      });

      const srcSchedule = await tx.eventScheduleItem.findMany({
        where: { eventId: source.id },
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      });

      summary.push(`Read from source: ${srcTracks.length} tracks, ${srcPhases.length} phases, ${srcCriteria.length} criteria, ${srcSchedule.length} schedule items`);

      // ================================================================
      // 3. Ensure required users exist
      // ================================================================
      const mainUser = await tx.user.findUnique({ where: { email: "radhyah@uqu.edu.sa" } });
      if (!mainUser) throw new Error("radhyah@uqu.edu.sa not found. Run /api/seed/test-participant first.");

      const ahmad = await tx.user.findUnique({ where: { email: "ahmad@test.com" } });
      const sara = await tx.user.findUnique({ where: { email: "sara@test.com" } });
      const khalid = await tx.user.findUnique({ where: { email: "khalid@test.com" } });
      if (!ahmad || !sara || !khalid) throw new Error("Team members not found. Run /api/seed/test-participant first.");

      const judgeUser = await tx.user.upsert({
        where: { email: "judge@elm.sa" },
        update: {},
        create: {
          email: "judge@elm.sa", password: hashedPassword,
          firstName: "Khalid", firstNameAr: "خالد", lastName: "Al-Harbi", lastNameAr: "الحربي",
          isActive: true, isVerified: true, language: "ar",
        },
      });

      const eventMgr = await tx.user.upsert({
        where: { email: "events@elm.sa" },
        update: {},
        create: {
          email: "events@elm.sa", password: hashedPassword,
          firstName: "Sara", firstNameAr: "سارة", lastName: "Al-Qahtani", lastNameAr: "القحطاني",
          isActive: true, isVerified: true, language: "ar",
        },
      });

      const mentorUser = await tx.user.upsert({
        where: { email: "mentor@elm.sa" },
        update: {},
        create: {
          email: "mentor@elm.sa", password: hashedPassword,
          firstName: "Fatima", firstNameAr: "فاطمة", lastName: "Al-Zahrani", lastNameAr: "الزهراني",
          isActive: true, isVerified: true, language: "ar",
        },
      });

      // ================================================================
      // 4. Mishal Alzamel — 3 separate accounts
      // ================================================================
      const mishalPassword = await bcrypt.hash("Test@123", 12);
      const mishalBase = {
        password: mishalPassword,
        firstName: "Mishal", firstNameAr: "مشعل",
        lastName: "Alzamel", lastNameAr: "الزامل",
        university: "King Saud University", universityAr: "جامعة الملك سعود",
        college: "College of Computer Science", collegeAr: "كلية علوم الحاسب",
        major: "Computer Science", majorAr: "علوم الحاسب",
        city: "الرياض", gender: "MALE" as const,
        isActive: true, isVerified: true, language: "ar",
      };

      const mishalAdmin = await tx.user.upsert({
        where: { email: "mishal-admin@test.sa" },
        update: { password: mishalPassword },
        create: { email: "mishal-admin@test.sa", ...mishalBase, bio: "حساب اختباري - مدير مؤسسة", bioAr: "حساب اختباري - مدير مؤسسة" },
      });

      const mishalJudge = await tx.user.upsert({
        where: { email: "mishal-judge@test.sa" },
        update: { password: mishalPassword },
        create: { email: "mishal-judge@test.sa", ...mishalBase, bio: "حساب اختباري - محكم", bioAr: "حساب اختباري - محكم" },
      });

      const mishalParticipant = await tx.user.upsert({
        where: { email: "mishal@test.sa" },
        update: { password: mishalPassword },
        create: { email: "mishal@test.sa", ...mishalBase, bio: "حساب اختباري - مشارك", bioAr: "حساب اختباري - مشارك" },
      });

      // mishal-admin → ADMIN in elm-org
      const org = await tx.organization.findFirst({ where: { slug: "elm-org" } });
      if (org) {
        await tx.organizationMember.upsert({
          where: { organizationId_userId: { organizationId: org.id, userId: mishalAdmin.id } },
          update: { role: "ADMIN" },
          create: { organizationId: org.id, userId: mishalAdmin.id, role: "ADMIN" },
        });
      }

      summary.push(`Mishal: mishal-admin@test.sa (org admin), mishal-judge@test.sa (judge), mishal@test.sa (participant)`);

      // ================================================================
      // 5. Clean up target event data
      // ================================================================
      await tx.judgeAssignment.deleteMany({ where: { eventId } });
      await tx.eventScheduleItem.deleteMany({ where: { eventId } });
      const oldPhaseIds = (await tx.eventPhase.findMany({ where: { eventId }, select: { id: true } })).map(p => p.id);
      if (oldPhaseIds.length > 0) {
        await tx.phaseCriteria.deleteMany({ where: { phaseId: { in: oldPhaseIds } } });
        await tx.phaseResult.deleteMany({ where: { phaseId: { in: oldPhaseIds } } });
      }
      await tx.eventPhase.deleteMany({ where: { eventId } });
      await tx.evaluationCriteria.deleteMany({ where: { eventId } });
      await tx.teamMember.deleteMany({ where: { team: { eventId } } });
      await tx.team.deleteMany({ where: { eventId } });
      await tx.eventTrack.deleteMany({ where: { eventId } });
      await tx.eventMember.deleteMany({ where: { eventId } });
      summary.push("Target event data cleaned up");

      // ================================================================
      // 6. Copy event settings from source
      // ================================================================
      await tx.event.update({
        where: { id: eventId },
        data: {
          status: source.status,
          type: source.type,
          category: source.category,
          visibility: source.visibility,
          startDate: source.startDate,
          endDate: source.endDate,
          registrationStart: source.registrationStart,
          registrationEnd: source.registrationEnd,
          timezone: source.timezone,
          location: source.location,
          locationAr: source.locationAr,
          isOnline: source.isOnline,
          maxParticipants: source.maxParticipants,
          registrationMode: source.registrationMode,
          minTeamSize: source.minTeamSize,
          maxTeamSize: source.maxTeamSize,
          allowIndividual: source.allowIndividual,
          requireApproval: source.requireApproval,
          hasPhases: source.hasPhases,
          hasElimination: source.hasElimination,
          totalPhases: source.totalPhases,
          primaryColor: source.primaryColor,
          secondaryColor: source.secondaryColor,
          aiEvaluationEnabled: source.aiEvaluationEnabled,
          questionSource: source.questionSource,
          rules: source.rules,
          rulesAr: source.rulesAr,
          prizes: source.prizes as any,
        },
      });
      summary.push("Event settings copied from source");

      // ================================================================
      // 7. Clone tracks
      // ================================================================
      const trackMap: Record<string, string> = {}; // srcId → newId
      const tracksByName: Record<string, any> = {};
      for (const t of srcTracks) {
        const created = await tx.eventTrack.create({
          data: {
            eventId,
            name: t.name, nameAr: t.nameAr,
            description: t.description, descriptionAr: t.descriptionAr,
            icon: t.icon, color: t.color,
            domain: t.domain, maxTeams: t.maxTeams,
            sortOrder: t.sortOrder, isActive: t.isActive,
          },
        });
        trackMap[t.id] = created.id;
        tracksByName[t.name] = created;
      }
      summary.push(`${srcTracks.length} tracks cloned`);

      // ================================================================
      // 8. Clone phases
      // ================================================================
      const phaseMap: Record<string, string> = {}; // srcId → newId
      const phases: any[] = [];
      for (const p of srcPhases) {
        const created = await tx.eventPhase.create({
          data: {
            eventId,
            name: p.name, nameAr: p.nameAr,
            description: p.description, descriptionAr: p.descriptionAr,
            phaseNumber: p.phaseNumber, phaseType: p.phaseType,
            status: p.status,
            startDate: p.startDate, endDate: p.endDate,
            isElimination: p.isElimination,
            passThreshold: p.passThreshold,
            maxAdvancing: p.maxAdvancing,
            advancePercent: p.advancePercent,
            evaluationMethod: p.evaluationMethod,
            advancementMode: p.advancementMode,
            autoFilterRules: p.autoFilterRules as any,
            deliverableConfig: p.deliverableConfig as any,
            isActive: p.isActive,
          },
        });
        phaseMap[p.id] = created.id;
        phases.push(created);
      }
      summary.push(`${srcPhases.length} phases cloned`);

      // ================================================================
      // 9. Clone evaluation criteria
      // ================================================================
      for (const c of srcCriteria) {
        await tx.evaluationCriteria.create({
          data: {
            eventId,
            name: c.name, nameAr: c.nameAr,
            description: c.description, descriptionAr: c.descriptionAr,
            weight: c.weight, maxScore: c.maxScore,
            sortOrder: c.sortOrder, isActive: c.isActive,
          },
        });
      }
      summary.push(`${srcCriteria.length} criteria cloned`);

      // ================================================================
      // 10. Clone schedule items (remap phaseId)
      // ================================================================
      for (const s of srcSchedule) {
        await tx.eventScheduleItem.create({
          data: {
            eventId,
            phaseId: s.phaseId ? phaseMap[s.phaseId] || null : null,
            title: s.title, titleAr: s.titleAr,
            description: s.description, descriptionAr: s.descriptionAr,
            type: s.type, date: s.date,
            startTime: s.startTime, endTime: s.endTime,
            isOnline: s.isOnline, isInPerson: s.isInPerson,
            onlineLink: s.onlineLink,
            location: s.location, locationAr: s.locationAr,
            speaker: s.speaker, speakerAr: s.speakerAr,
            isPublished: s.isPublished, sortOrder: s.sortOrder,
          },
        });
      }
      summary.push(`${srcSchedule.length} schedule items cloned`);

      // ================================================================
      // 11. Event Members
      // ================================================================
      const staffMembers = [
        { userId: eventMgr.id, role: "ORGANIZER" as const },
        { userId: judgeUser.id, role: "JUDGE" as const },
        { userId: mentorUser.id, role: "MENTOR" as const },
      ];
      for (const staff of staffMembers) {
        await tx.eventMember.create({
          data: { eventId, ...staff, status: "APPROVED", approvedAt: new Date() },
        });
      }
      for (const user of [mainUser, ahmad, sara, khalid]) {
        await tx.eventMember.create({
          data: { eventId, userId: user.id, role: "PARTICIPANT", status: "APPROVED", approvedAt: new Date() },
        });
      }
      // mishal-judge → JUDGE, mishal@test.sa → PARTICIPANT
      await tx.eventMember.create({
        data: { eventId, userId: mishalJudge.id, role: "JUDGE", status: "APPROVED", approvedAt: new Date() },
      });
      await tx.eventMember.create({
        data: { eventId, userId: mishalParticipant.id, role: "PARTICIPANT", status: "APPROVED", approvedAt: new Date() },
      });
      summary.push(`9 event members created`);

      // ================================================================
      // 12. Teams (4) — using first 4 tracks from source
      // ================================================================
      const trackNames = srcTracks.map(t => t.name);
      const getTrack = (name: string) => tracksByName[name];

      const team1 = await tx.team.create({
        data: {
          eventId, trackId: getTrack(trackNames[0]).id,
          name: "Pioneers", nameAr: "الرواد", status: "ACTIVE",
          projectTitle: "Smart Hajj Guide", projectTitleAr: "المرشد الذكي للحج",
        },
      });
      await tx.teamMember.createMany({ data: [
        { teamId: team1.id, userId: mainUser.id, role: "LEADER" },
        { teamId: team1.id, userId: ahmad.id, role: "MEMBER" },
        { teamId: team1.id, userId: sara.id, role: "MEMBER" },
        { teamId: team1.id, userId: khalid.id, role: "MEMBER" },
      ]});

      const team2 = await tx.team.create({
        data: {
          eventId, trackId: getTrack(trackNames[3]).id,
          name: "Innovators", nameAr: "المبتكرات", status: "ACTIVE",
          projectTitle: "Arabic NLP Tutor", projectTitleAr: "المعلم الذكي للعربية",
        },
      });
      await tx.teamMember.createMany({ data: [
        { teamId: team2.id, userId: sara.id, role: "LEADER" },
        { teamId: team2.id, userId: ahmad.id, role: "MEMBER" },
        { teamId: team2.id, userId: khalid.id, role: "MEMBER" },
      ]});

      const team3 = await tx.team.create({
        data: {
          eventId, trackId: getTrack(trackNames[2]).id,
          name: "TechLaw", nameAr: "التقنيات القانونية", status: "ACTIVE",
          projectTitle: "Legal AI Assistant", projectTitleAr: "المساعد القانوني الذكي",
        },
      });
      await tx.teamMember.createMany({ data: [
        { teamId: team3.id, userId: khalid.id, role: "LEADER" },
        { teamId: team3.id, userId: ahmad.id, role: "MEMBER" },
        { teamId: team3.id, userId: sara.id, role: "MEMBER" },
      ]});

      const team4 = await tx.team.create({
        data: {
          eventId, trackId: getTrack(trackNames[1]).id,
          name: "MishalTeam", nameAr: "فريق الإبداع", status: "ACTIVE",
          projectTitle: "Smart Tourism Guide", projectTitleAr: "المرشد السياحي الذكي",
        },
      });
      await tx.teamMember.createMany({ data: [
        { teamId: team4.id, userId: mishalParticipant.id, role: "LEADER" },
        { teamId: team4.id, userId: ahmad.id, role: "MEMBER" },
      ]});

      summary.push(`4 teams created`);

      // ================================================================
      // 13. Judge Assignments — use phase 2 (first ACTIVE/IDEA_REVIEW)
      // ================================================================
      const activePhase = phases.find(p => p.status === "ACTIVE") || phases[1];

      const judgeMember = await tx.eventMember.findFirst({
        where: { eventId, userId: judgeUser.id, role: "JUDGE" },
      });
      if (judgeMember && activePhase) {
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: activePhase.id, judgeId: judgeMember.id, teamId: team1.id, trackId: getTrack(trackNames[0]).id, status: "PENDING" },
        });
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: activePhase.id, judgeId: judgeMember.id, teamId: team2.id, trackId: getTrack(trackNames[3]).id, status: "PENDING" },
        });
        summary.push(`judge@elm.sa → ${team1.nameAr} + ${team2.nameAr}`);
      }

      const mjMember = await tx.eventMember.findFirst({
        where: { eventId, userId: mishalJudge.id, role: "JUDGE" },
      });
      if (mjMember && activePhase) {
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: activePhase.id, judgeId: mjMember.id, teamId: team3.id, trackId: getTrack(trackNames[2]).id, status: "PENDING" },
        });
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: activePhase.id, judgeId: mjMember.id, teamId: team1.id, trackId: getTrack(trackNames[0]).id, status: "PENDING" },
        });
        summary.push(`mishal-judge@test.sa → ${team3.nameAr} + ${team1.nameAr}`);
      }

      // ================================================================
      // 14. Cleanup extra thakathon-test if exists
      // ================================================================
      const extra = await tx.event.findUnique({ where: { slug: "thakathon-test" } });
      if (extra) {
        await tx.judgeAssignment.deleteMany({ where: { eventId: extra.id } });
        await tx.eventScheduleItem.deleteMany({ where: { eventId: extra.id } });
        const epIds = (await tx.eventPhase.findMany({ where: { eventId: extra.id }, select: { id: true } })).map(p => p.id);
        if (epIds.length > 0) {
          await tx.phaseCriteria.deleteMany({ where: { phaseId: { in: epIds } } });
          await tx.phaseResult.deleteMany({ where: { phaseId: { in: epIds } } });
        }
        await tx.eventPhase.deleteMany({ where: { eventId: extra.id } });
        await tx.evaluationCriteria.deleteMany({ where: { eventId: extra.id } });
        await tx.teamMember.deleteMany({ where: { team: { eventId: extra.id } } });
        await tx.team.deleteMany({ where: { eventId: extra.id } });
        await tx.eventTrack.deleteMany({ where: { eventId: extra.id } });
        await tx.eventMember.deleteMany({ where: { eventId: extra.id } });
        await tx.event.delete({ where: { id: extra.id } });
        summary.push("Deleted extra thakathon-test event");
      }

      summary.push(`--- حسابات مشعل (Test@123) ---`);
      summary.push(`  mishal-admin@test.sa → مدير مؤسسة`);
      summary.push(`  mishal-judge@test.sa → محكم`);
      summary.push(`  mishal@test.sa → مشارك`);

      return { eventId, eventSlug: target.slug, clonedFrom: source.slug, tracks: srcTracks.length, phases: srcPhases.length, criteria: srcCriteria.length, scheduleItems: srcSchedule.length, teams: 4, summary };
    });

    return NextResponse.json({ success: true, message: "Test event cloned successfully", data: result }, { status: 201 });
  } catch (error: unknown) {
    console.error("Seed test event error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: "Failed to seed test event", details: message }, { status: 500 });
  }
}
