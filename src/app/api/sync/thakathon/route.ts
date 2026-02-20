import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const THAKATHON_API = "https://thakathon.com/api/admin/teams?password=thakathon2026admin";
const THAKATHON_SLUG = "thakathon-2026";

// Track name mapping: Thakathon API track name -> our track nameAr
const TRACK_MAP: Record<string, string> = {
  education: "التعليم",
  tourism: "السياحة والثقافة",
  healthcare: "الرعاية الصحية",
  law: "القانون",
  hajj: "الحج والعمرة",
  "hajj_umrah": "الحج والعمرة",
};

interface ThakathonMember {
  full_name: string;
  personal_email: string;
  university_email: string;
  student_id: string;
  college: string;
  major: string;
  role: string;
  leader: string;
  tech_link: string;
}

interface ThakathonTeam {
  id: number;
  team_name: string;
  team_code: string;
  track: string;
  status: string;
  member_count: number;
  members: ThakathonMember[];
  registered_at: string;
  sources: string;
  club: string;
}

export async function GET() {
  try {
    // Fetch teams from Thakathon API
    const res = await fetch(THAKATHON_API, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Thakathon API", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (!data.success || !data.teams) {
      return NextResponse.json(
        { error: "Invalid response from Thakathon API", data },
        { status: 502 }
      );
    }

    const teams: ThakathonTeam[] = data.teams;

    // Find the Thakathon event
    const event = await prisma.event.findUnique({
      where: { slug: THAKATHON_SLUG },
      include: { tracks: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: `Event ${THAKATHON_SLUG} not found` },
        { status: 404 }
      );
    }

    const defaultPassword = await bcrypt.hash("Thakathon@2026", 12);

    // Get participant role for auto-assignment
    const participantRole = await prisma.platformRole.findUnique({
      where: { name: "participant" },
    });

    let synced = 0;
    let usersCreated = 0;
    let membersLinked = 0;

    for (const apiTeam of teams) {
      // Match track
      const trackNameAr = TRACK_MAP[apiTeam.track.toLowerCase()] || null;
      const track = trackNameAr
        ? event.tracks.find((t) => t.nameAr === trackNameAr)
        : null;

      // Map status
      const teamStatus =
        apiTeam.status === "accepted" ? "ACTIVE" as const :
        apiTeam.status === "rejected" ? "DISQUALIFIED" as const :
        "FORMING" as const;

      // Upsert team (unique by eventId + name)
      const team = await prisma.team.upsert({
        where: {
          eventId_name: { eventId: event.id, name: apiTeam.team_code },
        },
        update: {
          nameAr: apiTeam.team_name,
          trackId: track?.id || null,
          status: teamStatus,
          description: `${apiTeam.team_code} | Track: ${apiTeam.track} | Members: ${apiTeam.member_count} | Registered: ${apiTeam.registered_at}`,
        },
        create: {
          eventId: event.id,
          name: apiTeam.team_code,
          nameAr: apiTeam.team_name,
          trackId: track?.id || null,
          status: teamStatus,
          description: `${apiTeam.team_code} | Track: ${apiTeam.track} | Members: ${apiTeam.member_count} | Registered: ${apiTeam.registered_at}`,
        },
      });

      // Sync team members
      for (const member of apiTeam.members) {
        const email = member.university_email || member.personal_email;
        if (!email) continue;

        // Split Arabic name into first/last
        const nameParts = member.full_name.trim().split(/\s+/);
        const firstNameAr = nameParts[0] || member.full_name;
        const lastNameAr = nameParts.slice(1).join(" ") || "";

        // Upsert user
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            firstNameAr,
            lastNameAr,
            bio: `${member.college} - ${member.major} | ${member.role}`,
          },
          create: {
            email,
            password: defaultPassword,
            firstName: member.full_name.split(" ")[0],
            firstNameAr,
            lastName: member.full_name.split(" ").slice(1).join(" ") || "-",
            lastNameAr,
            phone: null,
            isActive: true,
            isVerified: true,
            language: "ar",
            bio: `${member.college} - ${member.major} | ${member.role}`,
            nationalId: member.student_id || null,
          },
        });
        usersCreated++;

        // Assign participant role if not already assigned
        if (participantRole) {
          await prisma.userPlatformRole.upsert({
            where: {
              userId_roleId: { userId: user.id, roleId: participantRole.id },
            },
            update: {},
            create: { userId: user.id, roleId: participantRole.id },
          });
        }

        // Link user to team
        const memberRole = member.leader === "نعم" ? "LEADER" as const : "MEMBER" as const;
        await prisma.teamMember.upsert({
          where: {
            teamId_userId: { teamId: team.id, userId: user.id },
          },
          update: { role: memberRole, isActive: true },
          create: {
            teamId: team.id,
            userId: user.id,
            role: memberRole,
          },
        });
        membersLinked++;

        // Add as event PARTICIPANT member
        try {
          await prisma.eventMember.create({
            data: {
              eventId: event.id,
              userId: user.id,
              role: "PARTICIPANT",
              status: "APPROVED",
              approvedAt: new Date(),
              trackId: track?.id || null,
            },
          });
        } catch {
          // Already exists - ignore duplicate
        }
      }

      synced++;
    }

    // Store last sync time
    await prisma.eventSetting.upsert({
      where: {
        eventId_key: { eventId: event.id, key: "thakathon_last_sync" },
      },
      update: { value: new Date().toISOString() },
      create: {
        eventId: event.id,
        key: "thakathon_last_sync",
        value: new Date().toISOString(),
      },
    });

    await prisma.eventSetting.upsert({
      where: {
        eventId_key: { eventId: event.id, key: "thakathon_total_teams" },
      },
      update: { value: String(data.total) },
      create: {
        eventId: event.id,
        key: "thakathon_total_teams",
        value: String(data.total),
      },
    });

    return NextResponse.json({
      success: true,
      synced,
      usersCreated,
      membersLinked,
      totalFromAPI: data.total,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Thakathon sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
