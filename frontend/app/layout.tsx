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
