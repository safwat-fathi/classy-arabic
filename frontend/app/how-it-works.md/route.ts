import { NextRequest, NextResponse } from "next/server";
import { getHowItWorksMarkdown } from "@/lib/content/how-it-works-content";

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") || "ar";
  const markdown = getHowItWorksMarkdown(lang);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Markdown-Target": "AI-Agent-Crawler",
    },
  });
}
