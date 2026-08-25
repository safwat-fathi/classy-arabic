import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { BrandMark } from "./logo";
import { PricingSection } from "./pricing";

export const metadata = {
  title: "تِجارتك | منصة البيع الذكي وأتمتة أوردرات فيسبوك، إنستجرام وواتساب",
  description:
    "حوّل شات السوشيال ميديا لمتجر إلكتروني متكامل يبيع 24/7. تصفح الكتالوج داخل الشات، رد فوري بالذكاء الاصطناعي يفهم العامية والفرانكو، وتفريغ تلقائي لبيانات الشحن بدون أخطاء. جرب أول 30 أوردر مجاناً!",
  keywords: [
    "بوت أوردرات فيسبوك",
    "أتمتة مبيعات إنستجرام",
    "شات بوت تجارة إلكترونية",
    "إدارة مبيعات واتساب",
    "استخراج بيانات شات العملاء",
    "بيع عبر السوشيال ميديا",
    "Social Commerce CRM Egypt",
  ],
};

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

function Nav() {
  return (
    <>
      <div className="bg-emerald-700 text-white px-4 py-2.5 text-center text-[13.5px] font-bold">
        🔥 إحصائية رسمية: 93% من طلبات الأونلاين في مصر بتتم داخل الشات.. وفّر
        وقت الرد وابدأ بيع بذكاء الآن!{" "}
        <Link href="/demo" className="underline hover:text-emerald-200 ms-1">
          ابدأ تجربتك المجانية 🚀
        </Link>
      </div>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              كيف يعمل
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              المميزات
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              الأسعار
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              الأسئلة الشائعة
            </a>
          </nav>
          <Link
            href="/demo"
            className="inline-flex min-h-10 items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            جرّب مجانًا
          </Link>
        </div>
      </header>
    </>
  );
}

