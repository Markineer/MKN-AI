import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/seed/test-event
// Creates a full test clone of Thaka'thon with teams, phases, tracks,
// criteria, schedule items, and judge assignments for end-to-end testing.
export async function POST() {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const result = await prisma.$transaction(async (tx) => {
      const summary: string[] = [];

      // ================================================================
      // 1. Ensure required users exist
      // ================================================================
      const mainUser = await tx.user.findUnique({ where: { email: "radhyah@uqu.edu.sa" } });
      if (!mainUser) throw new Error("Main user radhyah@uqu.edu.sa not found. Run /api/seed/test-participant first.");

      const ahmad = await tx.user.findUnique({ where: { email: "ahmad@test.com" } });
      const sara = await tx.user.findUnique({ where: { email: "sara@test.com" } });
      const khalid = await tx.user.findUnique({ where: { email: "khalid@test.com" } });
      if (!ahmad || !sara || !khalid) throw new Error("Team members not found. Run /api/seed/test-participant first.");

      // Ensure judge, event manager, mentor exist
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

      summary.push("Base users verified/created");

      // ================================================================
      // 1b. Mishal Alzamel - multi-role test user
      // ================================================================
      const mishalPassword = await bcrypt.hash("Test@123", 12);
      const mishal = await tx.user.upsert({
        where: { email: "mishal@test.sa" },
        update: {
          password: mishalPassword,
          firstName: "Mishal",
          firstNameAr: "مشعل",
          lastName: "Alzamel",
          lastNameAr: "الزامل",
        },
        create: {
          email: "mishal@test.sa",
          password: mishalPassword,
          firstName: "Mishal",
          firstNameAr: "مشعل",
          lastName: "Alzamel",
          lastNameAr: "الزامل",
          university: "King Saud University",
          universityAr: "جامعة الملك سعود",
          college: "College of Computer Science",
          collegeAr: "كلية علوم الحاسب",
          major: "Computer Science",
          majorAr: "علوم الحاسب",
          city: "الرياض",
          gender: "MALE",
          bio: "مطور ومحكم ومدير مؤسسة - حساب اختباري متعدد الأدوار",
          bioAr: "مطور ومحكم ومدير مؤسسة - حساب اختباري متعدد الأدوار",
          isActive: true,
          isVerified: true,
          language: "ar",
        },
      });
      summary.push(`Mishal Alzamel upserted: ${mishal.email} (${mishal.id})`);

      // ================================================================
      // 2. Organization
      // ================================================================
      const org = await tx.organization.upsert({
        where: { slug: "elm-org" },
        update: {},
        create: {
          name: "ELM Organization", nameAr: "منظمة علم", slug: "elm-org",
          type: "COMPANY", sector: "TECHNOLOGY",
          description: "ELM Platform Organization for events",
          isActive: true, isVerified: true,
        },
      });

      // Mishal as ADMIN in organization
      await tx.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: mishal.id } },
        update: { role: "ADMIN" },
        create: { organizationId: org.id, userId: mishal.id, role: "ADMIN" },
      });
      summary.push(`Mishal → ADMIN in ${org.slug} (org admin role)`);

      // ================================================================
      // 3. Test Event - ذكاءثون تجريبي
      // ================================================================
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const daysAgo = (n: number) => { const d = new Date(todayDate); d.setDate(d.getDate() - n); return d; };
      const daysFromNow = (n: number) => { const d = new Date(todayDate); d.setDate(d.getDate() + n); return d; };

      // Delete old test event data if exists
      const oldEvent = await tx.event.findUnique({ where: { slug: "thakathon-test" } });
      if (oldEvent) {
        await tx.judgeAssignment.deleteMany({ where: { eventId: oldEvent.id } });
        await tx.eventScheduleItem.deleteMany({ where: { eventId: oldEvent.id } });
        const oldPhaseIds = (await tx.eventPhase.findMany({ where: { eventId: oldEvent.id }, select: { id: true } })).map(p => p.id);
        if (oldPhaseIds.length > 0) {
          await tx.phaseCriteria.deleteMany({ where: { phaseId: { in: oldPhaseIds } } });
          await tx.phaseResult.deleteMany({ where: { phaseId: { in: oldPhaseIds } } });
        }
        await tx.eventPhase.deleteMany({ where: { eventId: oldEvent.id } });
        await tx.evaluationCriteria.deleteMany({ where: { eventId: oldEvent.id } });
        await tx.teamMember.deleteMany({ where: { team: { eventId: oldEvent.id } } });
        await tx.team.deleteMany({ where: { eventId: oldEvent.id } });
        await tx.eventTrack.deleteMany({ where: { eventId: oldEvent.id } });
        await tx.eventMember.deleteMany({ where: { eventId: oldEvent.id } });
        await tx.event.delete({ where: { id: oldEvent.id } });
        summary.push("Old test event cleaned up");
      }

      const event = await tx.event.create({
        data: {
          organizationId: org.id,
          title: "Thaka'thon Test",
          titleAr: "ذكاءثون تجريبي",
          slug: "thakathon-test",
          description: "Test clone of Thaka'thon for end-to-end testing",
          descriptionAr: "نسخة تجريبية من ذكاءثون لاختبار جميع الوظائف - فرق، مراحل، تحكيم، تسليمات",
          type: "HACKATHON",
          category: "AI_ML",
          status: "IN_PROGRESS",
          visibility: "PUBLIC",
          startDate: daysAgo(2),
          endDate: daysFromNow(5),
          registrationStart: daysAgo(10),
          registrationEnd: daysAgo(1),
          timezone: "Asia/Riyadh",
          location: "جامعة أم القرى - حضوري وعن بُعد",
          locationAr: "جامعة أم القرى - حضوري وعن بُعد",
          isOnline: false,
          maxParticipants: 200,
          registrationMode: "TEAM",
          minTeamSize: 2,
          maxTeamSize: 5,
          allowIndividual: false,
          requireApproval: true,
          hasPhases: true,
          hasElimination: true,
          totalPhases: 5,
          primaryColor: "#7C3AED",
          secondaryColor: "#14B8A6",
          aiEvaluationEnabled: true,
          questionSource: "MANUAL",
          publishedAt: daysAgo(10),
          rules: "- حجم الفريق: 2-5 أعضاء\n- يجب وجود عضو تقني واحد على الأقل",
          rulesAr: "- حجم الفريق: 2-5 أعضاء\n- يجب وجود عضو تقني واحد على الأقل",
          prizes: JSON.stringify([
            { rank: 1, label: "المركز الأول", description: "جائزة نقدية + شهادة + احتضان" },
            { rank: 2, label: "المركز الثاني", description: "جائزة نقدية + شهادة" },
            { rank: 3, label: "المركز الثالث", description: "جائزة نقدية + شهادة" },
          ]),
          aiModelConfig: JSON.stringify({
            ideaflowCoach: { enabled: true, model: "nuha", provider: "elm-nuha" },
          }),
        },
      });
      summary.push(`Event created: "${event.titleAr}" (${event.id})`);

      // ================================================================
      // 4. Tracks (5)
      // ================================================================
      const trackData = [
        { name: "Hajj & Umrah", nameAr: "الحج والعمرة", domain: "GENERAL" as const, color: "#D97706" },
        { name: "Tourism & Culture", nameAr: "السياحة والثقافة", domain: "TOURISM" as const, color: "#059669" },
        { name: "Law", nameAr: "القانون", domain: "LEGAL" as const, color: "#7C3AED" },
        { name: "Education", nameAr: "التعليم", domain: "EDUCATION" as const, color: "#2563EB" },
        { name: "Healthcare", nameAr: "الرعاية الصحية", domain: "HEALTH" as const, color: "#DC2626" },
      ];

      const tracks: Record<string, any> = {};
      for (let i = 0; i < trackData.length; i++) {
        const t = await tx.eventTrack.create({
          data: {
            eventId: event.id,
            ...trackData[i],
            maxTeams: 40,
            sortOrder: i + 1,
          },
        });
        tracks[t.name] = t;
      }
      summary.push(`5 tracks created`);

      // ================================================================
      // 5. Phases (5)
      // ================================================================
      const phase1 = await tx.eventPhase.create({
        data: {
          eventId: event.id,
          name: "Registration", nameAr: "التسجيل والقبول",
          descriptionAr: "تسجيل الفرق وتقديم الطلبات",
          phaseNumber: 1, phaseType: "REGISTRATION", status: "COMPLETED",
          startDate: daysAgo(10), endDate: daysAgo(2),
        },
      });

      const phase2 = await tx.eventPhase.create({
        data: {
          eventId: event.id,
          name: "Idea Review", nameAr: "مراجعة الأفكار",
          description: "Submit your project idea with a clear description",
          descriptionAr: "قدّم فكرة مشروعك مع وصف واضح وخطة مبدئية. استعن بشات IdeaFlow لتطوير فكرتك.",
          phaseNumber: 2, phaseType: "IDEA_REVIEW", status: "ACTIVE",
          startDate: daysAgo(1), endDate: daysFromNow(2),
          deliverableConfig: {
            fields: [
              { type: "description", enabled: true, required: true, label: "وصف الفكرة" },
              { type: "presentation", enabled: true, required: false, label: "عرض تقديمي مبدئي" },
            ],
          },
        },
      });

      const phase3 = await tx.eventPhase.create({
        data: {
          eventId: event.id,
          name: "Development", nameAr: "التطوير والبناء",
          descriptionAr: "تطوير الحلول باستخدام تقنيات الذكاء الاصطناعي",
          phaseNumber: 3, phaseType: "DEVELOPMENT", status: "UPCOMING",
          startDate: daysFromNow(2), endDate: daysFromNow(4),
          deliverableConfig: {
            fields: [
              { type: "description", enabled: true, required: true, label: "وصف المشروع" },
              { type: "repository", enabled: true, required: true, label: "رابط الكود (GitHub)" },
              { type: "demo", enabled: true, required: false, label: "رابط التجربة (Demo)" },
            ],
          },
        },
      });

      const phase4 = await tx.eventPhase.create({
        data: {
          eventId: event.id,
          name: "Presentation", nameAr: "العرض التقديمي",
          descriptionAr: "تقديم العروض النهائية أمام لجنة التحكيم",
          phaseNumber: 4, phaseType: "PRESENTATION", status: "UPCOMING",
          startDate: daysFromNow(4), endDate: daysFromNow(5),
          isElimination: true, passThreshold: 70, advancementMode: "PER_TRACK",
        },
      });

      const phase5 = await tx.eventPhase.create({
        data: {
          eventId: event.id,
          name: "Final Judging", nameAr: "التحكيم النهائي وإعلان النتائج",
          descriptionAr: "إعلان الفائزين وحفل التكريم وتوزيع الجوائز",
          phaseNumber: 5, phaseType: "JUDGING", status: "UPCOMING",
          startDate: daysFromNow(5), endDate: daysFromNow(5),
        },
      });

      summary.push(`5 phases created`);

      // ================================================================
      // 6. Evaluation Criteria (6)
      // ================================================================
      await tx.evaluationCriteria.createMany({
        data: [
          { eventId: event.id, name: "Innovation & Creativity", nameAr: "الابتكار والإبداع", descriptionAr: "أصالة الفكرة والنهج الإبداعي", weight: 2.0, maxScore: 10, sortOrder: 1 },
          { eventId: event.id, name: "Problem Solving", nameAr: "حل المشكلات الواقعية", descriptionAr: "معالجة حاجة مجتمعية حقيقية", weight: 1.5, maxScore: 10, sortOrder: 2 },
          { eventId: event.id, name: "AI Quality", nameAr: "جودة تطبيق الذكاء الاصطناعي", descriptionAr: "جودة تطبيق النماذج اللغوية الكبيرة", weight: 2.0, maxScore: 10, sortOrder: 3 },
          { eventId: event.id, name: "Feasibility", nameAr: "الجدوى وقابلية التوسع", descriptionAr: "الجدوى التقنية وإمكانية التوسع", weight: 1.5, maxScore: 10, sortOrder: 4 },
          { eventId: event.id, name: "Presentation", nameAr: "جودة العرض التقديمي", descriptionAr: "وضوح وجودة العرض التقديمي", weight: 1.0, maxScore: 10, sortOrder: 5 },
          { eventId: event.id, name: "Impact", nameAr: "الأثر المتوقع", descriptionAr: "الأثر المجتمعي والاجتماعي المتوقع", weight: 1.0, maxScore: 10, sortOrder: 6 },
        ],
      });
      summary.push(`6 evaluation criteria created`);

      // ================================================================
      // 7. Schedule Items (11)
      // ================================================================
      const tomorrow = daysFromNow(1);
      const dayAfter = daysFromNow(2);
      const threeDays = daysFromNow(3);

      await tx.eventScheduleItem.createMany({
        data: [
          // Today
          { eventId: event.id, phaseId: phase2.id, title: "Opening Ceremony", titleAr: "حفل الافتتاح والتعارف", type: "CEREMONY", date: todayDate, startTime: "09:00", endTime: "09:30", isInPerson: true, location: "Main Hall", locationAr: "القاعة الرئيسية", sortOrder: 1 },
          { eventId: event.id, phaseId: phase2.id, title: "AI Design Thinking Workshop", titleAr: "ورشة التفكير التصميمي بالذكاء الاصطناعي", type: "WORKSHOP", date: todayDate, startTime: "10:00", endTime: "12:00", isOnline: true, onlineLink: "https://zoom.us/j/test-workshop-1", speaker: "Dr. Ahmed", speakerAr: "د. أحمد الحربي", sortOrder: 2 },
          { eventId: event.id, phaseId: phase2.id, title: "Mentoring Session", titleAr: "جلسة إرشاد مع الموجهين", type: "MENTORING", date: todayDate, startTime: "14:00", endTime: "15:30", isOnline: true, isInPerson: true, onlineLink: "https://teams.microsoft.com/l/test-mentoring", location: "Mentoring Room", locationAr: "قاعة الإرشاد", sortOrder: 3 },
          { eventId: event.id, phaseId: phase2.id, title: "Idea Submission Deadline", titleAr: "آخر موعد لتسليم وصف الفكرة", type: "DEADLINE", date: todayDate, startTime: "23:59", sortOrder: 4 },
          // Tomorrow
          { eventId: event.id, phaseId: phase2.id, title: "UI/UX Workshop", titleAr: "ورشة تصميم واجهات المستخدم", type: "WORKSHOP", date: tomorrow, startTime: "10:00", endTime: "12:00", isInPerson: true, location: "Design Lab", locationAr: "معمل التصميم", speaker: "Sara Almutairi", speakerAr: "سارة المطيري", sortOrder: 1 },
          { eventId: event.id, phaseId: phase2.id, title: "Q&A with Judges", titleAr: "جلسة أسئلة وأجوبة مع لجنة التحكيم", type: "SESSION", date: tomorrow, startTime: "14:00", endTime: "15:00", isOnline: true, onlineLink: "https://teams.microsoft.com/l/test-qa", sortOrder: 2 },
          { eventId: event.id, phaseId: phase3.id, title: "Prototyping Workshop", titleAr: "ورشة بناء النماذج الأولية", type: "WORKSHOP", date: tomorrow, startTime: "16:00", endTime: "17:30", isOnline: true, onlineLink: "https://zoom.us/j/test-prototyping", speaker: "Khalid", speakerAr: "خالد الزهراني", sortOrder: 3 },
          // Day After Tomorrow
          { eventId: event.id, phaseId: phase3.id, title: "Presentation Skills Workshop", titleAr: "ورشة عرض المشاريع بفعالية", type: "WORKSHOP", date: dayAfter, startTime: "10:00", endTime: "12:00", isOnline: true, sortOrder: 1 },
          { eventId: event.id, phaseId: phase3.id, title: "Final Submission Deadline", titleAr: "آخر موعد لتسليم المشروع النهائي", type: "DEADLINE", date: dayAfter, startTime: "18:00", sortOrder: 2 },
          // Three Days
          { eventId: event.id, phaseId: phase4.id, title: "Team Presentations", titleAr: "العروض التقديمية للفرق", type: "PRESENTATION", date: threeDays, startTime: "10:00", endTime: "12:00", isInPerson: true, location: "Main Hall", locationAr: "القاعة الرئيسية", sortOrder: 1 },
          { eventId: event.id, phaseId: phase5.id, title: "Closing Ceremony & Results", titleAr: "حفل الختام وإعلان النتائج", type: "CEREMONY", date: threeDays, startTime: "14:00", endTime: "16:00", isInPerson: true, location: "Main Hall", locationAr: "القاعة الرئيسية", sortOrder: 2 },
        ],
      });
      summary.push(`11 schedule items created`);

      // ================================================================
      // 8. Event Members
      // ================================================================
      const allParticipants = [mainUser, ahmad, sara, khalid];
      const staffMembers = [
        { userId: eventMgr.id, role: "ORGANIZER" as const },
        { userId: judgeUser.id, role: "JUDGE" as const },
        { userId: mentorUser.id, role: "MENTOR" as const },
      ];

      for (const staff of staffMembers) {
        await tx.eventMember.create({
          data: { eventId: event.id, ...staff, status: "APPROVED", approvedAt: new Date() },
        });
      }

      for (const participant of allParticipants) {
        await tx.eventMember.create({
          data: { eventId: event.id, userId: participant.id, role: "PARTICIPANT", status: "APPROVED", approvedAt: new Date() },
        });
      }
      summary.push(`7 event members created (1 organizer, 1 judge, 1 mentor, 4 participants)`);

      // ================================================================
      // 8b. Mishal Alzamel — multiple roles in the event
      // ================================================================
      // As JUDGE
      await tx.eventMember.create({
        data: { eventId: event.id, userId: mishal.id, role: "JUDGE", status: "APPROVED", approvedAt: new Date() },
      });
      // As PARTICIPANT (separate membership)
      await tx.eventMember.create({
        data: { eventId: event.id, userId: mishal.id, role: "PARTICIPANT", status: "APPROVED", approvedAt: new Date() },
      });
      summary.push(`Mishal added as JUDGE + PARTICIPANT in test event`);

      // ================================================================
      // 9. Teams (3 + Mishal's team)
      // ================================================================
      const hajjTrack = tracks["Hajj & Umrah"];
      const eduTrack = tracks["Education"];
      const lawTrack = tracks["Law"];

      // Team 1: الرواد — Hajj track — led by radhyah
      const team1 = await tx.team.create({
        data: {
          eventId: event.id, trackId: hajjTrack.id,
          name: "Pioneers", nameAr: "الرواد", status: "ACTIVE",
          projectTitle: "Smart Hajj Guide", projectTitleAr: "المرشد الذكي للحج",
        },
      });
      await tx.teamMember.create({ data: { teamId: team1.id, userId: mainUser.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team1.id, userId: ahmad.id, role: "MEMBER" } });
      await tx.teamMember.create({ data: { teamId: team1.id, userId: sara.id, role: "MEMBER" } });
      await tx.teamMember.create({ data: { teamId: team1.id, userId: khalid.id, role: "MEMBER" } });

      // Team 2: المبتكرات — Education track — led by sara
      const team2 = await tx.team.create({
        data: {
          eventId: event.id, trackId: eduTrack.id,
          name: "Innovators", nameAr: "المبتكرات", status: "ACTIVE",
          projectTitle: "Arabic NLP Tutor", projectTitleAr: "المعلم الذكي للعربية",
        },
      });
      await tx.teamMember.create({ data: { teamId: team2.id, userId: sara.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team2.id, userId: ahmad.id, role: "MEMBER" } });
      await tx.teamMember.create({ data: { teamId: team2.id, userId: khalid.id, role: "MEMBER" } });

      // Team 3: التقنيات — Law track — led by khalid
      const team3 = await tx.team.create({
        data: {
          eventId: event.id, trackId: lawTrack.id,
          name: "TechLaw", nameAr: "التقنيات القانونية", status: "ACTIVE",
          projectTitle: "Legal AI Assistant", projectTitleAr: "المساعد القانوني الذكي",
        },
      });
      await tx.teamMember.create({ data: { teamId: team3.id, userId: khalid.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team3.id, userId: ahmad.id, role: "MEMBER" } });
      await tx.teamMember.create({ data: { teamId: team3.id, userId: sara.id, role: "MEMBER" } });

      // Team 4: فريق مشعل — Tourism track — led by Mishal (as participant)
      const tourismTrack = tracks["Tourism & Culture"];
      const team4 = await tx.team.create({
        data: {
          eventId: event.id, trackId: tourismTrack.id,
          name: "MishalTeam", nameAr: "فريق الإبداع", status: "ACTIVE",
          projectTitle: "Smart Tourism Guide", projectTitleAr: "المرشد السياحي الذكي",
        },
      });
      await tx.teamMember.create({ data: { teamId: team4.id, userId: mishal.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team4.id, userId: ahmad.id, role: "MEMBER" } });

      summary.push(`4 teams created: الرواد, المبتكرات, التقنيات القانونية, فريق الإبداع (مشعل)`);

      // ================================================================
      // 10. Judge Assignments
      // ================================================================
      // Original judge (judge@elm.sa) → 2 teams
      const judgeMember = await tx.eventMember.findFirst({
        where: { eventId: event.id, userId: judgeUser.id, role: "JUDGE" },
      });

      if (judgeMember) {
        await tx.judgeAssignment.create({
          data: { eventId: event.id, phaseId: phase2.id, judgeId: judgeMember.id, teamId: team1.id, trackId: hajjTrack.id, status: "PENDING" },
        });
        await tx.judgeAssignment.create({
          data: { eventId: event.id, phaseId: phase2.id, judgeId: judgeMember.id, teamId: team2.id, trackId: eduTrack.id, status: "PENDING" },
        });
        summary.push(`Judge (judge@elm.sa) assigned to 2 teams: الرواد + المبتكرات`);
      }

      // Mishal as judge → team3 (law track) — different track from his own team
      const mishalJudgeMember = await tx.eventMember.findFirst({
        where: { eventId: event.id, userId: mishal.id, role: "JUDGE" },
      });

      if (mishalJudgeMember) {
        await tx.judgeAssignment.create({
          data: { eventId: event.id, phaseId: phase2.id, judgeId: mishalJudgeMember.id, teamId: team3.id, trackId: lawTrack.id, status: "PENDING" },
        });
        await tx.judgeAssignment.create({
          data: { eventId: event.id, phaseId: phase2.id, judgeId: mishalJudgeMember.id, teamId: team1.id, trackId: hajjTrack.id, status: "PENDING" },
        });
        summary.push(`Mishal (judge) assigned to 2 teams: التقنيات القانونية + الرواد`);
      }

      // ================================================================
      // 11. Summary of Mishal's roles
      // ================================================================
      summary.push(`--- مشعل الزامل (mishal@test.sa / Test@123) ---`);
      summary.push(`  مدير مؤسسة: ADMIN في ${org.slug} → يشوف /organization/events`);
      summary.push(`  محكم: JUDGE في ذكاءثون تجريبي → يشوف /judge + فريقين معينين`);
      summary.push(`  مشارك: PARTICIPANT + قائد فريق "الإبداع" → يشوف /team + /my-events`);

      return {
        eventId: event.id,
        eventSlug: event.slug,
        tracks: Object.keys(tracks).length,
        teams: 4,
        judgeAssignments: 4,
        mishalId: mishal.id,
        summary,
      };
    });

    return NextResponse.json(
      { success: true, message: "Test event seeded successfully", data: result },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Seed test event error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to seed test event", details: message },
      { status: 500 }
    );
  }
}
