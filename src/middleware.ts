import { NextResponse, type NextRequest } from "next/server";

/**
 * Coarse gate for the workspace: presence of a session cookie.
 * The authoritative check (does this token exist, is it expired, who is it?)
 * happens server-side in `app/admin/(workspace)/layout.tsx`, because the
 * session store is SQLite and cannot be read from the edge runtime.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("jb_session")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/admin/login" && request.cookies.get("jb_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
