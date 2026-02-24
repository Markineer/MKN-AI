import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/seed/test-participant
// Seeds a test participant user with full event history.
// No auth check - dev seed endpoint only.
export async function POST() {
  try {
    const hashedPassword = await bcrypt.hash("Test@123", 12);

    const result = await prisma.$transaction(async (tx) => {
      const summary: string[] = [];

      // ================================================================
      // A. Create main user - Radhyah Alzubaidi
      // ================================================================
      const user = await tx.user.upsert({
        where: { email: "radhyah@uqu.edu.sa" },
        update: {
          password: hashedPassword,
          firstName: "Radhyah",
          firstNameAr: "\u0631\u0636\u064a\u0647",
          lastName: "Alzubaidi",
          lastNameAr: "\u0627\u0644\u0632\u0628\u064a\u062f\u064a",
          university: "Umm Al-Qura University",
          universityAr: "\u062c\u0627\u0645\u0639\u0629 \u0623\u0645 \u0627\u0644\u0642\u0631\u0649",
          college: "College of Computing and Engineering",
          collegeAr: "\u0643\u0644\u064a\u0629 \u0627\u0644\u062d\u0627\u0633\u0628 \u0648\u0627\u0644\u0647\u0646\u062f\u0633\u0629",
          major: "Software Engineering",
          majorAr: "\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a",
          specialization: "Artificial Intelligence",
          specializationAr: "\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a",
          city: "\u0645\u0643\u0629 \u0627\u0644\u0645\u0643\u0631\u0645\u0629",
          gender: "FEMALE",
          bio: "\u0645\u0637\u0648\u0631\u0629 \u0628\u0631\u0645\u062c\u064a\u0627\u062a \u0648\u0628\u0627\u062d\u062b\u0629 \u0641\u064a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
          bioAr: "\u0645\u0637\u0648\u0631\u0629 \u0628\u0631\u0645\u062c\u064a\u0627\u062a \u0648\u0628\u0627\u062d\u062b\u0629 \u0641\u064a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a\u060c \u0645\u062a\u062e\u0635\u0635\u0629 \u0641\u064a \u062a\u0637\u0648\u064a\u0631 \u062d\u0644\u0648\u0644 \u0630\u0643\u064a\u0629 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u062a\u0642\u0646\u064a\u0627\u062a \u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u0639\u0645\u064a\u0642 \u0648\u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0637\u0628\u064a\u0639\u064a\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629",
        },
        create: {
          email: "radhyah@uqu.edu.sa",
          password: hashedPassword,
          firstName: "Radhyah",
          firstNameAr: "\u0631\u0636\u064a\u0647",
          lastName: "Alzubaidi",
          lastNameAr: "\u0627\u0644\u0632\u0628\u064a\u062f\u064a",
          university: "Umm Al-Qura University",
          universityAr: "\u062c\u0627\u0645\u0639\u0629 \u0623\u0645 \u0627\u0644\u0642\u0631\u0649",
          college: "College of Computing and Engineering",
          collegeAr: "\u0643\u0644\u064a\u0629 \u0627\u0644\u062d\u0627\u0633\u0628 \u0648\u0627\u0644\u0647\u0646\u062f\u0633\u0629",
          major: "Software Engineering",
          majorAr: "\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a",
          specialization: "Artificial Intelligence",
          specializationAr: "\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a",
          city: "\u0645\u0643\u0629 \u0627\u0644\u0645\u0643\u0631\u0645\u0629",
          gender: "FEMALE",
          bio: "\u0645\u0637\u0648\u0631\u0629 \u0628\u0631\u0645\u062c\u064a\u0627\u062a \u0648\u0628\u0627\u062d\u062b\u0629 \u0641\u064a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
          bioAr: "\u0645\u0637\u0648\u0631\u0629 \u0628\u0631\u0645\u062c\u064a\u0627\u062a \u0648\u0628\u0627\u062d\u062b\u0629 \u0641\u064a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a\u060c \u0645\u062a\u062e\u0635\u0635\u0629 \u0641\u064a \u062a\u0637\u0648\u064a\u0631 \u062d\u0644\u0648\u0644 \u0630\u0643\u064a\u0629 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u062a\u0642\u0646\u064a\u0627\u062a \u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u0639\u0645\u064a\u0642 \u0648\u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0637\u0628\u064a\u0639\u064a\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629",
          isVerified: true,
        },
      });
      summary.push(`User upserted: ${user.email} (${user.id})`);

      // ================================================================
      // Create fake team members
      // ================================================================
      const ahmad = await tx.user.upsert({
        where: { email: "ahmad@test.com" },
        update: {},
        create: {
          email: "ahmad@test.com",
          password: hashedPassword,
          firstName: "Ahmad",
          firstNameAr: "\u0623\u062d\u0645\u062f",
          lastName: "Almalki",
          lastNameAr: "\u0627\u0644\u0645\u0627\u0644\u0643\u064a",
          university: "Umm Al-Qura University",
          universityAr: "\u062c\u0627\u0645\u0639\u0629 \u0623\u0645 \u0627\u0644\u0642\u0631\u0649",
          gender: "MALE",
          isVerified: true,
        },
      });

      const sara = await tx.user.upsert({
        where: { email: "sara@test.com" },
        update: {},
        create: {
          email: "sara@test.com",
          password: hashedPassword,
          firstName: "Sara",
          firstNameAr: "\u0633\u0627\u0631\u0629",
          lastName: "Alotaibi",
          lastNameAr: "\u0627\u0644\u0639\u062a\u064a\u0628\u064a",
          university: "Umm Al-Qura University",
          universityAr: "\u062c\u0627\u0645\u0639\u0629 \u0623\u0645 \u0627\u0644\u0642\u0631\u0649",
          gender: "FEMALE",
          isVerified: true,
        },
      });

      const khalid = await tx.user.upsert({
        where: { email: "khalid@test.com" },
        update: {},
        create: {
          email: "khalid@test.com",
          password: hashedPassword,
          firstName: "Khalid",
          firstNameAr: "\u062e\u0627\u0644\u062f",
          lastName: "Alshammari",
          lastNameAr: "\u0627\u0644\u0634\u0645\u0631\u064a",
          university: "Umm Al-Qura University",
          universityAr: "\u062c\u0627\u0645\u0639\u0629 \u0623\u0645 \u0627\u0644\u0642\u0631\u0649",
          gender: "MALE",
          isVerified: true,
        },
      });

      summary.push(
        `Fake team members upserted: ${ahmad.email}, ${sara.email}, ${khalid.email}`
      );

      // ================================================================
      // Organization (upsert by slug)
      // ================================================================
      const org = await tx.organization.upsert({
        where: { slug: "elm-org" },
        update: {},
        create: {
          name: "ELM Organization",
          nameAr: "\u0645\u0646\u0638\u0645\u0629 \u0639\u0644\u0645",
          slug: "elm-org",
          type: "COMPANY",
          sector: "TECHNOLOGY",
          description: "ELM Platform Organization for events",
          isActive: true,
          isVerified: true,
        },
      });
      summary.push(`Organization upserted: ${org.slug} (${org.id})`);

      // ================================================================
      // B. Hackathon 1 - Digital Innovation Hackathon 2025 (COMPLETED)
      // ================================================================
      const hackathon1Slug = "digital-innovation-hackathon-2025";

      const hackathon1 = await tx.event.upsert({
        where: { slug: hackathon1Slug },
        update: {
          status: "COMPLETED",
        },
        create: {
          organizationId: org.id,
          title: "Digital Innovation Hackathon 2025",
          titleAr: "\u0647\u0627\u0643\u0627\u062b\u0648\u0646 \u0627\u0644\u0627\u0628\u062a\u0643\u0627\u0631 \u0627\u0644\u0631\u0642\u0645\u064a 2025",
          slug: hackathon1Slug,
          type: "HACKATHON",
          category: "AI_ML",
          status: "COMPLETED",
          startDate: new Date("2025-06-15"),
          endDate: new Date("2025-06-17"),
          registrationStart: new Date("2025-05-01"),
          registrationEnd: new Date("2025-06-10"),
          primaryColor: "#7C3AED",
          maxTeamSize: 5,
          minTeamSize: 2,
          registrationMode: "TEAM",
        },
      });
      summary.push(
        `Hackathon 1 upserted: "${hackathon1.title}" (${hackathon1.id})`
      );

      // Track for Hackathon 1
      let track1 = await tx.eventTrack.findFirst({
        where: { eventId: hackathon1.id, name: "Technology" },
      });
      if (!track1) {
        track1 = await tx.eventTrack.create({
          data: {
            eventId: hackathon1.id,
            name: "Technology",
            nameAr: "\u0627\u0644\u062a\u0642\u0646\u064a\u0629",
            color: "#7C3AED",
            domain: "TECHNOLOGY",
          },
        });
      }
      summary.push(`Track upserted: "${track1.name}" (${track1.id})`);

      // EventMember for main user in Hackathon 1
      await tx.eventMember.upsert({
        where: {
          eventId_userId_role: {
            eventId: hackathon1.id,
            userId: user.id,
            role: "PARTICIPANT",
          },
        },
        update: { status: "APPROVED" },
        create: {
          eventId: hackathon1.id,
          userId: user.id,
          role: "PARTICIPANT",
          status: "APPROVED",
          approvedAt: new Date("2025-05-15"),
        },
      });

      // EventMembers for fake team members in Hackathon 1
      for (const member of [ahmad, sara, khalid]) {
        await tx.eventMember.upsert({
          where: {
            eventId_userId_role: {
              eventId: hackathon1.id,
              userId: member.id,
              role: "PARTICIPANT",
            },
          },
          update: { status: "APPROVED" },
          create: {
            eventId: hackathon1.id,
            userId: member.id,
            role: "PARTICIPANT",
            status: "APPROVED",
            approvedAt: new Date("2025-05-15"),
          },
        });
      }
      summary.push(`EventMembers created for Hackathon 1`);

      // Team for Hackathon 1
      let team1 = await tx.team.findUnique({
        where: {
          eventId_name: {
            eventId: hackathon1.id,
            name: "Innovation",
          },
        },
      });
      if (!team1) {
        team1 = await tx.team.create({
          data: {
            eventId: hackathon1.id,
            trackId: track1.id,
            name: "Innovation",
            nameAr: "\u0627\u0628\u062a\u0643\u0627\u0631",
            totalScore: 87.5,
            rank: 2,
            status: "ACTIVE",
            projectTitle: "Smart Contract Analyzer",
            projectTitleAr: "\u0645\u062d\u0644\u0644 \u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u0630\u0643\u064a",
          },
        });
      } else {
        team1 = await tx.team.update({
          where: { id: team1.id },
          data: {
            totalScore: 87.5,
            rank: 2,
            status: "ACTIVE",
            projectTitle: "Smart Contract Analyzer",
            projectTitleAr: "\u0645\u062d\u0644\u0644 \u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u0630\u0643\u064a",
          },
        });
      }
      summary.push(`Team upserted: "${team1.nameAr}" (${team1.id})`);

      // Team Members
      // Radhyah as LEADER
      await tx.teamMember.upsert({
        where: {
          teamId_userId: { teamId: team1.id, userId: user.id },
        },
        update: { role: "LEADER" },
        create: {
          teamId: team1.id,
          userId: user.id,
          role: "LEADER",
        },
      });

      // Other members
      for (const member of [ahmad, sara, khalid]) {
        await tx.teamMember.upsert({
          where: {
            teamId_userId: { teamId: team1.id, userId: member.id },
          },
          update: { role: "MEMBER" },
          create: {
            teamId: team1.id,
            userId: member.id,
            role: "MEMBER",
          },
        });
      }
      summary.push(`TeamMembers created for team "${team1.nameAr}"`);

      // Certificate for Hackathon 1
      const cert1No = `CERT-H1-${user.id.slice(-6)}`;
      let cert1 = await tx.certificate.findUnique({
        where: { certificateNo: cert1No },
      });
      if (!cert1) {
        cert1 = await tx.certificate.create({
          data: {
            userId: user.id,
            eventId: hackathon1.id,
            teamId: team1.id,
            type: "WINNER",
            title: "Second Place Winner",
            titleAr: "\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u062b\u0627\u0646\u064a",
            certificateNo: cert1No,
            rank: 2,
            rankLabel: "\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u062b\u0627\u0646\u064a",
            totalScore: 87.5,
            isTeam: true,
            teamName: "\u0627\u0628\u062a\u0643\u0627\u0631",
            issuedAt: new Date("2025-06-17"),
          },
        });
      }
      summary.push(
        `Certificate created: "${cert1.title}" (${cert1.certificateNo})`
      );

      // ================================================================
      // C. Hackathon 2 - Thaka'thon 2026 (ACTIVE - covers today)
      // ================================================================
      // Calculate dates relative to today so the demo always works
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Try to find existing event
      let hackathon2 = await tx.event.findFirst({
        where: {
          OR: [
            { title: { contains: "Thaka" } },
            { titleAr: { contains: "\u062b\u0643\u0627\u062b\u0648\u0646" } },
          ],
        },
      });

      if (hackathon2) {
        // Update dates to cover today
        hackathon2 = await tx.event.update({
          where: { id: hackathon2.id },
          data: {
            status: "IN_PROGRESS",
            startDate: twoDaysAgo,
            endDate: threeDaysFromNow,
            hasPhases: true,
            totalPhases: 5,
          },
        });
        summary.push(
          `Found & updated Thaka'thon event: "${hackathon2.title}" (${hackathon2.id})`
        );
      } else {
        const hackathon2Slug = "thakathon-2026";
        hackathon2 = await tx.event.upsert({
          where: { slug: hackathon2Slug },
          update: {
            status: "IN_PROGRESS",
            startDate: twoDaysAgo,
            endDate: threeDaysFromNow,
            hasPhases: true,
            totalPhases: 5,
          },
          create: {
            organizationId: org.id,
            title: "Thaka'thon 2026",
            titleAr: "\u062b\u0643\u0627\u062b\u0648\u0646 2026",
            slug: hackathon2Slug,
            type: "HACKATHON",
            category: "GENERAL",
            status: "IN_PROGRESS",
            startDate: twoDaysAgo,
            endDate: threeDaysFromNow,
            primaryColor: "#059669",
            registrationMode: "TEAM",
            hasPhases: true,
            totalPhases: 5,
          },
        });
        summary.push(
          `Hackathon 2 created: "${hackathon2.title}" (${hackathon2.id})`
        );
      }

      // EventMember for user in Hackathon 2
      await tx.eventMember.upsert({
        where: {
          eventId_userId_role: {
            eventId: hackathon2.id,
            userId: user.id,
            role: "PARTICIPANT",
          },
        },
        update: { status: "APPROVED" },
        create: {
          eventId: hackathon2.id,
          userId: user.id,
          role: "PARTICIPANT",
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
      summary.push(`EventMember created for user in Thaka'thon`);

      // Find or create a team in Hackathon 2 for the user
      let team2 = await tx.team.findFirst({
        where: {
          eventId: hackathon2.id,
          members: { some: { userId: user.id } },
        },
      });

      if (!team2) {
        const team2Name = "Pioneers";
        team2 = await tx.team.findUnique({
          where: {
            eventId_name: { eventId: hackathon2.id, name: team2Name },
          },
        });

        if (!team2) {
          team2 = await tx.team.create({
            data: {
              eventId: hackathon2.id,
              name: team2Name,
              nameAr: "\u0627\u0644\u0631\u0648\u0627\u062f",
              status: "ACTIVE",
            },
          });
        }

        await tx.teamMember.upsert({
          where: { teamId_userId: { teamId: team2.id, userId: user.id } },
          update: { role: "LEADER" },
          create: { teamId: team2.id, userId: user.id, role: "LEADER" },
        });
      }

      // Add other team members to Hackathon 2 team as well
      for (const member of [ahmad, sara, khalid]) {
        await tx.eventMember.upsert({
          where: {
            eventId_userId_role: {
              eventId: hackathon2.id,
              userId: member.id,
              role: "PARTICIPANT",
            },
          },
          update: { status: "APPROVED" },
          create: {
            eventId: hackathon2.id,
            userId: member.id,
            role: "PARTICIPANT",
            status: "APPROVED",
          },
        });
        await tx.teamMember.upsert({
          where: { teamId_userId: { teamId: team2.id, userId: member.id } },
          update: { role: "MEMBER" },
          create: { teamId: team2.id, userId: member.id, role: "MEMBER" },
        });
      }
      summary.push(
        `Team membership ensured for Thaka'thon: "${team2.nameAr || team2.name}" (${team2.id})`
      );

      // ================================================================
      // C2. Phases for Thaka'thon
      // ================================================================
      // Delete old phases first (idempotent)
      await tx.eventScheduleItem.deleteMany({ where: { eventId: hackathon2.id } });
      await tx.eventPhase.deleteMany({ where: { eventId: hackathon2.id } });

      const phase1 = await tx.eventPhase.create({
        data: {
          eventId: hackathon2.id,
          name: "Registration & Acceptance",
          nameAr: "\u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0648\u0627\u0644\u0642\u0628\u0648\u0644",
          phaseNumber: 1,
          phaseType: "REGISTRATION",
          status: "COMPLETED",
          startDate: fourDaysAgo,
          endDate: twoDaysAgo,
        },
      });

      const phase2 = await tx.eventPhase.create({
        data: {
          eventId: hackathon2.id,
          name: "Idea Review",
          nameAr: "\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0623\u0641\u0643\u0627\u0631",
          description: "Submit your project idea with a clear description and initial plan.",
          descriptionAr: "\u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u062d\u0644\u0629\u060c \u0642\u062f\u0651\u0645 \u0641\u0643\u0631\u0629 \u0645\u0634\u0631\u0648\u0639\u0643 \u0645\u0639 \u0648\u0635\u0641 \u0648\u0627\u0636\u062d \u0648\u062e\u0637\u0629 \u0645\u0628\u062f\u0626\u064a\u0629. \u0627\u0633\u062a\u0639\u0646 \u0628\u0634\u0627\u062a IdeaFlow \u0644\u062a\u0637\u0648\u064a\u0631 \u0641\u0643\u0631\u062a\u0643.",
          phaseNumber: 2,
          phaseType: "IDEA_REVIEW",
          status: "ACTIVE",
          startDate: yesterday,
          endDate: tomorrow,
          deliverableConfig: {
            fields: [
              { type: "description", enabled: true, required: true, label: "\u0648\u0635\u0641 \u0627\u0644\u0641\u0643\u0631\u0629" },
              { type: "presentation", enabled: true, required: false, label: "\u0639\u0631\u0636 \u062a\u0642\u062f\u064a\u0645\u064a \u0645\u0628\u062f\u0626\u064a" },
            ],
          },
        },
      });

      const phase3 = await tx.eventPhase.create({
        data: {
          eventId: hackathon2.id,
          name: "Development",
          nameAr: "\u0627\u0644\u062a\u0637\u0648\u064a\u0631",
          phaseNumber: 3,
          phaseType: "DEVELOPMENT",
          status: "UPCOMING",
          startDate: tomorrow,
          endDate: dayAfterTomorrow,
          deliverableConfig: {
            fields: [
              { type: "description", enabled: true, required: true, label: "\u0648\u0635\u0641 \u0627\u0644\u0645\u0634\u0631\u0648\u0639" },
              { type: "repository", enabled: true, required: true, label: "\u0631\u0627\u0628\u0637 \u0627\u0644\u0643\u0648\u062f (GitHub)" },
              { type: "demo", enabled: true, required: false, label: "\u0631\u0627\u0628\u0637 \u0627\u0644\u062a\u062c\u0631\u0628\u0629 (Demo)" },
            ],
          },
        },
      });

      const phase4 = await tx.eventPhase.create({
        data: {
          eventId: hackathon2.id,
          name: "Presentation",
          nameAr: "\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062a\u0642\u062f\u064a\u0645\u064a",
          phaseNumber: 4,
          phaseType: "PRESENTATION",
          status: "UPCOMING",
          startDate: dayAfterTomorrow,
          endDate: threeDaysFromNow,
        },
      });

      const phase5 = await tx.eventPhase.create({
        data: {
          eventId: hackathon2.id,
          name: "Final Judging",
          nameAr: "\u0627\u0644\u062a\u062d\u0643\u064a\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064a",
          phaseNumber: 5,
          phaseType: "JUDGING",
          status: "UPCOMING",
          startDate: threeDaysFromNow,
          endDate: threeDaysFromNow,
        },
      });

      summary.push(`5 phases created for Thaka'thon`);

      // ================================================================
      // C3. Schedule Items for Thaka'thon
      // ================================================================
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const dayAfterTomorrowDate = new Date(todayDate);
      dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2);
      const threeDaysDate = new Date(todayDate);
      threeDaysDate.setDate(threeDaysDate.getDate() + 3);

      const scheduleItems = [
        // ── Today ──
        {
          eventId: hackathon2.id,
          phaseId: phase2.id,
          title: "Opening Ceremony",
          titleAr: "\u062d\u0641\u0644 \u0627\u0644\u0627\u0641\u062a\u062a\u0627\u062d \u0648\u0627\u0644\u062a\u0639\u0627\u0631\u0641",
          description: "Welcome session and team introductions",
          descriptionAr: "\u062c\u0644\u0633\u0629 \u062a\u0631\u062d\u064a\u0628\u064a\u0629 \u0648\u062a\u0639\u0627\u0631\u0641 \u0628\u064a\u0646 \u0627\u0644\u0641\u0631\u0642",
          type: "CEREMONY" as const,
          date: todayDate,
          startTime: "09:00",
          endTime: "09:30",
          isOnline: false,
          isInPerson: true,
          location: "Main Hall",
          locationAr: "\u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
          sortOrder: 1,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase2.id,
          title: "AI Design Thinking Workshop",
          titleAr: "\u0648\u0631\u0634\u0629 \u0627\u0644\u062a\u0641\u0643\u064a\u0631 \u0627\u0644\u062a\u0635\u0645\u064a\u0645\u064a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
          description: "Learn how to use AI tools in design thinking process",
          descriptionAr: "\u062a\u0639\u0644\u0651\u0645 \u0643\u064a\u0641 \u062a\u0633\u062a\u062e\u062f\u0645 \u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0641\u064a \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u062a\u0641\u0643\u064a\u0631 \u0627\u0644\u062a\u0635\u0645\u064a\u0645\u064a",
          type: "WORKSHOP" as const,
          date: todayDate,
          startTime: "10:00",
          endTime: "12:00",
          isOnline: true,
          isInPerson: false,
          onlineLink: "https://zoom.us/j/example-workshop-1",
          speaker: "Dr. Ahmed Alharbi",
          speakerAr: "\u062f. \u0623\u062d\u0645\u062f \u0627\u0644\u062d\u0631\u0628\u064a",
          sortOrder: 2,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase2.id,
          title: "Mentoring Session",
          titleAr: "\u062c\u0644\u0633\u0629 \u0625\u0631\u0634\u0627\u062f \u0645\u0639 \u0627\u0644\u0645\u0648\u062c\u0647\u064a\u0646",
          description: "One-on-one mentoring with industry experts",
          descriptionAr: "\u062c\u0644\u0633\u0629 \u0625\u0631\u0634\u0627\u062f \u0641\u0631\u062f\u064a\u0629 \u0645\u0639 \u062e\u0628\u0631\u0627\u0621 \u0627\u0644\u0635\u0646\u0627\u0639\u0629",
          type: "MENTORING" as const,
          date: todayDate,
          startTime: "14:00",
          endTime: "15:30",
          isOnline: true,
          isInPerson: true,
          onlineLink: "https://teams.microsoft.com/l/meetup-join/example",
          location: "Mentoring Room B",
          locationAr: "\u0642\u0627\u0639\u0629 \u0627\u0644\u0625\u0631\u0634\u0627\u062f B",
          sortOrder: 3,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase2.id,
          title: "Initial Idea Submission Deadline",
          titleAr: "\u0622\u062e\u0631 \u0645\u0648\u0639\u062f \u0644\u062a\u0633\u0644\u064a\u0645 \u0648\u0635\u0641 \u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u0645\u0628\u062f\u0626\u064a",
          type: "DEADLINE" as const,
          date: todayDate,
          startTime: "23:59",
          isOnline: false,
          isInPerson: false,
          sortOrder: 4,
        },
        // ── Tomorrow ──
        {
          eventId: hackathon2.id,
          phaseId: phase2.id,
          title: "UI/UX Design Workshop",
          titleAr: "\u0648\u0631\u0634\u0629 \u062a\u0635\u0645\u064a\u0645 \u0648\u0627\u062c\u0647\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
          type: "WORKSHOP" as const,
          date: tomorrowDate,
          startTime: "10:00",
          endTime: "12:00",
          isOnline: false,
          isInPerson: true,
          location: "Design Lab",
          locationAr: "\u0645\u0639\u0645\u0644 \u0627\u0644\u062a\u0635\u0645\u064a\u0645",
          speaker: "Sara Almutairi",
          speakerAr: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0645\u0637\u064a\u0631\u064a",
          sortOrder: 1,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase2.id,
          title: "Q&A with Judges Panel",
          titleAr: "\u062c\u0644\u0633\u0629 \u0623\u0633\u0626\u0644\u0629 \u0648\u0623\u062c\u0648\u0628\u0629 \u0645\u0639 \u0644\u062c\u0646\u0629 \u0627\u0644\u062a\u062d\u0643\u064a\u0645",
          type: "SESSION" as const,
          date: tomorrowDate,
          startTime: "14:00",
          endTime: "15:00",
          isOnline: true,
          isInPerson: false,
          onlineLink: "https://teams.microsoft.com/l/meetup-join/qa-session",
          sortOrder: 2,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase3.id,
          title: "Prototyping Workshop",
          titleAr: "\u0648\u0631\u0634\u0629 \u0628\u0646\u0627\u0621 \u0627\u0644\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0623\u0648\u0644\u064a\u0629",
          type: "WORKSHOP" as const,
          date: tomorrowDate,
          startTime: "16:00",
          endTime: "17:30",
          isOnline: true,
          isInPerson: false,
          onlineLink: "https://zoom.us/j/example-prototyping",
          speaker: "Khalid Alzahrani",
          speakerAr: "\u062e\u0627\u0644\u062f \u0627\u0644\u0632\u0647\u0631\u0627\u0646\u064a",
          sortOrder: 3,
        },
        // ── Day After Tomorrow ──
        {
          eventId: hackathon2.id,
          phaseId: phase3.id,
          title: "Effective Project Presentation Workshop",
          titleAr: "\u0648\u0631\u0634\u0629 \u0639\u0631\u0636 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0628\u0641\u0639\u0627\u0644\u064a\u0629",
          type: "WORKSHOP" as const,
          date: dayAfterTomorrowDate,
          startTime: "10:00",
          endTime: "12:00",
          isOnline: true,
          isInPerson: false,
          sortOrder: 1,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase3.id,
          title: "Final Project Submission Deadline",
          titleAr: "\u0622\u062e\u0631 \u0645\u0648\u0639\u062f \u0644\u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0646\u0647\u0627\u0626\u064a",
          type: "DEADLINE" as const,
          date: dayAfterTomorrowDate,
          startTime: "18:00",
          isOnline: false,
          isInPerson: false,
          sortOrder: 2,
        },
        // ── Three Days From Now ──
        {
          eventId: hackathon2.id,
          phaseId: phase4.id,
          title: "Team Presentations",
          titleAr: "\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062a\u0642\u062f\u064a\u0645\u064a\u0629 \u0644\u0644\u0641\u0631\u0642",
          type: "PRESENTATION" as const,
          date: threeDaysDate,
          startTime: "10:00",
          endTime: "12:00",
          isOnline: false,
          isInPerson: true,
          location: "Main Hall",
          locationAr: "\u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
          sortOrder: 1,
        },
        {
          eventId: hackathon2.id,
          phaseId: phase5.id,
          title: "Closing Ceremony & Results",
          titleAr: "\u062d\u0641\u0644 \u0627\u0644\u062e\u062a\u0627\u0645 \u0648\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0646\u062a\u0627\u0626\u062c",
          type: "CEREMONY" as const,
          date: threeDaysDate,
          startTime: "14:00",
          endTime: "16:00",
          isOnline: false,
          isInPerson: true,
          location: "Main Hall",
          locationAr: "\u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
          sortOrder: 2,
        },
      ];

      await tx.eventScheduleItem.createMany({ data: scheduleItems });
      summary.push(`${scheduleItems.length} schedule items created for Thaka'thon`);

      // ================================================================
      // D. Challenge - Smart Contract Analysis Challenge (COMPLETED)
      // ================================================================
      const challengeSlug = "smart-contract-analysis-challenge-2025";

      const challengeEvent = await tx.event.upsert({
        where: { slug: challengeSlug },
        update: {
          status: "COMPLETED",
        },
        create: {
          organizationId: org.id,
          title: "Smart Contract Analysis Challenge",
          titleAr: "\u062a\u062d\u062f\u064a \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u0630\u0643\u064a",
          slug: challengeSlug,
          type: "CHALLENGE",
          category: "LEGAL",
          status: "COMPLETED",
          startDate: new Date("2025-09-01"),
          endDate: new Date("2025-09-30"),
          primaryColor: "#2563EB",
          registrationMode: "INDIVIDUAL",
        },
      });
      summary.push(
        `Challenge event upserted: "${challengeEvent.title}" (${challengeEvent.id})`
      );

      // EventMember for challenge
      await tx.eventMember.upsert({
        where: {
          eventId_userId_role: {
            eventId: challengeEvent.id,
            userId: user.id,
            role: "PARTICIPANT",
          },
        },
        update: { status: "APPROVED" },
        create: {
          eventId: challengeEvent.id,
          userId: user.id,
          role: "PARTICIPANT",
          status: "APPROVED",
          approvedAt: new Date("2025-09-01"),
        },
      });
      summary.push(`EventMember created for Challenge`);

      // Certificate for Challenge
      const cert2No = `CERT-CH-${user.id.slice(-6)}`;
      let cert2 = await tx.certificate.findUnique({
        where: { certificateNo: cert2No },
      });
      if (!cert2) {
        cert2 = await tx.certificate.create({
          data: {
            userId: user.id,
            eventId: challengeEvent.id,
            type: "PARTICIPATION",
            title: "Challenge Participation",
            titleAr: "\u0634\u0647\u0627\u062f\u0629 \u0645\u0634\u0627\u0631\u0643\u0629 \u0641\u064a \u0627\u0644\u062a\u062d\u062f\u064a",
            certificateNo: cert2No,
            rank: null,
            totalScore: 78,
            isTeam: false,
            issuedAt: new Date("2025-10-01"),
          },
        });
      }
      summary.push(
        `Certificate created: "${cert2.title}" (${cert2.certificateNo})`
      );

      // ================================================================
      // E. Seed Notifications
      // ================================================================
      // Delete old notifications for this user first (idempotent)
      await tx.notification.deleteMany({ where: { userId: user.id } });

      const notifications = [
        // Read notifications (old events)
        {
          userId: user.id,
          type: "EVENT" as const,
          title: "تم قبول طلب انضمامك",
          titleAr: "تم قبول طلب انضمامك",
          message: `تم قبولك في ${hackathon1.titleAr}. نتمنى لك تجربة مميزة!`,
          messageAr: `تم قبولك في ${hackathon1.titleAr}. نتمنى لك تجربة مميزة!`,
          data: { eventId: hackathon1.id, action: "accepted" },
          isRead: true,
          readAt: new Date("2025-05-16"),
          createdAt: new Date("2025-05-15"),
        },
        {
          userId: user.id,
          type: "TEAM" as const,
          title: "تمت إضافتك لفريق",
          titleAr: "تمت إضافتك لفريق",
          message: `تمت إضافتك كقائدة لفريق "${team1.nameAr}" في ${hackathon1.titleAr}`,
          messageAr: `تمت إضافتك كقائدة لفريق "${team1.nameAr}" في ${hackathon1.titleAr}`,
          data: { teamId: team1.id, eventId: hackathon1.id },
          isRead: true,
          readAt: new Date("2025-05-17"),
          createdAt: new Date("2025-05-16"),
        },
        {
          userId: user.id,
          type: "EVALUATION" as const,
          title: "تم نشر نتائج التقييم",
          titleAr: "تم نشر نتائج التقييم",
          message: `تم نشر نتائج التقييم النهائي في ${hackathon1.titleAr}. حصل فريقك على 87.5 نقطة`,
          messageAr: `تم نشر نتائج التقييم النهائي في ${hackathon1.titleAr}. حصل فريقك على 87.5 نقطة`,
          data: { eventId: hackathon1.id, score: 87.5 },
          isRead: true,
          readAt: new Date("2025-06-18"),
          createdAt: new Date("2025-06-17"),
        },
        {
          userId: user.id,
          type: "CERTIFICATE" as const,
          title: "تم إصدار شهادة",
          titleAr: "تم إصدار شهادة",
          message: `تهانينا! تم إصدار شهادة المركز الثاني لك في ${hackathon1.titleAr}`,
          messageAr: `تهانينا! تم إصدار شهادة المركز الثاني لك في ${hackathon1.titleAr}`,
          data: { eventId: hackathon1.id, certificateNo: cert1.certificateNo },
          isRead: true,
          readAt: new Date("2025-06-19"),
          createdAt: new Date("2025-06-18"),
        },
        // Unread notifications (current events)
        {
          userId: user.id,
          type: "EVENT" as const,
          title: "تم قبول طلب انضمامك",
          titleAr: "تم قبول طلب انضمامك",
          message: `تم قبولك في ${hackathon2.titleAr}. استعدي للمنافسة!`,
          messageAr: `تم قبولك في ${hackathon2.titleAr}. استعدي للمنافسة!`,
          data: { eventId: hackathon2.id, action: "accepted" },
          isRead: false,
          createdAt: new Date("2026-02-18"),
        },
        {
          userId: user.id,
          type: "TEAM" as const,
          title: "تمت إضافتك لفريق",
          titleAr: "تمت إضافتك لفريق",
          message: `تمت إضافتك كقائدة لفريق "${team2.nameAr || team2.name}" في ${hackathon2.titleAr}`,
          messageAr: `تمت إضافتك كقائدة لفريق "${team2.nameAr || team2.name}" في ${hackathon2.titleAr}`,
          data: { teamId: team2.id, eventId: hackathon2.id },
          isRead: false,
          createdAt: new Date("2026-02-19"),
        },
        {
          userId: user.id,
          type: "ANNOUNCEMENT" as const,
          title: "إعلان: ورشة عمل",
          titleAr: "إعلان: ورشة عمل",
          message: "ورشة عمل الذكاء الاصطناعي التطبيقي - يوم الأربعاء الساعة 4 عصراً",
          messageAr: "ورشة عمل الذكاء الاصطناعي التطبيقي - يوم الأربعاء الساعة 4 عصراً",
          data: { eventId: hackathon2.id, workshopTitle: "الذكاء الاصطناعي التطبيقي" },
          isRead: false,
          createdAt: new Date("2026-02-22"),
        },
        {
          userId: user.id,
          type: "REMINDER" as const,
          title: "تذكير: موعد التسليم",
          titleAr: "تذكير: موعد التسليم",
          message: "باقي يومين على تسليم مرحلة التطوير. تأكدي من رفع جميع المتطلبات",
          messageAr: "باقي يومين على تسليم مرحلة التطوير. تأكدي من رفع جميع المتطلبات",
          data: { eventId: hackathon2.id, phaseType: "DEVELOPMENT" },
          isRead: false,
          createdAt: new Date("2026-02-23"),
        },
      ];

      await tx.notification.createMany({ data: notifications });
      summary.push(`${notifications.length} notifications created (4 read + 4 unread)`);

      return {
        userId: user.id,
        email: user.email,
        hackathon1Id: hackathon1.id,
        hackathon2Id: hackathon2.id,
        challengeId: challengeEvent.id,
        team1Id: team1.id,
        team2Id: team2.id,
        certificate1No: cert1.certificateNo,
        certificate2No: cert2.certificateNo,
        notificationsCreated: notifications.length,
        summary,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Test participant seeded successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Seed test participant error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed test participant",
        details: message,
      },
      { status: 500 }
    );
  }
}
