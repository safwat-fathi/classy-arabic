import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/nav";
import { FinalCTA } from "@/components/landing/final-cta";
import { HOW_IT_WORKS_STEPS } from "@/lib/content/how-it-works-content";

export const metadata: Metadata = {
  title: "كيف يعمل تِجارتك بوت؟ | الدليل التشغيلي للمتاجر",
  description:
    "تعرف على رحلة تحويل رسائل فيسبوك وإنستجرام وواتساب إلى أوردرات حقيقية مؤكدة وجاهزة للشحن في 5 خطوات ذكية وتلقائية بالكامل.",
  alternates: {
    canonical: "https://tijaratk.com/how-it-works",
    types: {
      "text/markdown": "https://tijaratk.com/how-it-works.md",
    },
  },
  openGraph: {
    title: "كيف يعمل تِجارتك بوت؟ | من أول رسالة لبوليصة الشحن",
    description:
      "5 خطوات تشغيلية ذكية لأتمتة مبيعات السوشيال ميديا بالذكاء الاصطناعي العامي.",
    url: "https://tijaratk.com/how-it-works",
  },
};

export default function HowItWorksPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "كيف يعمل تِجارتك بوت لأتمتة مبيعات السوشيال ميديا",
      description:
        "دليل تشغيلي تفصيلي يوضح كيفية تحويل رسائل شات فيسبوك وإنستجرام وواتساب إلى أوردرات حقيقية مؤكدة في 5 خطوات.",
      totalTime: "PT10M",
      step: HOW_IT_WORKS_STEPS.map((step, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        name: step.title.ar,
        text: step.description.ar,
        url: `https://tijaratk.com/how-it-works#step-${step.number}`,
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
          name: "كيف يعمل",
          item: "https://tijaratk.com/how-it-works",
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
            الدليل التشغيلي للمتاجر
          </span>
          <h1 className="font-display mt-4 mb-4 text-3xl font-black text-gray-950 sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            كيف يعمل تِجارتك بوت؟ <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              من أول رسالة في الشات.. لحد بوليصة الشحن
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-gray-600 sm:text-[18px]">
            رحلة أوتوماتيكية متكاملة في 5 خطوات ذكية تحول رسائل فيسبوك وإنستجرام وواتساب
            إلى طلبات جاهزة للشحن بدون أي تضييع لوقتك أو مجهودك.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
            >
              جرب المحاكاة التفاعلية الآن
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-gray-300 bg-gray-50 px-7 py-3.5 text-sm font-bold text-gray-800 hover:bg-gray-100"
            >
              عرض الباقات والأسعار
            </Link>
          </div>

          {/* AI crawler note */}
          <div className="mt-6 text-xs text-gray-400">
            متاح كنسخة ماركداون لوكلاء الذكاء الاصطناعي على:{" "}
            <a href="/how-it-works.md" className="underline hover:text-emerald-600">
              /how-it-works.md
            </a>
          </div>
        </div>
      </section>

      {/* 5-Step Narrative Section */}
      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="relative flex flex-col gap-16 sm:gap-24">
            {/* Connecting line on desktop */}
            <div className="absolute end-[2.5rem] top-12 bottom-12 hidden w-0.5 bg-gradient-to-b from-emerald-600 via-teal-500 to-gray-200 lg:block -z-0" />

            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.number}
                className="relative z-10 grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center"
              >
                {/* Visual Example Card */}
                <div className="order-2 lg:order-1 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
                      {step.visualExample.metaBadge?.ar || "جاهز للتشغيل الفوري"}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      STEP {step.number} PREVIEW
                    </span>
                  </div>

                  {/* Chat Simulation */}
                  {step.visualExample.userMessage && (
                    <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
                      <div className="self-end rounded-2xl rounded-tr-none bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-medium text-white max-w-[85%] shadow-sm">
                        {step.visualExample.userMessage.ar}
                      </div>
                      <div className="self-start rounded-2xl rounded-tl-none bg-white p-4 text-xs sm:text-sm font-medium text-gray-800 max-w-[90%] border border-gray-200 shadow-sm leading-relaxed">
                        <p>{step.visualExample.botResponse?.ar}</p>
                        <div className="mt-3 flex gap-2">
                          <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm inline-block">
                            إضافة للسلة 🛍️
                          </span>
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 inline-block">
                            تصفح الألوان
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Simulation */}
                  {step.visualExample.extractedData && (
                    <div className="flex flex-col gap-2 rounded-2xl bg-emerald-50/40 p-4 border border-emerald-100">
                      <div className="text-xs font-black text-emerald-900 mb-1 flex items-center gap-1.5">
                        <span>✓</span> بيانات الشحن المستخرجة آلياً بدون أخطاء:
                      </div>
                      {step.visualExample.extractedData.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2 text-xs border border-gray-100"
                        >
                          <span className="font-bold text-gray-500">{row.key.ar}</span>
                          <span className="font-mono font-bold text-gray-900">{row.value.ar}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Outcome Tag */}
                  <div className="mt-4 flex items-start gap-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <span className="text-emerald-600 font-black">🎯 المكسب:</span>
                    <span className="font-semibold">{step.merchantOutcome.ar}</span>
                  </div>
                </div>

                {/* Step Description */}
                <div className="order-1 lg:order-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 font-display text-xl font-black text-white shadow-md mb-4">
                    {step.number}
                  </div>
                  <span className="block text-xs font-black uppercase tracking-wider text-emerald-700 mb-1">
                    {step.stepName.ar}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-950 mb-2 leading-snug">
                    {step.title.ar}
                  </h2>
                  <p className="text-sm font-bold text-gray-500 mb-4">
                    {step.subtitle.ar}
                  </p>
                  <p className="text-[14.5px] leading-relaxed text-gray-600">
                    {step.description.ar}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After Comparison */}
      <section className="px-5 py-16 sm:px-8 bg-white border-y border-gray-200">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              الفرق على أرض الواقع
            </span>
            <h2 className="font-display mt-3 text-2xl sm:text-4xl font-black text-gray-950">
              إدارة الشات التقليدية vs تِجارتك بوت
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              شوف إزاي بتتحول الفوضى اليومية لنظام سلس بيجيب فلوس وأنت مرتاح
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* The Old Way */}
            <div className="rounded-3xl border border-red-200 bg-red-50/40 p-6 sm:p-8">
              <div className="mb-4 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                ❌ الطريقة القديمة (المودريتور اليدوي)
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  الرد بيتأخر نص ساعة أو ساعة، والعميل بيزهق ويشتري من صفحة تانية.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  المودريتور بينسى يسجل أوردر أو بيكتب رقم التليفون ناقص رقم.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  تفريغ يدوي مرهق بعد نص الليل عشان تسلم شيت الشحن الصبح.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  مصاريف شهرية ضخمة لمرتبات المودريتورز بدون أي ضمان للأداء.
                </li>
              </ul>
            </div>

            {/* The Tijaratk Way */}
            <div className="rounded-3xl border border-emerald-300 bg-emerald-50/50 p-6 sm:p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                ✓ طريقة تِجارتك بوت (الذكاء الاصطناعي 24/7)
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-800 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  رد فوري في ثانيتين، واستغلال لحظة حماس العميل للشراء بنسبة تحويل 3 أضعاف.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  فحص دقيق للعناوين المصرية وأرقام الموبايل وتأكيد صحتها قبل الاعتماد.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  مزامنة لحظية في Google Sheets وبوليصة شحن جاهزة بضغطة زر واحدة.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  تكلفة اشتراك بسيطة جداً وعائد أرباح فوري بدون إجازات أو أخطاء بشرية.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}
