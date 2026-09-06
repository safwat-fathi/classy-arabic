import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { FinalCTA } from "@/components/landing/final-cta";
import {
  PRICING_TIERS,
  FAIR_USAGE_TERMS,
  PAYMENT_METHODS,
  PRICING_FAQS,
} from "@/lib/content/pricing-content";
import { PricingTable } from "./pricing-table";

export const metadata: Metadata = {
  title: "باقات وأسعار تِجارتك بوت | استثمار رابح لتجارتك",
  description:
    "باقات أسعار واضحة بدون مصاريف خفية مع استخدام عادل سخي للذكاء الاصطناعي. اختر الباقة المناسبة لحجم متجرك وجرب أول 30 أوردر مجاناً.",
  alternates: {
    canonical: "https://tijaratk.com/pricing",
    types: {
      "text/markdown": "https://tijaratk.com/pricing.md",
    },
  },
  openGraph: {
    title: "أسعار تِجارتك بوت | خطط مرنة واستخدام عادل للذكاء الاصطناعي",
    description: "امتلك النظام لمتجرك وادفع مرة واحدة فقط، لتجارة أوتوماتيكية داخل فيسبوك وواتساب.",
    url: "https://tijaratk.com/pricing",
  },
};



export default function PricingPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "تِجارتك بوت (TijaratkBot)",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://tijaratk.com/pricing",
      description:
        "باقات أسعار تِجارتك بوت لأتمتة مبيعات السوشيال ميديا وخدمة العملاء بالذكاء الاصطناعي العامي.",
      offers: PRICING_TIERS.map((tier) => ({
        "@type": "Offer",
        name: tier.name.ar,
        price: tier.basePrice.toString(),
        priceCurrency: "EGP",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        url: `https://tijaratk.com/pricing#${tier.id}`,
        description: tier.description.ar,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PRICING_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q.ar,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a.ar,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "الرئيسية",
          item: "https://tijaratk.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "الأسعار",
          item: "https://tijaratk.com/pricing",
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafbfc] text-gray-900 selection:bg-emerald-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            باقات مرنة واستثمار رابح لتجارتك
          </div>
          <h1 className="font-display mt-4 mb-4 text-3xl font-black text-gray-950 sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            أسعار شفافة بدون مفاجآت.. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              واستخدام عادل وسخي للذكاء الاصطناعي
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-gray-600 sm:text-[18px]">
            اختر الباقة المناسبة لحجم طلبات متجرك. كل باقة تمنحك متجراً تفاعلياً داخل الشات
            يعمل 24 ساعة ويقفل الأوردرات بدون أخطاء.
          </p>

          {/* AI crawler note */}
          <div className="mt-4 text-xs text-gray-400">
            متاح كنسخة ماركداون لوكلاء الذكاء الاصطناعي على:{" "}
            <a href="/pricing.md" className="underline hover:text-emerald-600">
              /pricing.md
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Cards via Client Island */}
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <PricingTable />
        </div>
      </section>


      {/* Fair Usage Terms Section */}
      <section className="px-5 py-16 sm:px-8 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              راحة بال كاملة للتاجر
            </span>
            <h2 className="font-display mt-3 text-2xl sm:text-4xl font-black text-gray-950">
              {FAIR_USAGE_TERMS.title.ar}
            </h2>
            <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
              {FAIR_USAGE_TERMS.subtitle.ar}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {FAIR_USAGE_TERMS.principles.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300 transition-all"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-base font-black text-gray-950">
                    {item.title.ar}
                  </h3>
                </div>
                <p className="text-[13.5px] leading-relaxed text-gray-600">
                  {item.desc.ar}
                </p>
              </div>
            ))}
          </div>

          {/* Notice Box */}
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-col sm:flex-row items-center gap-4 text-emerald-950">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xl">
              ✓
            </div>
            <div className="text-center sm:text-right">
              <h4 className="text-sm font-black mb-1">
                مبدأنا: مساعدتك على مضاعفة المبيعات، وليس فرض قيود خانقة
              </h4>
              <p className="text-xs leading-relaxed text-emerald-800">
                لو حققت حملتك الإعلانية مبيعات خرافية وزادت المحادثات، البوت شغال معاك للاخر
                وهنباركلك ونتواصل معاك بكل سلاسة لتنسيق الخطوة الجاية بدون أي إزعاج.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Payment Methods */}
      <section className="px-5 py-12 sm:px-8 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-lg font-black text-gray-900 mb-6">
            طرق دفع محلية مريحة وموثوقة 100% داخل مصر
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {PAYMENT_METHODS.map((pm, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-center hover:bg-white hover:shadow-sm transition-all"
              >
                <p className="text-sm font-black text-gray-900 mb-1">{pm.name}</p>
                <p className="text-xs text-gray-500">{pm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing FAQs */}
      <section className="px-5 py-16 sm:px-8 bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              أسئلة شائعة حول باقات وتكاليف الخدمة
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {PRICING_FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-right font-bold text-gray-900 hover:text-emerald-700">
                  <span className="text-[14.5px] leading-snug">{faq.q.ar}</span>
                  <span className="text-lg text-emerald-600 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-5 pb-5 pt-3 text-[13.5px] leading-relaxed text-gray-600">
                  {faq.a.ar}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}

