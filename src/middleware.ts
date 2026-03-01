import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const roles = (token?.roles as string[]) || [];

    const isAdmin = roles.some((r) =>
      ["super_admin", "platform_admin"].includes(r)
    );
    const isOrgAdmin = roles.includes("organization_admin");
    const isJudge = roles.includes("judge");

    // /admin/* → super_admin or platform_admin only
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // /organization/* → admin or org admin only
    if (pathname.startsWith("/organization") && !isAdmin && !isOrgAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // /event/* → admin or org admin only
    if (pathname.startsWith("/event") && !isAdmin && !isOrgAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // /judge/* → admin or judge only
    if (pathname.startsWith("/judge") && !isAdmin && !isJudge) {
      return NextResponse.redirect(new URL("/", req.url));
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
  matcher: ["/admin/:path*", "/organization/:path*", "/event/:path*", "/researcher/:path*", "/ai-models/:path*", "/judge/:path*", "/profile/:path*", "/team/:path*", "/my-events/:path*", "/notifications/:path*"],
};
