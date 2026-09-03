import type { MetadataRoute } from "next";
import { availableLanguageTags } from "@/paraglide/runtime";
import { SITE_URL } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/content/blog-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Helper to build alternate language links according to Next.js metadata documentation
  const getAlternates = (route: string) => ({
    languages: Object.fromEntries([
      ["x-default", `${SITE_URL}${route}`],
      ...availableLanguageTags.map((lang) => [
        lang,
        `${SITE_URL}${lang === "ar" ? "" : `/${lang}`}${route}`,
      ]),
    ]),
  });

  const now = new Date();

  // Core static pages with explicit search engine priorities
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: getAlternates(""),
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: getAlternates("/pricing"),
    },
    {
      url: `${SITE_URL}/features`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: getAlternates("/features"),
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates("/how-it-works"),
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates("/faq"),
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: getAlternates("/blog"),
    },
    {
      url: `${SITE_URL}/sitemap`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
      alternates: getAlternates("/sitemap"),
    },
  ];

  // Dynamic blog articles loaded directly from source
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    alternates: getAlternates(`/blog/${post.slug}`),
  }));

  return [...staticRoutes, ...blogRoutes];
}
