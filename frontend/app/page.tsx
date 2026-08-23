import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "./logo";

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
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700">
            كيف يعمل
          </a>
          <a href="#features" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700">
            المميزات
          </a>
          <a href="#example" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700">
            مثال حي
          </a>
          <a href="#pricing" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700">
            الأسعار
          </a>
          <a href="#testimonials" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700">
            آراء التجار
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
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-1.5 text-sm font-bold text-emerald-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z" />
            </svg>
            <span>مدعوم بالذكاء الاصطناعي لتجار السوشيال ميديا</span>
          </div>
          <h1 className="font-display mb-5 text-4xl leading-tight font-black text-white sm:text-5xl lg:text-6xl">
            حوّل رسايل الواتساب والإنستجرام لطلبات جاهزة تلقائيًا
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-loose text-gray-400">
            محرك ذكاء اصطناعي يفهم العربي المصري والعرباوي زي ما بيكتب بيه عملاؤك فعلًا، يستخرج بيانات الطلب أول
            بأول، ويصعّد للمراجعة البشرية بس لما الرسالة فعلًا محتاجة حد يشوفها.
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-6.5 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              ابدأ تجربتك المجانية
            </Link>
            <a
              href="#how"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-6.5 py-3.5 text-[15px] font-semibold text-gray-200 transition-colors hover:bg-white/10"
            >
              شاهد كيف يعمل
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4.5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-gray-500">محادثة واردة &middot; واتساب بيزنس</span>
            </div>
            <div className="max-w-[84%] self-start rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">
              عايزة فستان صيفي كتان زي اللي في الستوري، مقاس M، وابعتيلي على العنوان اللي بعتهولك قبل كده وأدفع
              كاش عند الاستلام 🌿
            </div>
            <div className="flex items-center gap-2 self-start rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              </svg>
              <span>جاري الفهم والاستخراج بواسطة NileChat...</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <Image
                src="/images/linen_dress.jpg"
                alt="فستان كتان صيفي"
                width={52}
                height={52}
                className="h-13 w-13 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-gray-900">فستان كتان صيفي &middot; مقاس M</div>
                <div className="mt-0.5 text-xs text-gray-500">الدفع: كاش عند الاستلام &middot; العنوان: محفوظ من قبل</div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold whitespace-nowrap text-emerald-800">
                تأكيد تلقائي
              </span>
            </div>
          </div>
          <div className="absolute start-[-18px] bottom-[-18px] flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-xl">
            <CheckIcon className="text-emerald-700" />
            <span className="text-xs font-extrabold text-gray-900">ثقة الفهم 96%</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    label: "خطوة 1",
    title: "استقبال الرسالة",
    body: "الرسالة توصل زي ما هي من واتساب أو انستجرام، بعامية التاجر وعميله، من غير أي تنسيق مسبق.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 5H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1z" />
        <path d="M22 6l-10 7L2 6" />
      </svg>
    ),
  },
  {
    label: "خطوة 2",
    title: "فهم النية",
    body: "تحديد سريع: طلب شراء، استفسار، شكوى، ولا رسالة عادية مالهاش داعي لمجهود زيادة.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41L11 3.83A2 2 0 009.59 3H4a1 1 0 00-1 1v5.59a2 2 0 00.59 1.41l9.58 9.59a2 2 0 002.83 0l4.59-4.59a2 2 0 000-2.83z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </svg>
    ),
  },
  {
    label: "خطوة 3",
    title: "استخراج بيانات الطلب",
    body: "المنتج، المقاس، العنوان، رقم التليفون، وطريقة الدفع، كل ده في بيانات منظمة جاهزة للطلب.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h6M7 17h4" />
      </svg>
    ),
  },
  {
    label: "خطوة 4",
    title: "تصعيد عند الحاجة بس",
    body: "الرسايل الغامضة أو المعقدة توديها لموديل أقوى للمراجعة، مش كل الرسايل بترجع تصعيد.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 015 5v3h1a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2h1V7a5 5 0 015-5z" />
      </svg>
    ),
  },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">خط سير الرسالة</span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            من رسالة عشوائية لطلب منظم في أربع خطوات
          </h2>
          <p className="text-[15px] leading-loose text-gray-500">
            مش كل رسالة محتاجة نفس المجهود. الموديل الأساسي بيتولى الأغلبية، وبيصعّد بس لما يحتاج فعلًا.
          </p>
        </div>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.title} className="flex flex-col gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                {step.icon}
              </div>
              <div>
                <div className="mb-1 text-xs font-extrabold text-gray-400">{step.label}</div>
                <h3 className="mb-1.5 text-base font-extrabold text-gray-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.body}</p>
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
    title: "فهم عربي مصري وعرباوي حقيقي",
    body: "من غير ما التاجر يدرّب عملاؤه على صياغة معينة أو يحول لغة فصحى.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    title: "استخراج بيانات منظم",
    body: "المنتج والعنوان والتليفون وطريقة الدفع، جاهزين كبيانات مش نص عشوائي.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "تصعيد ذكي بدل التخمين",
    body: "الرسالة المعقدة أو الغامضة تروح لموديل أقوى بدل ما يتم تخمين بياناتها.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8l4 4-4 4M7 16l-4-4 4-4" />
        <path d="M14 4L10 20" />
      </svg>
    ),
  },
  {
    title: "تعلم مستمر من تصحيحاتك",
    body: "كل تعديل بتعمله على طلب بيتحول لإشارة تدريب لتحسين الموديل الأساسي.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 019-9c2.5 0 4.7 1 6.3 2.6M21 12a9 9 0 01-9 9c-2.5 0-4.7-1-6.3-2.6" />
        <path d="M18 3v5h-5M6 21v-5h5" />
      </svg>
    ),
  },
  {
    title: "ميزانية سياق ذكية للسرعة",
    body: "المحادثة بتتلخص بذكاء عشان الرد يفضل سريع من غير ما يفقد التفاصيل المهمة.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    title: "مراجعة بشرية عند الغموض بس",
    body: "إنت وفريقك تتدخلوا بس في الحالات اللي فعلًا محتاجة قرار بشري.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9.5 12l1.8 1.8L14.5 10" />
      </svg>
    ),
  },
];

