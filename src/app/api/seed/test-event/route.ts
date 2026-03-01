import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/seed/test-event
// Clones thakathon-2026 structure into thakathon-2025 (test event)
// so it can be used to test all features end-to-end.
export async function POST() {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const result = await prisma.$transaction(async (tx) => {
      const summary: string[] = [];

      // ================================================================
      // 1. Find thakathon-2025 (test event to update)
      // ================================================================
      const testEvent = await tx.event.findUnique({ where: { slug: "thakathon-2025" } });
      if (!testEvent) throw new Error("thakathon-2025 not found in database");

      const eventId = testEvent.id;
      summary.push(`Found test event: ${testEvent.titleAr} (${eventId})`);

      // ================================================================
      // 2. Ensure required users exist
      // ================================================================
      const mainUser = await tx.user.findUnique({ where: { email: "radhyah@uqu.edu.sa" } });
      if (!mainUser) throw new Error("Main user radhyah@uqu.edu.sa not found. Run /api/seed/test-participant first.");

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

      summary.push("Base users verified/created");

      // ================================================================
      // 3. Mishal Alzamel — 3 separate accounts (one per role)
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

      // 3a. مشعل - مدير مؤسسة (same experience as org-admin@uqu.edu.sa)
      const mishalAdmin = await tx.user.upsert({
        where: { email: "mishal-admin@test.sa" },
        update: { password: mishalPassword },
        create: { email: "mishal-admin@test.sa", ...mishalBase, bio: "حساب اختباري - مدير مؤسسة", bioAr: "حساب اختباري - مدير مؤسسة" },
      });

      // 3b. مشعل - محكم (same experience as judge@elm.sa)
      const mishalJudge = await tx.user.upsert({
        where: { email: "mishal-judge@test.sa" },
        update: { password: mishalPassword },
        create: { email: "mishal-judge@test.sa", ...mishalBase, bio: "حساب اختباري - محكم", bioAr: "حساب اختباري - محكم" },
      });

      // 3c. مشعل - مشارك (same experience as radhyah@uqu.edu.sa)
      const mishalParticipant = await tx.user.upsert({
        where: { email: "mishal@test.sa" },
        update: { password: mishalPassword },
        create: { email: "mishal@test.sa", ...mishalBase, bio: "حساب اختباري - مشارك", bioAr: "حساب اختباري - مشارك" },
      });

      summary.push(`Mishal accounts: mishal-admin@test.sa, mishal-judge@test.sa, mishal@test.sa`);

      // Assign mishal-admin as ADMIN in elm-org (like org-admin@uqu.edu.sa)
      const org = await tx.organization.findFirst({ where: { slug: "elm-org" } });
      if (org) {
        await tx.organizationMember.upsert({
          where: { organizationId_userId: { organizationId: org.id, userId: mishalAdmin.id } },
          update: { role: "ADMIN" },
          create: { organizationId: org.id, userId: mishalAdmin.id, role: "ADMIN" },
        });
        summary.push(`mishal-admin@test.sa → ADMIN in elm-org`);
      }

      // ================================================================
      // 4. Clean up existing test event data
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

      summary.push("Old test event data cleaned up (tracks, phases, criteria, schedule, teams, members)");

      // ================================================================
      // 5. Update event settings to match thakathon-2026
      // ================================================================
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const daysAgo = (n: number) => { const d = new Date(todayDate); d.setDate(d.getDate() - n); return d; };
      const daysFromNow = (n: number) => { const d = new Date(todayDate); d.setDate(d.getDate() + n); return d; };

      await tx.event.update({
        where: { id: eventId },
        data: {
          status: "IN_PROGRESS",
          type: "HACKATHON",
          category: "AI_ML",
          visibility: "PUBLIC",
          startDate: daysAgo(1),
          endDate: daysFromNow(5),
          registrationStart: daysAgo(10),
          registrationEnd: daysAgo(1),
          timezone: "Asia/Riyadh",
          isOnline: false,
          maxParticipants: 250,
          registrationMode: "TEAM",
          minTeamSize: 3,
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
          rules: "- حجم الفريق: 3-5 أعضاء\n- يجب وجود عضو تقني واحد على الأقل\n- يجب تقديم حل يعتمد على الذكاء الاصطناعي",
          rulesAr: "- حجم الفريق: 3-5 أعضاء\n- يجب وجود عضو تقني واحد على الأقل\n- يجب تقديم حل يعتمد على الذكاء الاصطناعي",
          prizes: JSON.stringify([
            { rank: 1, label: "المركز الأول", description: "جائزة نقدية + شهادة + احتضان" },
            { rank: 2, label: "المركز الثاني", description: "جائزة نقدية + شهادة" },
            { rank: 3, label: "المركز الثالث", description: "جائزة نقدية + شهادة" },
          ]),
        },
      });
      summary.push("Event settings updated to match thakathon-2026");

      // ================================================================
      // 6. Tracks (5) — exact copy from thakathon-2026
      // ================================================================
      const trackData = [
        { name: "Hajj & Umrah", nameAr: "الحج والعمرة", domain: "GENERAL" as const, color: "#D97706", description: "AI solutions for Hajj and Umrah services using Arabic NLP", descriptionAr: "حلول الذكاء الاصطناعي لخدمات الحج والعمرة باستخدام معالجة اللغة العربية" },
        { name: "Tourism & Culture", nameAr: "السياحة والثقافة", domain: "TOURISM" as const, color: "#059669", description: "AI solutions for tourism and cultural experiences", descriptionAr: "حلول الذكاء الاصطناعي للسياحة والتجارب الثقافية" },
        { name: "Law", nameAr: "القانون", domain: "LEGAL" as const, color: "#7C3AED", description: "AI solutions for legal services and Arabic legal text processing", descriptionAr: "حلول الذكاء الاصطناعي للخدمات القانونية ومعالجة النصوص القانونية العربية" },
        { name: "Education", nameAr: "التعليم", domain: "EDUCATION" as const, color: "#2563EB", description: "AI solutions for education and Arabic learning", descriptionAr: "حلول الذكاء الاصطناعي للتعليم والتعلم بالعربية" },
        { name: "Healthcare", nameAr: "الرعاية الصحية", domain: "HEALTH" as const, color: "#DC2626", description: "AI solutions for healthcare using Arabic NLP", descriptionAr: "حلول الذكاء الاصطناعي للرعاية الصحية باستخدام معالجة اللغة العربية" },
      ];

      const tracks: Record<string, any> = {};
      for (let i = 0; i < trackData.length; i++) {
        const t = await tx.eventTrack.create({
          data: { eventId, ...trackData[i], maxTeams: 40, sortOrder: i + 1 },
        });
        tracks[t.name] = t;
      }
      summary.push(`5 tracks created (matching thakathon-2026)`);

      // ================================================================
      // 7. Phases (5) — exact copy from thakathon-2026
      // ================================================================
      const phase1 = await tx.eventPhase.create({
        data: {
          eventId, name: "Registration & Acceptance", nameAr: "التسجيل والقبول",
          descriptionAr: "تسجيل الفرق وتقديم الطلبات",
          phaseNumber: 1, phaseType: "REGISTRATION", status: "COMPLETED",
          startDate: daysAgo(10), endDate: daysAgo(2),
        },
      });

      const phase2 = await tx.eventPhase.create({
        data: {
          eventId, name: "Idea Review", nameAr: "مراجعة الأفكار",
          description: "Submit your project idea with a clear description",
          descriptionAr: "قدّم فكرة مشروعك مع وصف واضح وخطة مبدئية",
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
          eventId, name: "Development", nameAr: "التطوير",
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
          eventId, name: "Presentation", nameAr: "العرض التقديمي",
          descriptionAr: "تقديم العروض النهائية أمام لجنة التحكيم",
          phaseNumber: 4, phaseType: "PRESENTATION", status: "UPCOMING",
          startDate: daysFromNow(4), endDate: daysFromNow(5),
        },
      });

      const phase5 = await tx.eventPhase.create({
        data: {
          eventId, name: "Final Judging", nameAr: "التحكيم النهائي",
          descriptionAr: "إعلان الفائزين وحفل التكريم وتوزيع الجوائز",
          phaseNumber: 5, phaseType: "JUDGING", status: "UPCOMING",
          startDate: daysFromNow(5), endDate: daysFromNow(5),
        },
      });

      summary.push(`5 phases created (matching thakathon-2026)`);

      // ================================================================
      // 8. Evaluation Criteria (6) — exact copy from thakathon-2026
      // ================================================================
      await tx.evaluationCriteria.createMany({
        data: [
          { eventId, name: "Innovation & Creativity", nameAr: "الابتكار والإبداع", description: "Originality of the idea and creative approach", descriptionAr: "أصالة الفكرة والنهج الإبداعي في حل المشكلة", weight: 2.0, maxScore: 10, sortOrder: 1 },
          { eventId, name: "Real-World Problem Solving", nameAr: "حل المشكلات الواقعية", description: "Addressing a real community need", descriptionAr: "معالجة حاجة مجتمعية حقيقية وتقديم حل عملي", weight: 1.5, maxScore: 10, sortOrder: 2 },
          { eventId, name: "AI Implementation Quality", nameAr: "جودة تطبيق الذكاء الاصطناعي", description: "Quality of LLM, TTS, ASR implementation for Arabic", descriptionAr: "جودة تطبيق النماذج اللغوية الكبيرة وتحويل النص لكلام والتعرف على الكلام للعربية", weight: 2.0, maxScore: 10, sortOrder: 3 },
          { eventId, name: "Feasibility & Scalability", nameAr: "الجدوى وقابلية التوسع", description: "Technical feasibility and potential for scaling", descriptionAr: "الجدوى التقنية وإمكانية التوسع والتطبيق على نطاق أوسع", weight: 1.5, maxScore: 10, sortOrder: 4 },
          { eventId, name: "Presentation Quality", nameAr: "جودة العرض التقديمي", description: "Clarity and quality of the presentation", descriptionAr: "وضوح وجودة العرض التقديمي والتواصل الفعال للفكرة", weight: 1.0, maxScore: 10, sortOrder: 5 },
          { eventId, name: "Expected Impact", nameAr: "الأثر المتوقع", description: "Potential community and social impact", descriptionAr: "الأثر المجتمعي والاجتماعي المتوقع من تطبيق الحل", weight: 1.0, maxScore: 10, sortOrder: 6 },
        ],
      });
      summary.push(`6 evaluation criteria created (matching thakathon-2026)`);

      // ================================================================
      // 9. Schedule Items (11) — exact copy from thakathon-2026
      // ================================================================
      const day1 = daysAgo(1);   // Day 1 of event
      const day2 = todayDate;     // Day 2
      const day3 = daysFromNow(1); // Day 3
      const day4 = daysFromNow(2); // Day 4
      const day5 = daysFromNow(4); // Presentation day

      await tx.eventScheduleItem.createMany({
        data: [
          // Day 1
          { eventId, phaseId: phase1.id, title: "Opening Ceremony", titleAr: "حفل الافتتاح والتعارف", type: "CEREMONY", date: day1, startTime: "09:00", endTime: "09:30", isInPerson: true, location: "Main Hall", locationAr: "القاعة الرئيسية", sortOrder: 1 },
          { eventId, phaseId: phase2.id, title: "AI Design Thinking Workshop", titleAr: "ورشة التفكير التصميمي بالذكاء الاصطناعي", type: "WORKSHOP", date: day1, startTime: "10:00", endTime: "12:00", isOnline: true, onlineLink: "https://zoom.us/j/workshop-1", speaker: "Dr. Ahmed", speakerAr: "د. أحمد الحربي", sortOrder: 2 },
          { eventId, phaseId: phase2.id, title: "Mentoring Session", titleAr: "جلسة إرشاد مع الموجهين", type: "MENTORING", date: day1, startTime: "14:00", endTime: "15:30", isOnline: true, isInPerson: true, location: "Mentoring Room", locationAr: "قاعة الإرشاد", sortOrder: 3 },
          { eventId, phaseId: phase2.id, title: "Initial Idea Submission Deadline", titleAr: "آخر موعد لتسليم وصف الفكرة المبدئي", type: "DEADLINE", date: day1, startTime: "23:59", sortOrder: 4 },
          // Day 2
          { eventId, phaseId: phase2.id, title: "UI/UX Design Workshop", titleAr: "ورشة تصميم واجهات المستخدم", type: "WORKSHOP", date: day2, startTime: "10:00", endTime: "12:00", isInPerson: true, location: "Design Lab", locationAr: "معمل التصميم", speaker: "Sara Almutairi", speakerAr: "سارة المطيري", sortOrder: 1 },
          { eventId, phaseId: phase2.id, title: "Q&A with Judges Panel", titleAr: "جلسة أسئلة وأجوبة مع لجنة التحكيم", type: "SESSION", date: day2, startTime: "14:00", endTime: "15:00", isOnline: true, sortOrder: 2 },
          { eventId, phaseId: phase3.id, title: "Prototyping Workshop", titleAr: "ورشة بناء النماذج الأولية", type: "WORKSHOP", date: day2, startTime: "16:00", endTime: "17:30", isOnline: true, speaker: "Khalid", speakerAr: "خالد الزهراني", sortOrder: 3 },
          // Day 3
          { eventId, phaseId: phase3.id, title: "Effective Project Presentation Workshop", titleAr: "ورشة عرض المشاريع بفعالية", type: "WORKSHOP", date: day3, startTime: "10:00", endTime: "12:00", isOnline: true, sortOrder: 1 },
          { eventId, phaseId: phase3.id, title: "Final Project Submission Deadline", titleAr: "آخر موعد لتسليم المشروع النهائي", type: "DEADLINE", date: day3, startTime: "18:00", sortOrder: 2 },
          // Presentation Day
          { eventId, phaseId: phase4.id, title: "Team Presentations", titleAr: "العروض التقديمية للفرق", type: "PRESENTATION", date: day5, startTime: "10:00", endTime: "12:00", isInPerson: true, location: "Main Hall", locationAr: "القاعة الرئيسية", sortOrder: 1 },
          { eventId, phaseId: phase5.id, title: "Closing Ceremony & Results", titleAr: "حفل الختام وإعلان النتائج", type: "CEREMONY", date: day5, startTime: "14:00", endTime: "16:00", isInPerson: true, location: "Main Hall", locationAr: "القاعة الرئيسية", sortOrder: 2 },
        ],
      });
      summary.push(`11 schedule items created (matching thakathon-2026)`);

      // ================================================================
      // 10. Event Members
      // ================================================================
      const allParticipants = [mainUser, ahmad, sara, khalid];
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

      for (const participant of allParticipants) {
        await tx.eventMember.create({
          data: { eventId, userId: participant.id, role: "PARTICIPANT", status: "APPROVED", approvedAt: new Date() },
        });
      }
      summary.push(`7 event members created (1 organizer, 1 judge, 1 mentor, 4 participants)`);

      // mishal-judge as JUDGE (like judge@elm.sa)
      await tx.eventMember.create({
        data: { eventId, userId: mishalJudge.id, role: "JUDGE", status: "APPROVED", approvedAt: new Date() },
      });
      // mishal@test.sa as PARTICIPANT (like radhyah@uqu.edu.sa)
      await tx.eventMember.create({
        data: { eventId, userId: mishalParticipant.id, role: "PARTICIPANT", status: "APPROVED", approvedAt: new Date() },
      });
      summary.push(`mishal-judge → JUDGE, mishal@test.sa → PARTICIPANT`);

      // ================================================================
      // 11. Teams (4)
      // ================================================================
      const hajjTrack = tracks["Hajj & Umrah"];
      const eduTrack = tracks["Education"];
      const lawTrack = tracks["Law"];
      const tourismTrack = tracks["Tourism & Culture"];

      // Team 1: الرواد — Hajj track — led by radhyah
      const team1 = await tx.team.create({
        data: {
          eventId, trackId: hajjTrack.id,
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
          eventId, trackId: eduTrack.id,
          name: "Innovators", nameAr: "المبتكرات", status: "ACTIVE",
          projectTitle: "Arabic NLP Tutor", projectTitleAr: "المعلم الذكي للعربية",
        },
      });
      await tx.teamMember.create({ data: { teamId: team2.id, userId: sara.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team2.id, userId: ahmad.id, role: "MEMBER" } });
      await tx.teamMember.create({ data: { teamId: team2.id, userId: khalid.id, role: "MEMBER" } });

      // Team 3: التقنيات القانونية — Law track — led by khalid
      const team3 = await tx.team.create({
        data: {
          eventId, trackId: lawTrack.id,
          name: "TechLaw", nameAr: "التقنيات القانونية", status: "ACTIVE",
          projectTitle: "Legal AI Assistant", projectTitleAr: "المساعد القانوني الذكي",
        },
      });
      await tx.teamMember.create({ data: { teamId: team3.id, userId: khalid.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team3.id, userId: ahmad.id, role: "MEMBER" } });
      await tx.teamMember.create({ data: { teamId: team3.id, userId: sara.id, role: "MEMBER" } });

      // Team 4: فريق الإبداع — Tourism track — led by mishal@test.sa (participant)
      const team4 = await tx.team.create({
        data: {
          eventId, trackId: tourismTrack.id,
          name: "MishalTeam", nameAr: "فريق الإبداع", status: "ACTIVE",
          projectTitle: "Smart Tourism Guide", projectTitleAr: "المرشد السياحي الذكي",
        },
      });
      await tx.teamMember.create({ data: { teamId: team4.id, userId: mishalParticipant.id, role: "LEADER" } });
      await tx.teamMember.create({ data: { teamId: team4.id, userId: ahmad.id, role: "MEMBER" } });

      summary.push(`4 teams created: الرواد, المبتكرات, التقنيات القانونية, فريق الإبداع`);

      // ================================================================
      // 12. Judge Assignments
      // ================================================================
      const judgeMember = await tx.eventMember.findFirst({
        where: { eventId, userId: judgeUser.id, role: "JUDGE" },
      });

      if (judgeMember) {
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: phase2.id, judgeId: judgeMember.id, teamId: team1.id, trackId: hajjTrack.id, status: "PENDING" },
        });
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: phase2.id, judgeId: judgeMember.id, teamId: team2.id, trackId: eduTrack.id, status: "PENDING" },
        });
        summary.push(`Judge (judge@elm.sa) → الرواد + المبتكرات`);
      }

      // mishal-judge assignments (like judge@elm.sa)
      const mishalJudgeMember = await tx.eventMember.findFirst({
        where: { eventId, userId: mishalJudge.id, role: "JUDGE" },
      });

      if (mishalJudgeMember) {
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: phase2.id, judgeId: mishalJudgeMember.id, teamId: team3.id, trackId: lawTrack.id, status: "PENDING" },
        });
        await tx.judgeAssignment.create({
          data: { eventId, phaseId: phase2.id, judgeId: mishalJudgeMember.id, teamId: team1.id, trackId: hajjTrack.id, status: "PENDING" },
        });
        summary.push(`mishal-judge → التقنيات القانونية + الرواد`);
      }

      // ================================================================
      // 13. Clean up the separate thakathon-test event if it exists
      // ================================================================
      const extraEvent = await tx.event.findUnique({ where: { slug: "thakathon-test" } });
      if (extraEvent) {
        await tx.judgeAssignment.deleteMany({ where: { eventId: extraEvent.id } });
        await tx.eventScheduleItem.deleteMany({ where: { eventId: extraEvent.id } });
        const extraPhaseIds = (await tx.eventPhase.findMany({ where: { eventId: extraEvent.id }, select: { id: true } })).map(p => p.id);
        if (extraPhaseIds.length > 0) {
          await tx.phaseCriteria.deleteMany({ where: { phaseId: { in: extraPhaseIds } } });
          await tx.phaseResult.deleteMany({ where: { phaseId: { in: extraPhaseIds } } });
        }
        await tx.eventPhase.deleteMany({ where: { eventId: extraEvent.id } });
        await tx.evaluationCriteria.deleteMany({ where: { eventId: extraEvent.id } });
        await tx.teamMember.deleteMany({ where: { team: { eventId: extraEvent.id } } });
        await tx.team.deleteMany({ where: { eventId: extraEvent.id } });
        await tx.eventTrack.deleteMany({ where: { eventId: extraEvent.id } });
        await tx.eventMember.deleteMany({ where: { eventId: extraEvent.id } });
        await tx.event.delete({ where: { id: extraEvent.id } });
        summary.push("Deleted extra thakathon-test event");
      }

      // ================================================================
      // Summary
      // ================================================================
      summary.push(`--- حسابات مشعل الزامل (Test@123) ---`);
      summary.push(`  mishal-admin@test.sa → مدير مؤسسة (ADMIN في elm-org) → /organization/events`);
      summary.push(`  mishal-judge@test.sa → محكم (JUDGE + فريقين معينين) → /judge`);
      summary.push(`  mishal@test.sa → مشارك (PARTICIPANT + قائد فريق "الإبداع") → /team + /my-events`);

      return {
        eventId,
        eventSlug: testEvent.slug,
        tracks: Object.keys(tracks).length,
        teams: 4,
        judgeAssignments: 4,
        mishalAccounts: {
          admin: mishalAdmin.id,
          judge: mishalJudge.id,
          participant: mishalParticipant.id,
        },
        summary,
      };
    });

    return NextResponse.json(
      { success: true, message: "Test event updated successfully", data: result },
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
