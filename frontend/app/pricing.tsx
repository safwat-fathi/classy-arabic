"use client";

import { useState } from "react";
import Link from "next/link";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function PricingSection() {
  const [aiEnabled, setAiEnabled] = useState(false);

  return (
    <section
      id="pricing"
      className="border-t border-gray-200 bg-gray-50 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="text-sm font-extrabold tracking-wide text-emerald-700">
              الأسعار
            </span>
            <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              باقة تناسب حجم بيزنسك
            </h2>
            <p className="text-[15px] leading-loose text-gray-500">
              اختر باقة إدارة الكتالوج الأساسية، وأضف الذكاء الاصطناعي لو حابب
              أتمتة المحادثات بالكامل.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
            <button
              onClick={() => setAiEnabled(false)}
              className={`rounded-lg px-5 py-2.5 text-[13.5px] font-bold transition-all ${
                !aiEnabled
                  ? "bg-gray-100 text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              الوضع الأساسي (بدون ذكاء اصطناعي)
            </button>
            <button
              onClick={() => setAiEnabled(true)}
              className={`rounded-lg px-5 py-2.5 text-[13.5px] font-bold transition-all ${
                aiEnabled
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-emerald-700"
              }`}
            >
              إضافة الذكاء الاصطناعي
            </button>
          </div>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {/* Starter Plan */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
              الأساسية (Starter)
            </h3>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-500">
              للبائع المستقل أو الصفحات والمتاجر الناشئة.
            </p>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900 transition-all">
                {aiEnabled ? 499 + 250 : 499}
              </span>
              <span className="text-[13px] font-bold text-gray-500">
                جنيه / شهريًا
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              ابدأ الآن
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                "ربط صفحات فيسبوك وإنستجرام",
                "عرض الكتالوج والشراء عبر الأزرار والقوائم",
                "تفريغ للإكسيل",
                ...(aiEnabled
                  ? [
                      "فهم اللغة العامية والفرانكو",
                      "استخراج الطلبات من النصوص العشوائية",
                    ]
                  : []),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13.5px] text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Plan */}
          <div className="relative flex flex-col rounded-2xl border border-emerald-700 bg-[#0a0f0d] p-6.5 shadow-2xl">
            <span className="absolute -top-3.5 start-6.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white">
              الأكثر شيوعًا
            </span>
            <h3 className="mt-2 mb-1.5 text-base font-extrabold text-white">
              النمو (Growth)
            </h3>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-400">
              للمتاجر النشطة ذات الحملات الإعلانية المستمرة.
            </p>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-white transition-all">
                {aiEnabled ? 749 + 350 : 749}
              </span>
              <span className="text-[13px] font-bold text-gray-400">
                جنيه / شهريًا
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              ابدأ الآن
            </Link>
            <ul className="flex flex-col gap-3 border-t border-white/10 pt-5">
              {[
                "دعم واتساب بيزنس",
                "تصدير تلقائي مباشر لـ Google Sheets",
                ...(aiEnabled
                  ? [
                      "تصعيد ذكي للمواقف المعقدة (L2)",
                      "الإجابة من سياسات المتجر (Store Knowledge)",
                    ]
                  : []),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-400" />
                  <span className="text-[13.5px] text-gray-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
              المحترفين (Pro)
            </h3>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-500">
              للبراندات والمتاجر الكبيرة ذات حجم الطلبيات المرتفع.
            </p>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900 transition-all">
                {aiEnabled ? 1199 + 450 : 1199}
              </span>
              <span className="text-[13px] font-bold text-gray-500">
                جنيه / شهريًا
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              ابدأ الآن
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                "مستخدمين متعددين لإدارة الطلبات",
                "دعم فني مباشر وأولوية ربط",
                ...(aiEnabled
                  ? [
                      "تحليلات أداء الذكاء الاصطناعي التفصيلية",
                      "أولوية معالجة في أوقات الذروة",
                    ]
                  : []),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13.5px] text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {aiEnabled && (
          <p className="mt-8 text-center text-[12.5px] text-gray-400">
            * ملحق الذكاء الاصطناعي خاضع لسياسة الاستخدام العادل حسب كل باقة.
          </p>
        )}
      </div>
    </section>
  );
}
