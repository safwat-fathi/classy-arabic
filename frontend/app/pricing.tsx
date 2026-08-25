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
  const [isYearly, setIsYearly] = useState(false);

  // Helper to calculate price with optional AI and optional 20% yearly discount
  const getPrice = (base: number, aiPrice: number) => {
    let total = base + (aiEnabled ? aiPrice : 0);
    if (isYearly) {
      total = Math.round(total * 0.8);
    }
    return total;
  };

  return (
    <section
      id="pricing"
      className="border-t border-gray-200 bg-gray-50 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 flex flex-col items-center text-center">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            الأسعار
          </span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            استثمار بسيط يغطي تكلفته من أول يوم
          </h2>
          <p className="mb-6 text-[15px] leading-loose text-gray-500">
            اختر الباقة المناسبة لحجم أعمالك، وأضف الذكاء الاصطناعي لو حابب أتمتة المحادثات بالكامل.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-lg px-5 py-2 text-[13px] font-bold transition-all ${
                  !isYearly
                    ? "bg-gray-100 text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                اشتراك شهري
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-lg px-5 py-2 text-[13px] font-bold transition-all ${
                  isYearly
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-emerald-700"
                }`}
              >
                اشتراك سنوي (خصم 20%)
              </button>
            </div>

            {/* AI Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setAiEnabled(false)}
                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-all ${
                  !aiEnabled
                    ? "bg-gray-100 text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                الوضع الأساسي
              </button>
              <button
                onClick={() => setAiEnabled(true)}
                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                  aiEnabled
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-purple-700"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"/></svg>
                بإضافة الذكاء الاصطناعي
              </button>
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {/* Starter Plan */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
              الأساسية (Starter)
            </h3>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900 transition-all">
                {getPrice(499, 250)}
              </span>
              <span className="text-[13px] font-bold text-gray-500">
                ج.م / شهريًا
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              ابدأ التجربة المجانية
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                "حتى 150 أوردر شهريًا",
                "ربط فيسبوك وإنستجرام",
                "وضع الكتالوج التفاعلي بالكامل (سلة + تصفح)",
                "تصدير فوري للأوردرات إلى إكسيل / شيتس",
                "لوحة تحكم لإدارة المنتجات والطلبات",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13px] leading-relaxed text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Plan */}
          <div className="relative flex flex-col rounded-2xl border border-emerald-700 bg-[#0a0f0d] p-6.5 shadow-2xl">
            <span className="absolute -top-3.5 start-6.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white">
              الأكثر طلبًا
            </span>
            <h3 className="mt-2 mb-1.5 text-base font-extrabold text-white">
              النمو (Growth)
            </h3>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-white transition-all">
                {getPrice(749, 350)}
              </span>
              <span className="text-[13px] font-bold text-gray-400">
                ج.م / شهريًا
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              ابدأ تجربتك الآن
            </Link>
            <ul className="flex flex-col gap-3 border-t border-white/10 pt-5">
              {[
                "حتى 600 أوردر شهريًا",
                "ربط فيسبوك + إنستجرام + واتساب",
                "وضع الكتالوج التفاعلي + بحث متقدم",
                "دعم كامل لفهم العامية والفرانكو (مع باقة الـ AI)",
                "الرد التلقائي على الأسئلة الشائعة وسياسات الاستبدال",
                "تعدد المستخدمين مع ميزة التحويل البشري الفوري",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-400" />
                  <span className="text-[13px] leading-relaxed text-gray-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
              المحترفين (Pro)
            </h3>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900 transition-all">
                {getPrice(1199, 450)}
              </span>
              <span className="text-[13px] font-bold text-gray-500">
                ج.م / شهريًا
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              اشترك في باقة المحترفين
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                "أوردرات غير محدودة شهريًا",
                "ربط غير محدود للقنوات والمتاجر",
                "أعلى أولوية في سرعة معالجة المحادثات بالذكاء الاصطناعي",
                "تخصيص متقدم لردود الـ AI وقواعد العمل المعقدة",
                "مدير حساب مخصص ودعم فني مباشر عبر واتساب",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13px] leading-relaxed text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-xl bg-white p-5 border border-gray-200 text-[13px] text-gray-600">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">💳</span>
            <p><strong>طرق دفع محلية مريحة:</strong> InstaPay، محافظ الموبايل (فودافون كاش، أورنج، اتصالات، وي)، والبطاقات البنكية.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5">🌐</span>
            <p><strong>شفافية رسائل ميتا:</strong> رسائل محادثات Meta/WhatsApp تُحسب بشفافية تامة وبدون أي هوامش ربحية مضافة.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
