import type { NextRequest } from "next/server";
import { middleware as i18nMiddleware } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
