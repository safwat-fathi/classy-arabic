import { NextRequest, NextResponse } from "next/server";
import { getFeaturesMarkdown } from "@/lib/content/features-content";

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") || "ar";
  const markdown = getFeaturesMarkdown(lang);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Markdown-Target": "AI-Agent-Crawler",
    },
  });
}
