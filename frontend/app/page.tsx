import Script from "next/script";
import * as m from "@/paraglide/messages";
import { languageTag } from "@/paraglide/runtime";
import { SITE_URL } from "@/lib/site";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { MarketProof } from "@/components/landing/market-proof";
import { ROIAndProfitLogic } from "@/components/landing/roi-profit";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductModes } from "@/components/landing/product-modes";
import { FAQSection, getFaqs } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { PricingSection } from "./pricing";

export async function generateMetadata() {
  const lang = languageTag();
  const canonicalUrl = lang === "ar" ? SITE_URL : `${SITE_URL}/${lang}`;
  return {
    title: m.meta_title(),
    description: m.meta_description(),
    keywords: m.page_meta_keywords().split(", "),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": SITE_URL,
        "ar": SITE_URL,
        "en": `${SITE_URL}/en`,
      },
    },
  };
}

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: m.schema_app_name(),
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: m.schema_app_desc(),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: m.schema_org_name(),
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        "https://www.facebook.com/tijaratk",
        "https://www.instagram.com/tijaratk",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: m.schema_website_name(),
      url: SITE_URL,
      description: m.schema_website_desc(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: getFaqs().map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
  ];

  return (
    <main className="pb-16 md:pb-0">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <Hero />
      <MarketProof />
      <ROIAndProfitLogic />
      <Features />
      <HowItWorks />
      <ProductModes />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}
