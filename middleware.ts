import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PLAYER_COOKIE } from "@/lib/constants";

// /admin gates itself with the PIN cookie (it needs to render its own login
// form on the same route), so it's excluded here. Everything else needs a
// player selected first. This only checks cookie presence — Prisma needs the
// Node runtime, not the Edge runtime middleware runs in — so a stale/deleted
// player id is caught later by requirePlayer() in the page itself.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/select-player")) {
    return NextResponse.next();
  }

  if (!request.cookies.has(PLAYER_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/select-player";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
