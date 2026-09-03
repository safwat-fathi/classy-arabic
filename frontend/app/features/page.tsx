import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/nav";
import { FinalCTA } from "@/components/landing/final-cta";
import { FEATURE_PILLARS } from "@/lib/content/features-content";

export const metadata: Metadata = {
  title: "المميزات والإمكانيات | تِجارتك بوت",
  description:
    "استكشف إمكانيات تِجارتك بوت: محرك الذكاء الاصطناعي العامي، الكتالوج التفاعلي وسلة الشراء داخل الشات، وتفريغ بيانات الشحن المصرية بدقة 100%.",
  alternates: {
    canonical: "https://tijaratk.com/features",
    types: {
      "text/markdown": "https://tijaratk.com/features.md",
    },
  },
  openGraph: {
    title: "مميزات تِجارتك بوت | منصة التجارة الذكية عبر السوشيال ميديا",
    description:
      "فهم العامية المصرية، سلة تسوق تفاعلية داخل الشات، وتفريغ تلقائي لبيانات الشحن.",
    url: "https://tijaratk.com/features",
  },
};

export default function FeaturesPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "تِجارتك بوت — المميزات والإمكانيات",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://tijaratk.com/features",
      description:
        "إمكانيات ومميزات منصة تِجارتك بوت: محرك الذكاء الاصطناعي العامي، الكتالوج التفاعلي، تفريغ العناوين المصرية، وصندوق الرسائل الموحد.",
      featureList: FEATURE_PILLARS.map((p) => p.title.ar),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "مميزات تِجارتك بوت",
      itemListElement: FEATURE_PILLARS.map((pillar, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: pillar.title.ar,
        description: pillar.description.ar,
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
          name: "المميزات",
          item: "https://tijaratk.com/features",
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

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            إمكانيات غير مسبوقة للتجارة الإلكترونية
          </span>
          <h1 className="font-display mt-4 mb-4 text-3xl font-black text-gray-950 sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            مميزات صُممت خصيصاً <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              لطبيعة وثقافة البيع في السوق المصري
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-gray-600 sm:text-[18px]">
            مش مجرد روبوت ردود تقليدي؛ بل منظومة بيع متكاملة تفهم عامية الشارع،
            تعرض الكتالوج بالسلة التفاعلية، وتفرغ بيانات الشحن في ثوانٍ.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
            >
              شاهد العرض التوضيحي المباشر
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-gray-300 bg-gray-50 px-7 py-3.5 text-sm font-bold text-gray-800 hover:bg-gray-100"
            >
              خطط الأسعار والاستخدام العادل
            </Link>
          </div>

          {/* AI crawler note */}
          <div className="mt-6 text-xs text-gray-400">
            متاح كنسخة ماركداون لوكلاء الذكاء الاصطناعي على:{" "}
            <a href="/features.md" className="underline hover:text-emerald-600">
              /features.md
            </a>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-20 sm:gap-28">
            {FEATURE_PILLARS.map((pillar, idx) => {
              const isEven = idx % 2 === 1;

              return (
                <div
                  key={pillar.id}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
                >
                  {/* Visual Card */}
                  <div
                    className={`order-2 ${
                      isEven ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-9 shadow-sm hover:shadow-md transition-all">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                          {pillar.highlightCard.title.ar}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          FEATURE #{idx + 1}
                        </span>
                      </div>

                      {/* Highlight Card Content */}
                      {pillar.highlightCard.type === "chat" && (
                        <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          {pillar.highlightCard.items?.map((item, i) => (
                            <div
                              key={i}
                              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                i === 0
                                  ? "bg-gray-200/80 text-gray-900 self-end rounded-tr-none max-w-[85%]"
                                  : "bg-emerald-600 text-white self-start rounded-tl-none max-w-[90%] shadow-sm"
                              }`}
                            >
                              <span className="block text-[11px] font-bold opacity-80 mb-1">
                                {item.label.ar}:
                              </span>
                              {item.value.ar}
                            </div>
                          ))}
                        </div>
                      )}

                      {pillar.highlightCard.type === "stats" && (
                        <div className="grid grid-cols-3 gap-3">
                          {pillar.highlightCard.items?.map((item, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center justify-center rounded-2xl bg-emerald-50/60 p-4 text-center border border-emerald-100"
                            >
                              <span className="font-display text-xl sm:text-2xl font-black text-emerald-700">
                                {item.value.ar}
                              </span>
                              <span className="mt-1 text-[11px] font-bold text-gray-600 leading-snug">
                                {item.label.ar}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {pillar.highlightCard.type === "address" && (
                        <div className="flex flex-col gap-2.5">
                          {pillar.highlightCard.items?.map((item, i) => (
                            <div
                              key={i}
                              className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs"
                            >
                              <span className="block font-bold text-gray-500 mb-0.5">
                                {item.label.ar}:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {item.value.ar}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text Details */}
                  <div
                    className={`order-1 ${
                      isEven ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <span className="inline-flex rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 mb-3">
                      {pillar.badge.ar}
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 mb-3 leading-snug">
                      {pillar.title.ar}
                    </h2>
                    <p className="text-sm font-bold text-emerald-700 mb-4 leading-relaxed">
                      {pillar.tagline.ar}
                    </p>
                    <p className="text-[14.5px] leading-relaxed text-gray-600 mb-6">
                      {pillar.description.ar}
                    </p>

                    <ul className="flex flex-col gap-3.5">
                      {pillar.bulletPoints.map((bp, bpIdx) => (
                        <li key={bpIdx} className="flex items-start gap-3">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                            ✓
                          </span>
                          <div>
                            <strong className="block text-sm font-black text-gray-900">
                              {bp.title.ar}
                            </strong>
                            <span className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              {bp.desc.ar}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Architecture Badge */}
      <section className="px-5 py-16 sm:px-8 bg-gray-900 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            HIGH-PERFORMANCE ARCHITECTURE
          </span>
          <h2 className="font-display mt-3 mb-4 text-2xl sm:text-4xl font-black text-white">
            بنية تحتية سحابية فائقة السرعة والأمان
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-400 mb-10 leading-relaxed">
            يعتمد تِجارتك بوت على خوادم فائقة الأداء ونماذج استدلال لحظية لضمان ردود
            في أجزاء من الثانية مع الحفاظ على خصوصية بيانات العملاء وسجلات المبيعات.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <span className="text-2xl mb-2 block">⚡</span>
              <p className="text-base font-black text-white">1.8 ثانية</p>
              <p className="text-xs text-gray-400">متوسط سرعة الرد اللحظي</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <span className="text-2xl mb-2 block">🔒</span>
              <p className="text-base font-black text-white">Meta Cloud API</p>
              <p className="text-xs text-gray-400">اعتماد رسمي 100% بدون حظر</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <span className="text-2xl mb-2 block">🧠</span>
              <p className="text-base font-black text-white">DeepSeek Dialect</p>
              <p className="text-xs text-gray-400">نموذج ذكاء اصطناعي مدرب مصرياً</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <span className="text-2xl mb-2 block">📊</span>
              <p className="text-base font-black text-white">Google Sheets Sync</p>
              <p className="text-xs text-gray-400">تفريغ وتصدير لحظي للأوردرات</p>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}