function Hero() {
  return (
    <section
      className="relative"
      style={{
        background:
          "radial-gradient(1100px 520px at 82% -10%, rgba(16,185,129,0.24), transparent 60%), radial-gradient(700px 420px at 8% 110%, rgba(16,185,129,0.14), transparent 55%), #0a0f0d",
      }}
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 pt-8 pb-16 sm:px-8 sm:pt-12 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-16 lg:pb-28">
        <div>
          <h1 className="font-display mb-5 text-4xl leading-tight font-black text-white sm:text-5xl lg:text-6xl">
            مش محتاج موقع إلكتروني.. <br /> شات الفيسبوك هو متجرك الآلكتروني
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-loose text-gray-400">
            اربط كتالوج منتجاتك بفيسبوك، إنستجرام، وواتساب في مكان واحد. عميلك
            هيشوف منتجاتك ويطلب مباشرة من الشات من خلال{" "}
            <strong className="text-gray-300">كتالوج تفاعلي منظم</strong> و{" "}
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 p-2 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] leading-relaxed">
              <span className="text-[13px]">✨</span> ذكاء اصطناعي
            </span>{" "}
            يفهم أسئلة واستفسارات عملاءك ويرد عليهم و يقفل الاوردرز تلقائيا.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 mb-5">
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-6.5 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              🚀 ابدأ تجربتك المجانية (30 أوردر علينا)
            </Link>
            <a
              href="#example"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-6.5 py-3.5 text-[15px] font-semibold text-gray-200 transition-colors hover:bg-white/10"
            >
              📱 جرّب شات تجريبي حي الآن
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="text-emerald-500 w-4 h-4" /> بدون الحاجة
              لبطاقة بنكية
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 text-base">⚡</span> إعداد متجرك
              في دقيقتين
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 text-base">🔒</span> الأسعار
              والمخزون مؤكدة 100%
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4.5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-gray-500">
                محادثة واردة &middot; ماسنجر
              </span>
            </div>
            <div
              dir="ltr"
              className="max-w-[84%] self-start rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-gray-900 text-left font-medium"
            >
              3ayz 2 tshirt aswd XL w whed abyad L f 15 shary el tahrir el dokki
            </div>
            <div className="flex items-center gap-2 self-start rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              </svg>
              <span>جاري الفهم وتحديد المخزون...</span>
            </div>

            {/* Split Screen Logic Representation */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                  تيشيرت
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-extrabold text-gray-900">
                    2x تيشيرت أساسي أسود (XL)
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    1x تيشيرت أساسي أبيض (L)
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-extrabold whitespace-nowrap text-emerald-800">
                  متوفر
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>العنوان:</span>
                  <span className="font-bold text-gray-900">
                    15 شارع التحرير، الدقي
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>إجمالي المنتجات:</span>
                  <span className="font-bold text-gray-900">750 ج.م</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>الشحن (الدقي):</span>
                  <span className="font-bold text-gray-900">45 ج.م</span>
                </div>
                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                  <span className="text-gray-900 font-bold">الإجمالي:</span>
                  <span className="font-bold text-emerald-700">795 ج.م</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute start-[-18px] bottom-[-18px] flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-xl">
            <CheckIcon className="text-emerald-700" />
            <span className="text-xs font-extrabold text-gray-900">
              أوردر جاهز للشحن 📦
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketProof() {
  return (
    <section className="border-b border-gray-200 bg-white px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-sm font-extrabold tracking-wide text-emerald-700">
              السوق المصري
            </span>
            <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              ليه الاعتماد على الموقع لوحده بيضيع عليك 90% من الزبائن؟
            </h2>
            <p className="text-[15px] leading-loose text-gray-500">
              زبونك المصري مش هيستنى يفتح رابط موقع أو يسجل حساب.. زبونك متعود
              يشتري من الشات، وإحنا بنخلي الشات يبيع له كأنه متجر كامل!
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>صفحات فيسبوك</span>
                  <span>61.7%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: "61.7%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>جروبات ومحادثات واتساب</span>
                  <span>31.8%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: "31.8%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>مواقع المتاجر المستقلة</span>
                  <span>3.7%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gray-400"
                    style={{ width: "3.7%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400">
                المصدر: تقرير مسح استخدام التجارة الإلكترونية، وزارة الاتصالات و{" "}
                <span dir="ltr">CAPMAS</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

function HowItWorks() {
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

const FEATURES = [
  {
    title: "سلة تسوق وإتمام طلبات داخل المحادثة",
    body: "عميلك لا يحتاج للخروج من الماسنجر أو إنستجرام؛ يضيف المنتجات للسلة، يعدل الكميات، ويحدد عنوانه ليصله إشعار التأكيد فوراً.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    title: 'ذكاء اصطناعي يفهم "كلام المصريين"',
    body: 'سواء كتب العميل "عايز التيشيرت الكحلي مقاس لارج" أو "3ayz 2 mno"، النظام يفهم المطلوب بدقة ويطابقه مع المنتجات.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    title: "أمان تجاري كامل — لا مجال للهلوسة",
    body: "نظامنا يفصل تماماً بين فهم الذكاء الاصطناعي وقاعدة بيانات الأسعار والمخزون، ويعتمد على حساباتك الحتمية 100%.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "التحويل البشري الفوري",
    body: "هل طلب العميل التحدث مع شخص حقيقي؟ النظام يحوّل المحادثة لك فوراً ويوقف ردود الـ AI لتتولى الرد بنفسك.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: "تصدير فوري لشركات الشحن",
    body: "تصدير فوري لكافة بيانات العملاء إلى ملفات إكسيل وشيتس مهيأة مباشرة للطباعة والتسليم لمندوب الشحن.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    title: "مساعد ذكي لسياسات المتجر",
    body: "درّب المساعد في دقيقة واحدة على مواعيد عملك، شروط الاستبدال، وتفاصيل مصاريف الشحن ليرد بأسلوب متجرك.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a5 5 0 015 5v3h1a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2h1V7a5 5 0 015-5z" />
      </svg>
    ),
  },
];

function Features() {
  return (
    <section
      id="features"
      className="border-y border-gray-200 bg-gray-50 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            المميزات الأساسية
          </span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            كل ما تحتاجه للتحكم في مبيعات السوشيال ميديا من مكان واحد
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-5.5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mb-3.5 text-emerald-700">{feature.icon}</div>
              <h3 className="mb-2 text-[15.5px] font-extrabold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ROIAndProfitLogic() {
  return (
    <section className="bg-emerald-900 px-5 py-16 sm:px-8 sm:py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl text-center mx-auto">
          <span className="text-sm font-extrabold tracking-wide text-emerald-300">
            لغة الأرقام
          </span>
          <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold sm:text-4xl">
            إزاي "تِجارتك" بيدفع ثمنه من أول أسبوع؟
          </h2>
          <p className="text-[15px] leading-loose text-emerald-100/80">
            التكلفة مش اشتراك المنصة، التكلفة الحقيقية هي الأوردرات اللي بتضيع
            بسبب التأخير في الرد.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white text-gray-900 shadow-xl">
          <div className="grid md:grid-cols-2">
            <div className="p-8 border-b md:border-b-0 md:border-l border-gray-100">
              <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                <span className="text-2xl">❌</span> الطريقة التقليدية
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">وقت الرد</span>
                  <span className="font-bold">من 15 دقيقة لساعات</span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">معدل إغلاق البيعة</span>
                  <span className="font-bold text-red-600">
                    30% (الزبون بيبرد)
                  </span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">أخطاء الشحن</span>
                  <span className="font-bold text-red-600">
                    واردة (Copy/Paste)
                  </span>
                </li>
                <li className="flex justify-between pb-3">
                  <span className="text-gray-500">تكلفة المودريتورز</span>
                  <span className="font-bold">مرتبات + عمولات متزايدة</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-emerald-50">
              <h3 className="text-xl font-bold text-emerald-700 mb-6 flex items-center gap-2">
                <span className="text-2xl">✅</span> مع تِجارتك
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">وقت الرد</span>
                  <span className="font-bold text-emerald-900">
                    0 ثانية (فوري 24/7)
                  </span>
                </li>
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">معدل إغلاق البيعة</span>
                  <span className="font-bold text-emerald-700">
                    70%+ (العميل سخن)
                  </span>
                </li>
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">أخطاء الشحن</span>
                  <span className="font-bold text-emerald-700">
                    0% (استخراج آلي)
                  </span>
                </li>
                <li className="flex justify-between pb-3">
                  <span className="text-emerald-800/70">التكلفة</span>
                  <span className="font-bold text-emerald-900">
                    اشتراك ثابت ورمزي
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductModes() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-2xl text-center mx-auto">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            أوضاع التشغيل
          </span>
          <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            أنت المتحكم: تجربتان ذكيتان للبيع عبر الشات
          </h2>
          <p className="text-[15px] leading-loose text-gray-500">
            تطبيقنا بيقدملك طريقتين للبيع، تقدر تختار الأنسب لحجم وأسلوب بيزنسك،
            مع إمكانية الترقية في أي وقت.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Catalog Mode */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gray-200 text-gray-700">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              الكتالوج التفاعلي (Structured Commerce)
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600">
              بيع هيكلي سريع يتيح للعميل استعراض المنتجات، اختيار المقاسات،
              وإضافة العناصر للسلة من خلال أزرار وقوائم سريعة داخل الشات، دون
              تكلفة الذكاء الاصطناعي.
            </p>
            <ul className="mt-2 flex flex-col gap-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> بيع أوتوماتيكي ومباشر
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> لا توجد تكلفة ذكاء
                اصطناعي
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> سريع ومناسب للطلبات
                المباشرة
              </li>
            </ul>
          </div>

          {/* AI Commerce Mode */}
          <div className="relative flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8">
            <div className="absolute top-6 left-6 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              إضافة مدفوعة
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              البيع بالذكاء الاصطناعي (AI Commerce Assistant)
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600">
              محرك ذكي يفهم الرسائل (العامية والفرانكو)، يستخرج الطلبات من الجمل
              المعقدة، يرد على الاستفسارات من سياسات متجرك، ويصعد المحادثة لك
              عند الضرورة.
            </p>
            <ul className="mt-2 flex flex-col gap-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> محادثة طبيعية كأنها
                إنسان
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> الإجابة من سياسات
                المتجر
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> تصعيد ذكي للمواقف
                الصعبة
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "هل بيحتاج ربط معقد بفيسبوك وواتساب؟",
    a: "إطلاقاً. الربط بيتم بضغطة زر واحدة (Login with Facebook)، وبنفس الطريقة لواتساب بيزنس، مفيش أي أكواد أو خبرة تقنية مطلوبة.",
  },
  {
    q: "هل الذكاء الاصطناعي ممكن يدي العميل سعر غلط؟",
    a: "مستحيل. الذكاء الاصطناعي عندنا مفصول عن الأسعار والمخزون، هو بيفهم طلب العميل بس، وبيسحب السعر والمخزون الحقيقي من الكتالوج بتاعك.",
  },
  {
    q: "هل بيشتغل على التعليقات (الكومنتات)؟",
    a: "حالياً النظام متخصص في المحادثات الخاصة (Direct Messages)، لأنه المكان الفعلي لإتمام البيع وأخذ بيانات الشحن.",
  },
  {
    q: "لو العميل كتب عنوانه بطريقة عشوائية، هل هيفهمه؟",
    a: "أيوة، دي أقوى ميزة في نظامنا! مهما كان كلام العميل ملخبط أو كاتبه بالفرانكو، الموديل بيستخرج المحافظة، المنطقة، والشارع ويرتبهم في الشيت.",
  },
  {
    q: "إزاي بحاسب شركة الشحن بالأوردرات دي؟",
    a: "النظام بيجمع كل الأوردرات في ملف جاهز (إكسيل أو شيتس) متوافق تماماً مع صيغة شركات الشحن (زي بوسطة، طرد، أو غيرهم)، بتاخده وترفعه عندهم في ثواني.",
  },
  {
    q: "هل ينفع أتدخل وأرد بنفسي في أي وقت؟",
    a: "طبعاً! بمجرد ما تبعت رسالة للعميل، النظام بيوقف الرد الآلي فوراً عشان تكمل إنت المحادثة وتتفق معاه براحتك.",
  },
];

function FAQSection() {
  return (
    <section id="faq" className="bg-gray-50 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
            أسئلة شائعة (إجابات صريحة)
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <h3 className="mb-3 text-[15px] font-bold text-gray-900 leading-snug">
                {faq.q}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-gray-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <div className="bg-[#0a0f0d]">
      <section className="border-b border-white/10 px-5 py-16 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display mb-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">
            وفر وقتك، ضاعف مبيعاتك، وارتاح من ضغط الرسايل
          </h2>
          <p className="mb-8 text-[16px] leading-loose text-gray-400">
            أول 30 أوردر علينا مجاناً بالكامل لتجربة النظام على أرض الواقع. بدون
            إدخال بطاقة ائتمانية.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-[15.5px] font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              ابدأ تجربتك المجانية الآن 🚀
            </Link>
            <a
              href="#example"
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-white/20 px-8 py-3.5 text-[15.5px] font-bold text-white transition-colors hover:bg-white/10"
            >
              جرّب الشات الحي
            </a>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <Link
          href="/demo"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-[15px] font-bold text-white shadow-2xl transition-transform active:scale-95"
        >
          جرب 30 أوردر مجاناً 🚀
        </Link>
      </div>

      <footer className="px-5 pt-12 pb-24 md:pb-7 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
            <div>
              <div className="mb-3.5">
                <BrandMark tone="dark" />
              </div>
              <p className="mb-4.5 max-w-md text-[13px] leading-loose text-gray-400">
                منصة التجارة الذكية الأولى في مصر. حوّل شات السوشيال ميديا
                لمبيعات مؤكدة بدون تدخل بشري.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-extrabold text-gray-400">
                المنتج
              </div>
              <div className="flex flex-col gap-2.5">
                <a
                  href="#how"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  كيف يعمل
                </a>
                <a
                  href="#features"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  المميزات
                </a>
                <a
                  href="#pricing"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  الأسعار
                </a>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-extrabold text-gray-400">
                الشركة
              </div>
              <div className="flex flex-col gap-2.5">
                <a
                  href="#"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  تواصل معنا
                </a>
                <a
                  href="#faq"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  الأسئلة الشائعة
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center">
            <span className="text-[12.5px] text-gray-500">
              © 2026 Tijaratk. جميع الحقوق محفوظة.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "تِجارتك (Tijaratk)",
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
  };

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

      {/* 
        Legacy components extracted to frontend/components/legacy/:
        <Stats /> 
        <Testimonials /> 
        <LiveExample />
      */}

      <ProductModes />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}
