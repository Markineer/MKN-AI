import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      nameAr: string;
      image?: string;
      roles: string[];
      permissions: string[];
      language: string;
    };
  }

  interface User {
    id: string;
    roles: string[];
    permissions: string[];
    nameAr: string;
    language: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
    nameAr: string;
    language: string;
  }
}
