import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes require admin roles
    if (pathname.startsWith("/admin")) {
      const roles = (token?.roles as string[]) || [];
      const isAdmin = roles.some((r) =>
        ["super_admin", "platform_admin"].includes(r)
      );
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/organization/:path*", "/event/:path*", "/researcher/:path*"],
};
