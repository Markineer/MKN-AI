import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Dev-mode admin accounts (no DB required)
const DEV_USERS = [
  {
    id: "dev-admin-elm",
    email: "admin@elm.sa",
    password: "Admin@123",
    name: "Admin ELM",
    nameAr: "مدير علم",
    roles: ["super_admin"],
    permissions: ["platform.manage", "platform.settings.manage", "users.manage", "organizations.manage", "events.manage"],
    language: "ar",
  },
  {
    id: "dev-admin-markineer",
    email: "admin@markineer.sa",
    password: "Admin@123",
    name: "Admin Markineer",
    nameAr: "مدير ماركنير",
    roles: ["super_admin"],
    permissions: ["platform.manage", "platform.settings.manage", "users.manage", "organizations.manage", "events.manage"],
    language: "ar",
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Try dev-mode accounts first (always available)
        const devUser = DEV_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (devUser) {
          return {
            id: devUser.id,
            email: devUser.email,
            name: devUser.name,
            nameAr: devUser.nameAr,
            roles: devUser.roles,
            permissions: devUser.permissions,
            language: devUser.language,
          } as any;
        }

        // Try database auth if available
        try {
          const bcrypt = await import("bcryptjs");
          const { default: prisma } = await import("@/lib/prisma");

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              platformRoles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!user || !user.isActive) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          const permissions = new Set<string>();
          const roles: string[] = [];
          for (const ur of user.platformRoles) {
            roles.push(ur.role.name);
            for (const rp of ur.role.permissions) {
              permissions.add(rp.permission.code);
            }
          }

          // Get organization memberships
          const orgMemberships = await prisma.organizationMember.findMany({
            where: { userId: user.id },
            select: { organizationId: true, role: true },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            nameAr: `${user.firstNameAr || user.firstName} ${user.lastNameAr || user.lastName}`,
            image: user.avatar,
            roles,
            permissions: Array.from(permissions),
            language: user.language,
            orgMemberships,
          } as any;
        } catch {
          // Database not available - only dev accounts work
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
        token.nameAr = (user as any).nameAr;
        token.language = (user as any).language;
        token.orgMemberships = (user as any).orgMemberships || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles;
        (session.user as any).permissions = token.permissions;
        (session.user as any).nameAr = token.nameAr;
        (session.user as any).language = token.language;
        (session.user as any).orgMemberships = token.orgMemberships || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
