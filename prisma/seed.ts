import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLES } from "../src/types/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ── 1. Create all permissions ────────────────────
  console.log("Creating permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { nameAr: perm.nameAr },
      create: {
        code: perm.code,
        name: perm.name,
        nameAr: perm.nameAr,
        description: perm.description,
        module: perm.module,
        action: perm.action,
        resource: perm.resource,
      },
    });
  }
  console.log(`  ${PERMISSIONS.length} permissions created`);

  // ── 2. Create all roles with permissions ─────────
  console.log("Creating roles...");
  for (const role of ROLES) {
    const createdRole = await prisma.platformRole.upsert({
      where: { name: role.name },
      update: { nameAr: role.nameAr, description: role.description, descriptionAr: role.descriptionAr, level: role.level, color: role.color, icon: role.icon },
      create: {
        name: role.name,
        nameAr: role.nameAr,
        description: role.description,
        descriptionAr: role.descriptionAr,
        level: role.level,
        isSystem: role.isSystem,
        color: role.color,
        icon: role.icon,
      },
    });

    for (const permCode of role.permissions) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: createdRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: createdRole.id, permissionId: permission.id },
        });
      }
    }
    console.log(`  Role "${role.nameAr}" -> ${role.permissions.length} permissions`);
  }

  // ── 3. Create Users ──────────────────────────────
  console.log("\nCreating users...");
  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  const adminElm = await prisma.user.upsert({
    where: { email: "admin@elm.sa" },
    update: {},
    create: {
      email: "admin@elm.sa", password: hashedPassword,
      firstName: "Admin", firstNameAr: "مدير", lastName: "ELM", lastNameAr: "علم",
      phone: "+966500000001", isActive: true, isVerified: true, language: "ar",
    },
  });

  const adminMarkineer = await prisma.user.upsert({
    where: { email: "admin@markineer.sa" },
    update: {},
    create: {
      email: "admin@markineer.sa", password: hashedPassword,
      firstName: "Admin", firstNameAr: "مدير", lastName: "Markineer", lastNameAr: "ماركنير",
      phone: "+966500000002", isActive: true, isVerified: true, language: "ar",
    },
  });

  const orgAdmin = await prisma.user.upsert({
    where: { email: "org.admin@ksu.edu.sa" },
    update: {},
    create: {
      email: "org.admin@ksu.edu.sa", password: hashedPassword,
      firstName: "Mohammed", firstNameAr: "محمد", lastName: "Al-Otaibi", lastNameAr: "العتيبي",
      phone: "+966500000003", isActive: true, isVerified: true, language: "ar",
    },
  });

  const eventMgr = await prisma.user.upsert({
    where: { email: "events@elm.sa" },
    update: {},
    create: {
      email: "events@elm.sa", password: hashedPassword,
      firstName: "Sara", firstNameAr: "سارة", lastName: "Al-Qahtani", lastNameAr: "القحطاني",
      phone: "+966500000004", isActive: true, isVerified: true, language: "ar",
    },
  });

  const judgeUser = await prisma.user.upsert({
    where: { email: "judge@elm.sa" },
    update: {},
    create: {
      email: "judge@elm.sa", password: hashedPassword,
      firstName: "Khalid", firstNameAr: "خالد", lastName: "Al-Harbi", lastNameAr: "الحربي",
      phone: "+966500000005", isActive: true, isVerified: true, language: "ar",
    },
  });

  const mentorUser = await prisma.user.upsert({
    where: { email: "mentor@elm.sa" },
    update: {},
    create: {
      email: "mentor@elm.sa", password: hashedPassword,
      firstName: "Fatima", firstNameAr: "فاطمة", lastName: "Al-Zahrani", lastNameAr: "الزهراني",
      phone: "+966500000006", isActive: true, isVerified: true, language: "ar",
    },
  });

  const expertUser = await prisma.user.upsert({
    where: { email: "expert@elm.sa" },
    update: {},
    create: {
      email: "expert@elm.sa", password: hashedPassword,
      firstName: "Ahmad", firstNameAr: "أحمد", lastName: "Al-Shammari", lastNameAr: "الشمري",
      phone: "+966500000007", isActive: true, isVerified: true, language: "ar",
    },
  });

  const participant1 = await prisma.user.upsert({
    where: { email: "student1@ksu.edu.sa" },
    update: {},
    create: {
      email: "student1@ksu.edu.sa", password: hashedPassword,
      firstName: "Nora", firstNameAr: "نورة", lastName: "Al-Dosari", lastNameAr: "الدوسري",
      phone: "+966500000008", isActive: true, isVerified: true, language: "ar",
    },
  });

  const participant2 = await prisma.user.upsert({
    where: { email: "student2@kau.edu.sa" },
    update: {},
    create: {
      email: "student2@kau.edu.sa", password: hashedPassword,
      firstName: "Omar", firstNameAr: "عمر", lastName: "Al-Ghamdi", lastNameAr: "الغامدي",
      phone: "+966500000009", isActive: true, isVerified: true, language: "ar",
    },
  });

  const researcherUser = await prisma.user.upsert({
    where: { email: "researcher@ksu.edu.sa" },
    update: {},
    create: {
      email: "researcher@ksu.edu.sa", password: hashedPassword,
      firstName: "Layla", firstNameAr: "ليلى", lastName: "Al-Mutairi", lastNameAr: "المطيري",
      phone: "+966500000010", isActive: true, isVerified: true, language: "ar",
    },
  });

  console.log("  10 users created");

  // ── 4. Assign Roles to Users ─────────────────────
  console.log("Assigning roles...");
  const allRoles = await prisma.platformRole.findMany();
  const roleMap = new Map(allRoles.map(r => [r.name, r.id]));

  const roleAssignments = [
    { userId: adminElm.id, roleName: "super_admin" },
    { userId: adminMarkineer.id, roleName: "super_admin" },
    { userId: orgAdmin.id, roleName: "organization_admin" },
    { userId: eventMgr.id, roleName: "event_manager" },
    { userId: judgeUser.id, roleName: "judge" },
    { userId: mentorUser.id, roleName: "mentor" },
    { userId: expertUser.id, roleName: "expert" },
    { userId: participant1.id, roleName: "participant" },
    { userId: participant2.id, roleName: "participant" },
    { userId: researcherUser.id, roleName: "researcher" },
  ];

  for (const ra of roleAssignments) {
    const roleId = roleMap.get(ra.roleName);
    if (roleId) {
      await prisma.userPlatformRole.upsert({
        where: { userId_roleId: { userId: ra.userId, roleId } },
        update: {},
        create: { userId: ra.userId, roleId },
      });
    }
  }
  console.log("  Roles assigned to all users");

  // ── 5. Create Organizations ──────────────────────
  console.log("\nCreating organizations...");
  const elmOrg = await prisma.organization.upsert({
    where: { slug: "elm-company" },
    update: {},
    create: {
      name: "ELM Company", nameAr: "شركة علم", slug: "elm-company",
      type: "COMPANY", sector: "TECHNOLOGY",
      description: "ELM Information Security", descriptionAr: "شركة علم لأمن المعلومات - شريك تقني رائد في المملكة",
      website: "https://elm.sa", email: "info@elm.sa", phone: "+966114618000",
      city: "الرياض", country: "SA", primaryColor: "#7C3AED", secondaryColor: "#14B8A6",
      isActive: true, isVerified: true, verifiedAt: new Date(),
      subscriptionPlan: "ENTERPRISE", maxEvents: 100, maxMembers: 500,
    },
  });

  const imamOrg = await prisma.organization.upsert({
    where: { slug: "imam-university" },
    update: {},
    create: {
      name: "Imam Muhammad Ibn Saud Islamic University", nameAr: "جامعة الإمام محمد بن سعود الإسلامية", slug: "imam-university",
      type: "UNIVERSITY", sector: "EDUCATION",
      description: "Imam Muhammad Ibn Saud Islamic University", descriptionAr: "جامعة الإمام محمد بن سعود الإسلامية - من أعرق الجامعات السعودية",
      website: "https://imamu.edu.sa", email: "info@imamu.edu.sa",
      city: "الرياض", country: "SA", primaryColor: "#059669", secondaryColor: "#0EA5E9",
      isActive: true, isVerified: true, verifiedAt: new Date(),
      subscriptionPlan: "PROFESSIONAL", maxEvents: 50, maxMembers: 200,
    },
  });

  const yamamahOrg = await prisma.organization.upsert({
    where: { slug: "al-yamamah-university" },
    update: {},
    create: {
      name: "Al Yamamah University", nameAr: "جامعة اليمامة", slug: "al-yamamah-university",
      type: "UNIVERSITY", sector: "EDUCATION",
      description: "Al Yamamah University", descriptionAr: "جامعة اليمامة - جامعة أهلية رائدة في الرياض",
      website: "https://yu.edu.sa", email: "info@yu.edu.sa",
      city: "الرياض", country: "SA", primaryColor: "#2563EB", secondaryColor: "#D97706",
      isActive: true, isVerified: true, verifiedAt: new Date(),
      subscriptionPlan: "PROFESSIONAL", maxEvents: 50, maxMembers: 200,
    },
  });

  const darAlhekmaOrg = await prisma.organization.upsert({
    where: { slug: "dar-alhekma-university" },
    update: {},
    create: {
      name: "Dar Al-Hekma University", nameAr: "جامعة دار الحكمة", slug: "dar-alhekma-university",
      type: "UNIVERSITY", sector: "EDUCATION",
      description: "Dar Al-Hekma University", descriptionAr: "جامعة دار الحكمة - جامعة أهلية متميزة في جدة",
      website: "https://dah.edu.sa", email: "info@dah.edu.sa",
      city: "جدة", country: "SA", primaryColor: "#9333EA", secondaryColor: "#F59E0B",
      isActive: true, isVerified: true, verifiedAt: new Date(),
      subscriptionPlan: "PROFESSIONAL", maxEvents: 50, maxMembers: 200,
    },
  });

  const pnuOrg = await prisma.organization.upsert({
    where: { slug: "princess-nourah-university" },
    update: {},
    create: {
      name: "Princess Nourah bint Abdulrahman University", nameAr: "جامعة الأميرة نورة بنت عبدالرحمن", slug: "princess-nourah-university",
      type: "UNIVERSITY", sector: "EDUCATION",
      description: "Princess Nourah bint Abdulrahman University", descriptionAr: "جامعة الأميرة نورة بنت عبدالرحمن - أكبر جامعة للنساء في العالم",
      website: "https://pnu.edu.sa", email: "info@pnu.edu.sa",
      city: "الرياض", country: "SA", primaryColor: "#EC4899", secondaryColor: "#14B8A6",
      isActive: true, isVerified: true, verifiedAt: new Date(),
      subscriptionPlan: "PROFESSIONAL", maxEvents: 50, maxMembers: 200,
    },
  });

  // Org members
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: elmOrg.id, userId: adminElm.id } },
    update: {}, create: { organizationId: elmOrg.id, userId: adminElm.id, role: "OWNER" },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: imamOrg.id, userId: orgAdmin.id } },
    update: {}, create: { organizationId: imamOrg.id, userId: orgAdmin.id, role: "ADMIN" },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: yamamahOrg.id, userId: participant1.id } },
    update: {}, create: { organizationId: yamamahOrg.id, userId: participant1.id, role: "MEMBER" },
  });
  console.log("  5 organizations created with members");

  // ── 6. Create Events ─────────────────────────────
  console.log("\nCreating events...");
  const thakathon = await prisma.event.upsert({
    where: { slug: "thakathon-2025" },
    update: {},
    create: {
      organizationId: pnuOrg.id,
      title: "Thaka'thon 2025", titleAr: "هاكاثون ذكاء ثون 2025",
      slug: "thakathon-2025",
      description: "The largest AI hackathon in Saudi Arabia hosted by Princess Nourah University",
      descriptionAr: "أكبر هاكاثون للذكاء الاصطناعي في المملكة العربية السعودية تستضيفه جامعة الأميرة نورة بنت عبدالرحمن. يهدف ذكاء ثون إلى اكتشاف المواهب السعودية في مجال الذكاء الاصطناعي وتطوير حلول مبتكرة تخدم رؤية 2030",
      type: "HACKATHON", category: "AI_ML", status: "REGISTRATION_OPEN", visibility: "PUBLIC",
      startDate: new Date("2025-04-15"), endDate: new Date("2025-04-17"),
      registrationStart: new Date("2025-01-15"), registrationEnd: new Date("2025-04-01"),
      location: "Riyadh", locationAr: "جامعة الأميرة نورة بنت عبدالرحمن - الرياض",
      isOnline: false, maxParticipants: 250,
      registrationMode: "TEAM", minTeamSize: 3, maxTeamSize: 5,
      hasPhases: true, hasElimination: true, totalPhases: 3,
      primaryColor: "#EC4899", secondaryColor: "#14B8A6",
      aiEvaluationEnabled: true, questionSource: "MIXED",
      publishedAt: new Date("2025-01-15"),
      prizes: JSON.stringify([
        { rank: 1, label: "المركز الأول", amount: 100000 },
        { rank: 2, label: "المركز الثاني", amount: 50000 },
        { rank: 3, label: "المركز الثالث", amount: 25000 },
      ]),
    },
  });

  // التحدي القانوني الذكي - 3 نسخ: دار الحكمة، اليمامة، الإمام
  const legalDarAlhekma = await prisma.event.upsert({
    where: { slug: "smart-legal-challenge-dar-alhekma-2025" },
    update: {},
    create: {
      organizationId: darAlhekmaOrg.id,
      title: "Smart Legal Challenge - Dar Al-Hekma", titleAr: "التحدي القانوني الذكي - جامعة دار الحكمة",
      slug: "smart-legal-challenge-dar-alhekma-2025",
      description: "Smart legal challenge hosted by Dar Al-Hekma University",
      descriptionAr: "التحدي القانوني الذكي في جامعة دار الحكمة. تحدي لابتكار حلول تقنية ذكية للقطاع القانوني في المملكة",
      type: "CHALLENGE", category: "LEGAL", status: "COMPLETED", visibility: "PUBLIC",
      startDate: new Date("2024-11-15"), endDate: new Date("2024-11-17"),
      registrationStart: new Date("2024-09-01"), registrationEnd: new Date("2024-11-10"),
      location: "Jeddah", locationAr: "جامعة دار الحكمة - جدة",
      isOnline: false, maxParticipants: 100,
      registrationMode: "INDIVIDUAL",
      hasPhases: true, hasElimination: false, totalPhases: 2,
      primaryColor: "#9333EA", secondaryColor: "#F59E0B",
      aiEvaluationEnabled: true, questionSource: "MANUAL",
      publishedAt: new Date("2024-09-01"),
    },
  });

  const legalYamamah = await prisma.event.upsert({
    where: { slug: "smart-legal-challenge-yamamah-2025" },
    update: {},
    create: {
      organizationId: yamamahOrg.id,
      title: "Smart Legal Challenge - Al Yamamah", titleAr: "التحدي القانوني الذكي - جامعة اليمامة",
      slug: "smart-legal-challenge-yamamah-2025",
      description: "Smart legal challenge hosted by Al Yamamah University",
      descriptionAr: "التحدي القانوني الذكي في جامعة اليمامة. تحدي لابتكار حلول تقنية ذكية للقطاع القانوني في المملكة",
      type: "CHALLENGE", category: "LEGAL", status: "COMPLETED", visibility: "PUBLIC",
      startDate: new Date("2025-01-20"), endDate: new Date("2025-01-22"),
      registrationStart: new Date("2024-11-01"), registrationEnd: new Date("2025-01-15"),
      location: "Riyadh", locationAr: "جامعة اليمامة - الرياض",
      isOnline: false, maxParticipants: 100,
      registrationMode: "INDIVIDUAL",
      hasPhases: true, hasElimination: false, totalPhases: 2,
      primaryColor: "#2563EB", secondaryColor: "#7C3AED",
      aiEvaluationEnabled: true, questionSource: "MANUAL",
      publishedAt: new Date("2024-11-01"),
    },
  });

  const legalImam = await prisma.event.upsert({
    where: { slug: "smart-legal-challenge-imam-2025" },
    update: {},
    create: {
      organizationId: imamOrg.id,
      title: "Smart Legal Challenge - Imam University", titleAr: "التحدي القانوني الذكي - جامعة الإمام",
      slug: "smart-legal-challenge-imam-2025",
      description: "Smart legal challenge hosted by Imam Muhammad Ibn Saud Islamic University",
      descriptionAr: "التحدي القانوني الذكي في جامعة الإمام محمد بن سعود الإسلامية. تحدي لابتكار حلول تقنية ذكية للقطاع القانوني في المملكة",
      type: "CHALLENGE", category: "LEGAL", status: "PUBLISHED", visibility: "PUBLIC",
      startDate: new Date("2025-05-01"), endDate: new Date("2025-05-03"),
      registrationStart: new Date("2025-02-01"), registrationEnd: new Date("2025-04-20"),
      location: "Riyadh", locationAr: "جامعة الإمام محمد بن سعود الإسلامية - الرياض",
      isOnline: false, maxParticipants: 100,
      registrationMode: "INDIVIDUAL",
      hasPhases: true, hasElimination: false, totalPhases: 2,
      primaryColor: "#059669", secondaryColor: "#7C3AED",
      aiEvaluationEnabled: true, questionSource: "MANUAL",
      publishedAt: new Date("2025-02-01"),
    },
  });

  console.log("  4 events created");

  // ── 7. Create Event Tracks ───────────────────────
  console.log("Creating event tracks...");
  const track1 = await prisma.eventTrack.create({
    data: {
      eventId: thakathon.id, name: "AI & Machine Learning", nameAr: "الذكاء الاصطناعي وتعلم الآلة",
      descriptionAr: "مسار حلول الذكاء الاصطناعي وتعلم الآلة",
      domain: "TECHNOLOGY", color: "#7C3AED", sortOrder: 1,
    },
  });

  const track2 = await prisma.eventTrack.create({
    data: {
      eventId: thakathon.id, name: "Smart Services", nameAr: "الخدمات الذكية",
      descriptionAr: "حلول ذكاء اصطناعي للخدمات الحكومية والخاصة",
      domain: "GENERAL", color: "#059669", sortOrder: 2,
    },
  });

  await prisma.eventTrack.create({
    data: {
      eventId: thakathon.id, name: "Smart Education", nameAr: "التعليم الذكي",
      descriptionAr: "الذكاء الاصطناعي في التعليم",
      domain: "EDUCATION", color: "#2563EB", sortOrder: 3,
    },
  });
  console.log("  3 tracks created for ذكاء ثون");

  // ── 8. Create Event Phases ───────────────────────
  console.log("Creating event phases...");
  await prisma.eventPhase.create({
    data: {
      eventId: thakathon.id, name: "Registration & Ideas", nameAr: "التسجيل وتقديم الأفكار",
      descriptionAr: "تسجيل الفرق وتقديم الأفكار الأولية",
      phaseNumber: 1, phaseType: "REGISTRATION", status: "ACTIVE",
      startDate: new Date("2025-01-15"), endDate: new Date("2025-04-01"),
    },
  });
  await prisma.eventPhase.create({
    data: {
      eventId: thakathon.id, name: "Development Phase", nameAr: "مرحلة التطوير",
      descriptionAr: "تطوير المشاريع والحلول",
      phaseNumber: 2, phaseType: "DEVELOPMENT", status: "UPCOMING",
      startDate: new Date("2025-04-15"), endDate: new Date("2025-04-16"),
      isElimination: true, passThreshold: 60, maxAdvancing: 20,
    },
  });
  await prisma.eventPhase.create({
    data: {
      eventId: thakathon.id, name: "Final Presentations", nameAr: "العروض النهائية",
      descriptionAr: "العروض التقديمية النهائية والتحكيم",
      phaseNumber: 3, phaseType: "FINALS", status: "UPCOMING",
      startDate: new Date("2025-04-17"), endDate: new Date("2025-04-17"),
    },
  });

  // Phases for each Legal Challenge
  for (const lc of [
    { ev: legalDarAlhekma, regStart: "2024-09-01", regEnd: "2024-11-10", chStart: "2024-11-15", chEnd: "2024-11-17", regStatus: "COMPLETED" as const, chStatus: "COMPLETED" as const },
    { ev: legalYamamah, regStart: "2024-11-01", regEnd: "2025-01-15", chStart: "2025-01-20", chEnd: "2025-01-22", regStatus: "COMPLETED" as const, chStatus: "COMPLETED" as const },
    { ev: legalImam, regStart: "2025-02-01", regEnd: "2025-04-20", chStart: "2025-05-01", chEnd: "2025-05-03", regStatus: "COMPLETED" as const, chStatus: "UPCOMING" as const },
  ]) {
    await prisma.eventPhase.create({
      data: {
        eventId: lc.ev.id, name: "Registration", nameAr: "التسجيل",
        descriptionAr: "تسجيل المشاركين في التحدي",
        phaseNumber: 1, phaseType: "REGISTRATION", status: lc.regStatus,
        startDate: new Date(lc.regStart), endDate: new Date(lc.regEnd),
      },
    });
    await prisma.eventPhase.create({
      data: {
        eventId: lc.ev.id, name: "Challenge Phase", nameAr: "مرحلة التحدي",
        descriptionAr: "حل التحديات القانونية الذكية",
        phaseNumber: 2, phaseType: "GENERAL", status: lc.chStatus,
        startDate: new Date(lc.chStart), endDate: new Date(lc.chEnd),
      },
    });
  }
  console.log("  9 phases created");

  // ── 9. Assign Event Members ──────────────────────
  console.log("Assigning event members...");
  const eventMembers = [
    { eventId: thakathon.id, userId: eventMgr.id, role: "ORGANIZER" as const },
    { eventId: thakathon.id, userId: judgeUser.id, role: "JUDGE" as const },
    { eventId: thakathon.id, userId: mentorUser.id, role: "MENTOR" as const },
    { eventId: thakathon.id, userId: expertUser.id, role: "EXPERT" as const },
    { eventId: thakathon.id, userId: participant1.id, role: "PARTICIPANT" as const },
    { eventId: thakathon.id, userId: participant2.id, role: "PARTICIPANT" as const },
    { eventId: legalImam.id, userId: eventMgr.id, role: "ORGANIZER" as const },
    { eventId: legalImam.id, userId: judgeUser.id, role: "JUDGE" as const },
  ];
  for (const em of eventMembers) {
    await prisma.eventMember.create({
      data: { ...em, status: "APPROVED", approvedAt: new Date() },
    });
  }
  console.log("  8 event members assigned");

  // ── 10. Create Teams ─────────────────────────────
  console.log("Creating teams...");
  const team1 = await prisma.team.create({
    data: {
      eventId: thakathon.id, trackId: track1.id,
      name: "Neural Pioneers", nameAr: "رواد الشبكات العصبية",
      description: "AI/ML innovation team", status: "ACTIVE",
      projectTitle: "Smart Document Analyzer", projectTitleAr: "محلل المستندات الذكي",
      projectDescription: "AI-powered tool for analyzing documents using NLP",
      projectDescriptionAr: "أداة ذكاء اصطناعي لتحليل وتلخيص المستندات باستخدام معالجة اللغة الطبيعية",
    },
  });

  const team2 = await prisma.team.create({
    data: {
      eventId: thakathon.id, trackId: track2.id,
      name: "Smart Gov", nameAr: "فريق الحوكمة الذكية",
      description: "Smart government services team", status: "ACTIVE",
      projectTitle: "AI Service Assistant", projectTitleAr: "مساعد الخدمات الذكي",
      projectDescription: "AI assistant for government services automation",
      projectDescriptionAr: "مساعد ذكاء اصطناعي لأتمتة الخدمات الحكومية",
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: participant1.id, role: "LEADER" },
      { teamId: team2.id, userId: participant2.id, role: "LEADER" },
    ],
  });
  console.log("  2 teams created with members");

  // ── 11. Create Evaluation Criteria ───────────────
  console.log("Creating evaluation criteria...");
  await prisma.evaluationCriteria.createMany({
    data: [
      { eventId: thakathon.id, name: "Innovation", nameAr: "الابتكار", descriptionAr: "أصالة الفكرة وإبداعها", weight: 1.5, maxScore: 10, sortOrder: 1 },
      { eventId: thakathon.id, name: "Technical Implementation", nameAr: "التنفيذ التقني", descriptionAr: "جودة الكود والهندسة المعمارية", weight: 1.5, maxScore: 10, sortOrder: 2 },
      { eventId: thakathon.id, name: "Impact", nameAr: "الأثر", descriptionAr: "الأثر المحتمل وفائدة الحل", weight: 1.0, maxScore: 10, sortOrder: 3 },
      { eventId: thakathon.id, name: "Presentation", nameAr: "العرض التقديمي", descriptionAr: "وضوح وجودة العرض", weight: 1.0, maxScore: 10, sortOrder: 4 },
      { eventId: thakathon.id, name: "Business Viability", nameAr: "الجدوى التجارية", descriptionAr: "إمكانية التسويق والجدوى", weight: 1.0, maxScore: 10, sortOrder: 5 },
    ],
  });
  console.log("  5 evaluation criteria created");

  // ── 12. Create Challenges & Questions ────────────
  console.log("Creating challenges and questions...");
  const challenge1 = await prisma.challenge.create({
    data: {
      eventId: legalImam.id,
      title: "Contract Analysis Challenge", titleAr: "تحدي تحليل العقود",
      descriptionAr: "تحليل واستخراج البنود الرئيسية من العقود القانونية باستخدام الذكاء الاصطناعي",
      type: "CASE_STUDY", difficulty: "MEDIUM", points: 100, timeLimit: 120, sortOrder: 1,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        challengeId: challenge1.id, type: "MULTIPLE_CHOICE",
        content: "What is the primary purpose of a force majeure clause?",
        contentAr: "ما هو الغرض الأساسي من شرط القوة القاهرة؟",
        options: JSON.stringify([
          { id: "a", text: "To allow termination without cause", textAr: "للسماح بالإنهاء بدون سبب", isCorrect: false },
          { id: "b", text: "To excuse performance due to extraordinary events", textAr: "لإعفاء الأداء بسبب أحداث استثنائية", isCorrect: true },
          { id: "c", text: "To set payment terms", textAr: "لتحديد شروط الدفع", isCorrect: false },
          { id: "d", text: "To establish jurisdiction", textAr: "لتحديد الاختصاص القضائي", isCorrect: false },
        ]),
        correctAnswer: "b", points: 10, sortOrder: 1,
      },
      {
        challengeId: challenge1.id, type: "ESSAY",
        content: "Analyze the following contract clause and identify potential risks.",
        contentAr: "حلل البند التعاقدي التالي وحدد المخاطر المحتملة لكلا الطرفين.",
        points: 30, sortOrder: 2,
      },
      {
        challengeId: challenge1.id, type: "SHORT_ANSWER",
        content: "Define 'indemnification' in Saudi commercial law context.",
        contentAr: "عرّف 'التعويض' في سياق القانون التجاري السعودي.",
        points: 15, sortOrder: 3,
      },
    ],
  });
  console.log("  1 challenge with 3 questions created");

  // ── 13. Platform Settings ────────────────────────
  console.log("Creating platform settings...");
  const settings = [
    { key: "platform.name", value: "Makan AI Platform", type: "string", group: "general", isPublic: true },
    { key: "platform.name.ar", value: "مكن AI", type: "string", group: "general", isPublic: true },
    { key: "platform.tagline", value: "Smart Event Management", type: "string", group: "general", isPublic: true },
    { key: "platform.tagline.ar", value: "منصة إدارة الفعاليات الذكية", type: "string", group: "general", isPublic: true },
    { key: "platform.primary_color", value: "#7C3AED", type: "string", group: "branding", isPublic: true },
    { key: "platform.secondary_color", value: "#14B8A6", type: "string", group: "branding", isPublic: true },
    { key: "platform.max_file_size_mb", value: "50", type: "number", group: "uploads", isPublic: false },
    { key: "platform.mfa_required", value: "false", type: "boolean", group: "security", isPublic: false },
    { key: "ai.default_model", value: "nuha", type: "string", group: "ai", isPublic: false },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log("  Platform settings created");

  // ── 14. Certificate Templates ────────────────────
  console.log("Creating certificate templates...");
  const templates = [
    { name: "Participation Certificate", nameAr: "شهادة مشاركة", type: "PARTICIPATION" as const },
    { name: "Winner Certificate", nameAr: "شهادة فائز", type: "WINNER" as const },
    { name: "Judge Certificate", nameAr: "شهادة تحكيم", type: "JUDGE" as const },
    { name: "Mentor Certificate", nameAr: "شهادة إرشاد", type: "MENTOR" as const },
  ];
  for (const t of templates) {
    await prisma.certificateTemplate.create({
      data: {
        ...t, isDefault: true,
        htmlTemplate: `<div class="certificate"><h1>{{title}}</h1><p>{{name}}</p><p>{{event}}</p></div>`,
        variables: { title: "", name: "", event: "", date: "" },
      },
    });
  }
  console.log("  Certificate templates created");

  // ── 15. Sample Notifications ─────────────────────
  console.log("Creating notifications...");
  await prisma.notification.createMany({
    data: [
      { userId: adminElm.id, type: "SYSTEM", title: "Welcome", titleAr: "مرحبا بك في مكن AI", message: "Platform ready", messageAr: "المنصة جاهزة للاستخدام" },
      { userId: adminElm.id, type: "EVENT", title: "Event Published", titleAr: "فعالية جديدة", message: "Thaka'thon published", messageAr: "تم نشر هاكاثون ذكاء ثون" },
      { userId: participant1.id, type: "TEAM", title: "Team Approved", titleAr: "تم قبول الفريق", message: "Your team approved", messageAr: "تم قبول فريقك في ذكاء ثون" },
    ],
  });

  // ── 16. Activity Logs ────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { userId: adminElm.id, action: "CREATE", resource: "event", resourceId: thakathon.id, details: { title: "ذكاء ثون 2025" } },
      { userId: adminElm.id, action: "PUBLISH", resource: "event", resourceId: thakathon.id },
      { userId: orgAdmin.id, action: "CREATE", resource: "event", resourceId: legalImam.id, details: { title: "التحدي القانوني الذكي - جامعة الإمام" } },
    ],
  });

  console.log("\n=== Seed completed successfully! ===");
  console.log("Users: 10 | Roles: 10 | Permissions: 72");
  console.log("Organizations: 5 | Events: 4 | Teams: 2");
  console.log("Login: admin@elm.sa / Admin@123");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
