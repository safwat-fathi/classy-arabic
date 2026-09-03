import { NextRequest, NextResponse } from "next/server";
import { getArticleMarkdown } from "@/lib/content/blog-content";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const lang = request.nextUrl.searchParams.get("lang") || "ar";
  const markdown = getArticleMarkdown(slug, lang);

  if (!markdown) {
    return new NextResponse("Article not found", { status: 404 });
  }

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Markdown-Target": "AI-Agent-Crawler",
    },
  });
}
