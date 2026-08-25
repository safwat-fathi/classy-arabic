import { CheckIcon } from "@/components/ui/check-icon";

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

export function Features() {
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
