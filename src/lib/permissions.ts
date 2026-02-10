import prisma from "./prisma";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/types/permissions";

/**
 * Get all permissions for a user (platform-level + organization + event)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      platformRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) return [];

  const permissions = new Set<string>();

  for (const userRole of userWithRoles.platformRoles) {
    // Check role expiry
    if (userRole.expiresAt && userRole.expiresAt < new Date()) continue;

    for (const rolePermission of userRole.role.permissions) {
      permissions.add(rolePermission.permission.code);
    }
  }

  return Array.from(permissions);
}

/**
 * Get user permissions within a specific organization
 */
export async function getUserOrgPermissions(
  userId: string,
  organizationId: string
): Promise<{ role: string; permissions: string[] }> {
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });

  if (!member || !member.isActive) return { role: "", permissions: [] };

  // Organization roles map to platform role permissions
  const roleMap: Record<string, string> = {
    OWNER: "organization_admin",
    ADMIN: "organization_admin",
    DEPARTMENT_HEAD: "event_manager",
    COORDINATOR: "event_manager",
    MEMBER: "viewer",
  };

  const platformRole = await prisma.platformRole.findUnique({
    where: { name: roleMap[member.role] || "viewer" },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!platformRole) return { role: member.role, permissions: [] };

  return {
    role: member.role,
    permissions: platformRole.permissions.map((rp) => rp.permission.code),
  };
}

/**
 * Get user permissions within a specific event
 */
export async function getUserEventPermissions(
  userId: string,
  eventId: string
): Promise<{ roles: string[]; permissions: string[] }> {
  const members = await prisma.eventMember.findMany({
    where: { eventId, userId, status: "APPROVED" },
  });

  if (members.length === 0) return { roles: [], permissions: [] };

  const roleMap: Record<string, string> = {
    ORGANIZER: "event_manager",
    SUPERVISOR: "event_manager",
    JUDGE: "judge",
    MENTOR: "mentor",
    EXPERT: "expert",
    PARTICIPANT: "participant",
    OBSERVER: "viewer",
    COORDINATOR: "event_manager",
  };

  const allPermissions = new Set<string>();
  const roles: string[] = [];

  for (const member of members) {
    roles.push(member.role);
    const roleName = roleMap[member.role] || "viewer";
    const platformRole = await prisma.platformRole.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (platformRole) {
      for (const rp of platformRole.permissions) {
        allPermissions.add(rp.permission.code);
      }
    }

    // Add custom permissions from event member
    if (member.permissions) {
      const customPerms = member.permissions as string[];
      customPerms.forEach((p) => allPermissions.add(p));
    }
  }

  return {
    roles,
    permissions: Array.from(allPermissions),
  };
}

/**
 * Check if user can perform action.
 * Accepts optional sessionPermissions from JWT token (covers DEV_USERS too).
 */
export async function canUser(
  userId: string,
  permission: string,
  context?: { organizationId?: string; eventId?: string; sessionPermissions?: string[] }
): Promise<boolean> {
  // Check session-level permissions first (from JWT token – works for DEV_USERS and DB users)
  if (context?.sessionPermissions && hasPermission(context.sessionPermissions, permission)) {
    return true;
  }

  // Check platform-level permissions from DB
  const platformPerms = await getUserPermissions(userId);
  if (hasPermission(platformPerms, permission)) return true;

  // Check organization-level permissions
  if (context?.organizationId) {
    const orgPerms = await getUserOrgPermissions(
      userId,
      context.organizationId
    );
    if (hasPermission(orgPerms.permissions, permission)) return true;
  }

  // Check event-level permissions
  if (context?.eventId) {
    const eventPerms = await getUserEventPermissions(userId, context.eventId);
    if (hasPermission(eventPerms.permissions, permission)) return true;
  }

  return false;
}

export { hasPermission, hasAnyPermission, hasAllPermissions };
