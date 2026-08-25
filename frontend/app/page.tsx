import Script from "next/script";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { MarketProof } from "@/components/landing/market-proof";
import { ROIAndProfitLogic } from "@/components/landing/roi-profit";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductModes } from "@/components/landing/product-modes";
import { FAQSection, FAQS } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { PricingSection } from "./pricing";

export const metadata = {
  title:
    "تِجارتك بوت | منصة البيع الذكي وأتمتة أوردرات فيسبوك، إنستجرام وواتساب",
  description:
    "حوّل شات السوشيال ميديا لمتجر إلكتروني متكامل يبيع 24/7. تصفح الكتالوج داخل الشات، رد فوري بالذكاء الاصطناعي يفهم العامية والفرانكو، وتفريغ تلقائي لبيانات الشحن بدون أخطاء. جرب أول 30 أوردر مجاناً!",
  keywords: [
    "منصة تجارة إلكترونية ذكية",
    "بوت فيسبوك ماسنجر للتجارة",
    "الرد الآلي على العملاء",
    "نظام إدارة طلبات فيسبوك",
    "شات بوت ذكاء اصطناعي",
    "التجارة عبر المحادثات مصر",
    "أتمتة طلبات واتساب",
    "تفريغ بيانات الشحن آلياً",
    "بيع أونلاين بدون موقع",
    "مساعد مبيعات ذكي",
    "الرد على رسائل إنستجرام",
    "استخراج بيانات شات العملاء",
    "بيع عبر السوشيال ميديا",
    "Social Commerce CRM Egypt",
    "Order Bot",
    "AI Order Bot",
    "Order Management System",
    "AI Order Management System",
    "AI Order Management System Egypt",
  ],
};

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "تِجارتك بوت (Tijaratk)",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
        description: "تجربة مجانية لأول 30 أوردر",
      },
      description:
        "منصة التجارة عبر المحادثات الأولى في مصر. أتمتة الردود، الكتالوج، وتأكيد طلبات فيسبوك وإنستجرام وواتساب بذكاء اصطناعي يفهم العامية.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "تِجارتك",
      url: "https://tijaratk.com",
      logo: "https://tijaratk.com/logo.png",
      sameAs: [
        "https://www.facebook.com/tijaratk",
        "https://www.instagram.com/tijaratk",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "تِجارتك بوت",
      url: "https://tijaratk.com",
      description: "منصة التجارة الذكية الأولى في مصر عبر السوشيال ميديا.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
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
