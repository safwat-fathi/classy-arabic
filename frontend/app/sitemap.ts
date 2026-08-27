import type { MetadataRoute } from "next";
import { availableLanguageTags } from "@/paraglide/runtime";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {

  // Create alternates for each language
  const alternates = {
    languages: availableLanguageTags.reduce((acc, lang) => {
      // The Arabic lang is root '/', English is '/en'
      const prefix = lang === "ar" ? "" : `/${lang}`;
      return { ...acc, [lang]: `${SITE_URL}${prefix}` };
    }, { "x-default": SITE_URL } as Record<string, string>),
  };

  const routes = [""];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`, // Use default route as primary (Arabic)
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        Object.entries(alternates.languages).map(([lang, url]) => [
          lang,
          `${url}${route}`,
        ])
      ),
    },
  }));
}
