import Image from "next/image";

const STEPS = [
  {
    label: "الخطوة 1",
    title: "اربط صفحاتك",
    body: "وصّل صفحة فيسبوك، إنستجرام، أو واتساب بدون أي أوراق أو سجلات تجارية معقدة.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 5H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1z" />
        <path d="M22 6l-10 7L2 6" />
      </svg>
    ),
  },
  {
    label: "الخطوة 2",
    title: "ارفع منتجاتك",
    body: "أضف كتالوج منتجاتك، الأسعار، المقاسات المتاحة، ومناطق الشحن بضغطة زر.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.59 13.41L11 3.83A2 2 0 009.59 3H4a1 1 0 00-1 1v5.59a2 2 0 00.59 1.41l9.58 9.59a2 2 0 002.83 0l4.59-4.59a2 2 0 000-2.83z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </svg>
    ),
  },
  {
    label: "الخطوة 3",
    title: "استقبل الأوردرات والأرباح",
    body: "النظام يتولى الرد، إتمام السلة، وتجهيز شيت الأوردرات لشركة الشحن فوراً!",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h6M7 17h4" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            كيف تبدأ؟
          </span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            ابدأ استقبال أوردراتك الآلية في دقائق معدودة
          </h2>
        </div>
        <div className="grid gap-7 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="flex flex-col gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                {step.icon}
              </div>
              <div>
                <div className="mb-1 text-xs font-extrabold text-gray-400">
                  {step.label}
                </div>
                <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
