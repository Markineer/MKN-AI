import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PERMISSIONS, ROLES } from "@/types/permissions";

// POST /api/seed/roles-permissions
// Seeds all permissions, roles, and role-permission associations.
// Also assigns the org-admin user to the organization_admin platform role.
export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const summary: string[] = [];

      // ================================================================
      // 1. Create all permissions
      // ================================================================
      let permCreated = 0;
      for (const perm of PERMISSIONS) {
        await tx.permission.upsert({
          where: { code: perm.code },
          update: {
            name: perm.name,
            nameAr: perm.nameAr,
            description: perm.description,
            module: perm.module,
            action: perm.action,
            resource: perm.resource,
          },
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
        permCreated++;
      }
      summary.push(`${permCreated} permissions upserted`);

      // ================================================================
      // 2. Create all roles with their permission associations
      // ================================================================
      for (const role of ROLES) {
        const createdRole = await tx.platformRole.upsert({
          where: { name: role.name },
          update: {
            nameAr: role.nameAr,
            description: role.description,
            descriptionAr: role.descriptionAr,
            level: role.level,
            color: role.color,
            icon: role.icon,
          },
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

        // Delete existing role-permission associations and recreate
        await tx.rolePermission.deleteMany({
          where: { roleId: createdRole.id },
        });

        let linkedCount = 0;
        for (const permCode of role.permissions) {
          const permission = await tx.permission.findUnique({
            where: { code: permCode },
          });
          if (permission) {
            await tx.rolePermission.create({
              data: {
                roleId: createdRole.id,
                permissionId: permission.id,
              },
            });
            linkedCount++;
          }
        }
        summary.push(
          `Role "${role.nameAr}" (${role.name}) → ${linkedCount}/${role.permissions.length} permissions`
        );
      }

      // ================================================================
      // 3. Assign org-admin@uqu.edu.sa to organization_admin platform role
      // ================================================================
      const orgAdminUser = await tx.user.findUnique({
        where: { email: "org-admin@uqu.edu.sa" },
      });
      const orgAdminRole = await tx.platformRole.findUnique({
        where: { name: "organization_admin" },
      });

      if (orgAdminUser && orgAdminRole) {
        await tx.userPlatformRole.upsert({
          where: {
            userId_roleId: {
              userId: orgAdminUser.id,
              roleId: orgAdminRole.id,
            },
          },
          update: {},
          create: {
            userId: orgAdminUser.id,
            roleId: orgAdminRole.id,
          },
        });
        summary.push(
          `Assigned ${orgAdminUser.email} → ${orgAdminRole.nameAr}`
        );
      }

      // ================================================================
      // 4. Assign admin@elm.sa (if exists in DB) to super_admin role
      // ================================================================
      const adminElm = await tx.user.findUnique({
        where: { email: "admin@elm.sa" },
      });
      const superAdminRole = await tx.platformRole.findUnique({
        where: { name: "super_admin" },
      });

      if (adminElm && superAdminRole) {
        await tx.userPlatformRole.upsert({
          where: {
            userId_roleId: {
              userId: adminElm.id,
              roleId: superAdminRole.id,
            },
          },
          update: {},
          create: {
            userId: adminElm.id,
            roleId: superAdminRole.id,
          },
        });
        summary.push(`Assigned ${adminElm.email} → ${superAdminRole.nameAr}`);
      }

      return { summary };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Roles and permissions seeded successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Seed roles-permissions error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed roles and permissions",
        details: message,
      },
      { status: 500 }
    );
  }
}
