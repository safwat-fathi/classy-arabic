import type { NextRequest } from "next/server";
import { middleware as i18nMiddleware } from "@/lib/i18n";

import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/merchant")) {
    const token = request.cookies.get("tijaratk_token");
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