function Features() {
  return (
    <section id="features" className="border-y border-gray-200 bg-gray-50 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">المميزات</span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            مبني عشان يفهم البيزنس المصري فعلًا
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-5.5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mb-3.5 text-emerald-700">{feature.icon}</div>
              <h3 className="mb-2 text-[15.5px] font-extrabold text-gray-900">{feature.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveExample() {
  return (
    <section id="example" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">مثال حي</span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            من محادثة عادية لطلب مؤكد
          </h2>
          <p className="text-[15px] leading-loose text-gray-500">
            مثال توضيحي ببيانات تجريبية &mdash; كده بيتصرف المحرك مع رسالة حقيقية من عميل.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-1 text-xs font-extrabold text-gray-400">محادثة انستجرام</div>
            <div className="max-w-[88%] self-start rounded-2xl rounded-bl-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">
              هاي، الجاكيت الجينز اللي في آخر بوست، متوفر مقاس L؟
            </div>
            <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-emerald-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">
              أيوة متوفر، تحبي تأكدي الطلب دلوقتي؟
            </div>
            <div className="max-w-[88%] self-start rounded-2xl rounded-bl-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">
              أيوة، ابعتيه لنفس عنوان أوضة عرب اللي طلبت منه قبل كده، وهدفع عند الاستلام
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <CheckIcon />
              <span>تم استخراج الطلب تلقائيًا</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-400">بيانات الطلب المستخرجة</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">ثقة 94%</span>
            </div>
            <div className="mb-4 flex gap-3">
              <Image
                src="/images/denim_jacket.jpg"
                alt="جاكيت جينز كلاسيك"
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div>
                <div className="text-[14.5px] font-extrabold text-gray-900">جاكيت جينز كلاسيك</div>
                <div className="mt-0.5 text-xs text-gray-500">مقاس L &middot; قطعة واحدة</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">العنوان</span>
                <span className="font-bold text-gray-900">محفوظ من طلب سابق</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">رقم التليفون</span>
                <span dir="ltr" className="font-bold text-gray-900">
                  01••••••••
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">طريقة الدفع</span>
                <span className="font-bold text-gray-900">كاش عند الاستلام</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">الحالة</span>
                <span className="font-extrabold text-emerald-700">تأكيد تلقائي</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Image
              src="/images/linen_dress.jpg"
              alt="فستان كتان صيفي"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold text-gray-900">فستان كتان صيفي</div>
              <div className="text-[11px] text-gray-400">آخر مزامنة: منذ دقيقتين</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Image
              src="/images/denim_jacket.jpg"
              alt="جاكيت جينز كلاسيك"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold text-gray-900">جاكيت جينز كلاسيك</div>
              <div className="text-[11px] text-gray-400">آخر مزامنة: منذ 5 دقايق</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: "92%", label: "من الطلبات تتأكد تلقائيًا" },
    { value: "<2s", label: "متوسط زمن فهم الرسالة" },
    { value: "10K+", label: "رسالة تتم معالجتها يوميًا" },
    { value: "8%", label: "بس بتحتاج تصعيد لمراجعة" },
  ];
  return (
    <section className="bg-emerald-50 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div dir="ltr" className="font-display text-3xl font-black text-emerald-700 sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-emerald-900">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-7 text-center text-[11.5px] text-emerald-700/70">أرقام توضيحية لغرض العرض</p>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "بقيت مبسوطة إني مش بارد يدوي على كل رسالة. الطلبات بقت بتتسجل لوحدها وأنا بس بأكد عليها.",
    name: "سارة عبد الرحمن",
    role: "لبس حريمي · انستجرام",
    initial: "س",
  },
  {
    quote: "أهم حاجة إنه بيفهم العرباوي زي ما بنكتب بالظبط، مش لغة فصحى مصطنعة محدش بيتكلم بيها.",
    name: "محمود العدوي",
    role: "إكسسوارات · واتساب بيزنس",
    initial: "م",
  },
  {
    quote: "التصعيد للمراجعة بس لما يحصل لخبطة فعلًا وفّر عليا وقت كتير كنت بضيعه في متابعة كل حاجة يدوي.",
    name: "نور الشريف",
    role: "بوتيك أونلاين · فيسبوك",
    initial: "ن",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">آراء التجار</span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            تجار بيبيعوا على السوشيال ميديا بيستخدموه فعلًا
          </h2>
          <p className="text-xs text-gray-400">شهادات تجريبية لغرض العرض</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5.5">
              <p className="text-sm leading-loose text-gray-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2.5">
                <span className="font-display flex size-9.5 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">
                  {t.initial}
                </span>
                <div>
                  <div className="text-[13px] font-extrabold text-gray-900">{t.name}</div>
                  <div className="text-[11.5px] text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-t border-gray-200 bg-gray-50 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">الأسعار</span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            باقة تناسب حجم بيزنسك
          </h2>
          <p className="text-[15px] leading-loose text-gray-500">
            أسعار تجريبية لغرض العرض &mdash; غيّرها براحتك من لوحة التحكم.
          </p>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">أساسي</h3>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-500">
              لتجار السوشيال ميديا اللي بيبدأوا يشتغلوا بالذكاء الاصطناعي.
            </p>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900">499</span>
              <span className="text-[13px] font-bold text-gray-500">جنيه / شهريًا</span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              ابدأ الآن
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                "حتى 500 رسالة شهريًا",
                "تصنيف تلقائي للرسائل",
                "استخراج بيانات الطلب الأساسية",
                "دعم عبر البريد الإلكتروني",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13.5px] text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col rounded-2xl border border-emerald-700 bg-[#0a0f0d] p-6.5 shadow-2xl">
            <span className="absolute -top-3.5 start-6.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white">
              الأكثر شيوعًا
            </span>
            <h3 className="mt-2 mb-1.5 text-base font-extrabold text-white">احترافي</h3>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-400">
              لتجار البيع اليومي اللي محتاجين أتمتة كاملة وتصعيد ذكي.
            </p>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-white">1,499</span>
              <span className="text-[13px] font-bold text-gray-400">جنيه / شهريًا</span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              ابدأ الآن
            </Link>
            <ul className="flex flex-col gap-3 border-t border-white/10 pt-5">
              {[
                "حتى 5,000 رسالة شهريًا",
                "كل مميزات الباقة الأساسية",
                "تصعيد ذكي للحالات المعقدة",
                "تكامل مباشر مع كتالوج المنتجات",
                "دعم بأولوية",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-400" />
                  <span className="text-[13.5px] text-gray-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">أعمال</h3>
            <p className="mb-5 text-[13px] leading-relaxed text-gray-500">
              لمتاجر السوشيال ميديا الكبيرة والوكالات اللي بتدير أكتر من تاجر.
            </p>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-black text-gray-900">تواصل معنا</span>
            </div>
            <a
              href="#"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              تواصل مع المبيعات
            </a>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {["رسائل غير محدودة", "مدير حساب مخصص", "تكامل API كامل", "اتفاقية مستوى خدمة (SLA) مخصصة"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckIcon className="text-emerald-700" />
                    <span className="text-[13.5px] text-gray-700">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaAndFooter() {
  return (
    <div className="bg-[#0a0f0d]">
      <section id="cta" className="border-b border-white/10 px-5 py-16 text-center sm:px-8 sm:py-20">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display mb-3.5 text-3xl font-black text-white sm:text-4xl">
            جاهز تبطّل ترد يدويًا على كل رسالة؟
          </h2>
          <p className="mb-7 text-[15px] leading-loose text-gray-400">
            جرّب المحرك على رسايل بيزنسك الحقيقية وشوف قد إيه هيوفر وقتك.
          </p>
          <Link
            href="/demo"
            className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-7.5 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            ابدأ تجربتك المجانية الآن
          </Link>
        </div>
      </section>

      <footer className="px-5 pt-12 pb-7 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
            <div>
              <div className="mb-3.5">
                <BrandMark tone="dark" />
              </div>
              <p className="mb-4.5 max-w-md text-[13px] leading-loose text-gray-400">
                محرك ذكاء اصطناعي يحوّل محادثات السوشيال ميديا لطلبات جاهزة، مبني خصيصًا لتجار العربي المصري.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-extrabold text-gray-400">المنتج</div>
              <div className="flex flex-col gap-2.5">
                <a href="#how" className="text-[13.5px] text-gray-300 hover:text-white">
                  كيف يعمل
                </a>
                <a href="#features" className="text-[13.5px] text-gray-300 hover:text-white">
                  المميزات
                </a>
                <a href="#example" className="text-[13.5px] text-gray-300 hover:text-white">
                  مثال حي
                </a>
                <a href="#pricing" className="text-[13.5px] text-gray-300 hover:text-white">
                  الأسعار
                </a>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-extrabold text-gray-400">الشركة</div>
              <div className="flex flex-col gap-2.5">
                <a href="#" className="text-[13.5px] text-gray-300 hover:text-white">
                  من نحن
                </a>
                <a href="#" className="text-[13.5px] text-gray-300 hover:text-white">
                  تواصل معنا
                </a>
                <a href="#testimonials" className="text-[13.5px] text-gray-300 hover:text-white">
                  آراء التجار
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center">
            <span className="text-[12.5px] text-gray-500">© 2026 Classy Arabic. جميع الحقوق محفوظة.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <LiveExample />
      <Stats />
      <Testimonials />
      <Pricing />
      <CtaAndFooter />
    </main>
  );
}
