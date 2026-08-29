import type { Metadata } from "next";
import { languageTag } from "@/paraglide/runtime";
import * as m from "@/paraglide/messages";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@inlang/paraglide-next";
import { SITE_URL } from "@/lib/site";

import { Analytics } from "@/components/analytics";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800", "900"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    title: m.meta_title(),
    description: m.meta_description(),
    openGraph: {
      title: m.meta_og_title(),
      siteName: m.schema_website_name(),
      locale: languageTag(),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: m.meta_og_title(),
      description: m.meta_description(),
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [
        { url: "/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
        { url: "/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
        { url: "/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
        { url: "/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
        { url: "/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
        { url: "/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
        { url: "/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
        { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "apple-touch-icon-precomposed",
          url: "/apple-icon-precomposed.png",
        },
      ],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = languageTag();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageProvider>
      <html
        lang={lang}
        dir={dir}
        className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {children}
          <Analytics />
        </body>
      </html>
    </LanguageProvider>
  );
}
