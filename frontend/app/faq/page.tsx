import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { FinalCTA } from "@/components/landing/final-cta";
import { FAQ_ITEMS } from "@/lib/content/faq-content";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة | تِجارتك بوت",
  description:
    "إجابات واضحة ومفصلة عن محرك الذكاء الاصطناعي، وفهم العامية والفرانكو، والربط الرسمي مع فيسبوك وإنستجرام وواتساب، واستخراج بيانات الشحن المصرية.",
  alternates: {
    canonical: "https://tijaratk.com/faq",
    types: {
      "text/markdown": "https://tijaratk.com/faq.md",
    },
  },
  openGraph: {
    title: "الأسئلة الشائعة | كل ما يخص تِجارتك بوت",
    description:
      "إجابات كاملة حول أتمتة مبيعات السوشيال ميديا وخدمة العملاء بالذكاء الاصطناعي.",
    url: "https://tijaratk.com/faq",
  },
};

export default function FaqPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question.ar,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.ar,
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
          name: "الأسئلة الشائعة",
          item: "https://tijaratk.com/faq",
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

      {/* Header */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            مركز المساعدة والإجابات الشاملة
          </span>
          <h1 className="font-display mt-4 mb-4 text-3xl font-black text-gray-950 sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            الأسئلة الشائعة.. <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              كل ما تحتاج لمعرفته بالتفصيل
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-gray-600 sm:text-[18px]">
            إجابات واضحة ومباشرة عن محرك الذكاء الاصطناعي، وطريقة فهم العامية،
            والربط مع فيسبوك وإنستجرام وواتساب، واستخراج بيانات الشحن.
          </p>

          {/* AI crawler note */}
          <div className="mt-6 text-xs text-gray-400">
            متاح كنسخة ماركداون لوكلاء الذكاء الاصطناعي على:{" "}
            <a href="/faq.md" className="underline hover:text-emerald-600">
              /faq.md
            </a>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section with Client Island */}
      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <FaqClient />

          {/* Need More Help Box */}
          <div className="mt-16 rounded-3xl border border-gray-200 bg-white p-8 text-center sm:p-10 shadow-sm">
            <h3 className="text-xl font-black text-gray-950 mb-2">
              عندك سؤال مش موجود هنا؟
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              فريقنا جاهز يجاوبك فوراً ويوضحلك إزاي تِجارتك بوت هيناسب متجرك بالظبط.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/demo"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                جرب النظام في شات تفاعلي
              </a>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-gray-300 bg-gray-50 px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100"
              >
                تحدث معنا عبر واتساب
              </a>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}
