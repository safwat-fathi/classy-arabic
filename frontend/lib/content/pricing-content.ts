export interface PricingTier {
  id: string;
  name: { ar: string; en: string };
  badge?: { ar: string; en: string };
  description: { ar: string; en: string };
  basePrice: number;
  aiAddonPrice: number;
  ordersLimit: { ar: string; en: string };
  channels: { ar: string; en: string };
  features: Array<{ ar: string; en: string }>;
  highlighted?: boolean;
  ctaText: { ar: string; en: string };
  ctaHref: string;
}

export interface ComparisonFeature {
  name: { ar: string; en: string };
  category: { ar: string; en: string };
  starter: boolean | string | { ar: string; en: string };
  growth: boolean | string | { ar: string; en: string };
  pro: boolean | string | { ar: string; en: string };
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: { ar: "الأساسية (Starter)", en: "Starter" },
    description: {
      ar: "مثالية للمشاريع الناشئة والصفحات التي تبدأ مبيعاتها الأولى عبر السوشيال ميديا.",
      en: "Perfect for emerging brands and new pages scaling their first sales on social media.",
    },
    basePrice: 499,
    aiAddonPrice: 250,
    ordersLimit: { ar: "حتى 150 أوردر شهريًا", en: "Up to 150 orders/mo" },
    channels: { ar: "صفحة فيسبوك + حساب إنستجرام", en: "1 Facebook Page + 1 Instagram Account" },
    ctaText: { ar: "ابدأ تجربة مجانية (30 أوردر)", en: "Start Free Trial (30 Orders)" },
    ctaHref: "/demo",
    features: [
      { ar: "حتى 150 أوردر مكتمل شهريًا", en: "Up to 150 completed orders/mo" },
      { ar: "ربط متكامل مع فيسبوك ماسنجر وإنستجرام DM", en: "Facebook Messenger & Instagram DM integration" },
      { ar: "وضع الكتالوج التفاعلي الكامل مع سلة الشراء داخل الشات", en: "Interactive in-chat catalog & shopping cart" },
      { ar: "تفريغ فوري لبيانات الشحن والعنوان المصري", en: "Automated Egyptian shipping address extraction" },
      { ar: "تصدير فوري للأوردرات إلى Google Sheets وإكسيل", en: "Instant order sync to Google Sheets & Excel" },
      { ar: "لوحة تحكم لإدارة المنتجات وحالات الطلب", en: "Merchant dashboard for products & order statuses" },
      { ar: "دعم فني عبر البريد الإلكتروني والشات", en: "Standard email and chat support" },
    ],
  },
  {
    id: "growth",
    name: { ar: "النمو (Growth)", en: "Growth" },
    badge: { ar: "الأكثر طلبًا للتجار", en: "Most Popular" },
    description: {
      ar: "الخيار الأفضل للبراندات السريعة والمتاجر النشطة التي تستقبل مئات المحادثات يوميًا.",
      en: "The sweet spot for high-growth brands receiving hundreds of customer inquiries daily.",
    },
    basePrice: 749,
    aiAddonPrice: 350,
    ordersLimit: { ar: "حتى 600 أوردر شهريًا", en: "Up to 600 orders/mo" },
    channels: { ar: "فيسبوك + إنستجرام + واتساب كلاود", en: "Facebook + Instagram + WhatsApp Cloud API" },
    highlighted: true,
    ctaText: { ar: "جرّب باقة النمو مجانًا", en: "Try Growth Free" },
    ctaHref: "/demo",
    features: [
      { ar: "حتى 600 أوردر شهريًا مع إمكانية الترقية المرنة", en: "Up to 600 orders/mo with flexible top-ups" },
      { ar: "ربط فيسبوك وإنستجرام ورقم واتساب رسمي (Cloud API)", en: "Official WhatsApp Cloud API + FB & Instagram" },
      { ar: "محرك الذكاء الاصطناعي لفهم العامية المصرية والفرانكو", en: "Native Egyptian Arabic & Arabizi AI Engine" },
      { ar: "رد ذكي وتلقائي على الأسئلة الشائعة وسياسات الاستبدال والتوصيل", en: "Automated FAQ & store policies handling" },
      { ar: "نظام تحويل ذكي للتيم البشري وإيقاف البوت عند الحاجة", en: "Smart human takeover & moderator notifications" },
      { ar: "تعدد مستخدمي لوحة التحكم (حتى 3 موظفين)", en: "Multi-user dashboard access (up to 3 team members)" },
      { ar: "تحليلات مبيعات تفصيلية وتقارير معدل التحويل", en: "Detailed sales analytics & conversion reports" },
      { ar: "دعم فني سريع عبر الواتساب ومجموعات المتابعة", en: "Priority WhatsApp and onboarding support" },
    ],
  },
  {
    id: "pro",
    name: { ar: "المحترفين (Pro)", en: "Pro / Enterprise" },
    badge: { ar: "للمتاجر الكبيرة والوكالات", en: "High Volume" },
    description: {
      ar: "للمتاجر الكبرى، سلاسل التوزيع، ووكالات التجارة الإلكترونية التي تدير حجم مبيعات ضخم.",
      en: "Built for top-tier merchants, multi-brand operations, and high-volume media buyers.",
    },
    basePrice: 1199,
    aiAddonPrice: 450,
    ordersLimit: { ar: "أوردرات غير محدودة شهريًا", en: "Unlimited orders/mo" },
    channels: { ar: "قنوات ومتاجر غير محدودة", en: "Unlimited channels & pages" },
    ctaText: { ar: "تحدث مع مبيعات المحترفين", en: "Contact Pro Sales" },
    ctaHref: "/demo",
    features: [
      { ar: "عدد أوردرات غير محدود بدون قيود حجم شهري", en: "Unlimited monthly order volume" },
      { ar: "ربط غير محدود لصفحات السوشيال ميديا وأرقام الواتساب", en: "Unlimited social media pages & WhatsApp lines" },
      { ar: "أعلى أولوية وسرعة استجابة على سيرفرات الذكاء الاصطناعي", en: "Highest-priority ultra-fast AI inference cluster" },
      { ar: "تخصيص كامل لنبرة البوت (Persona) وقواعد العمل المعقدة", en: "Full AI persona customization & custom business rules" },
      { ar: "ربط Webhooks مخصص بأنظمة الشحن والمخازن (ERP)", en: "Custom Webhook integrations with ERP & shipping APIs" },
      { ar: "عدد لا محدود من موظفي خدمة العملاء والمشرفين", en: "Unlimited moderator seats & permission roles" },
      { ar: "مدير حساب مخصص وتدريب كامل لفريق العمل", en: "Dedicated account manager & 1-on-1 team training" },
      { ar: "اتفاقية مستوى الخدمة SLA 99.9% مع دعم طوارئ 24/7", en: "99.9% SLA agreement & 24/7 dedicated support" },
    ],
  },
];

export const COMPARISON_CATEGORIES: {
  category: { ar: string; en: string };
  features: ComparisonFeature[];
}[] = [
  {
    category: { ar: "القنوات ونطاق العمل", en: "Channels & Capacity" },
    features: [
      {
        name: { ar: "الحد الأقصى للأوردرات الشهرية", en: "Monthly Order Capacity" },
        category: { ar: "القنوات ونطاق العمل", en: "Channels & Capacity" },
        starter: { ar: "150 أوردر", en: "150 orders" },
        growth: { ar: "600 أوردر", en: "600 orders" },
        pro: { ar: "غير محدود", en: "Unlimited" },
      },
      {
        name: { ar: "فيسبوك ماسنجر وإنستجرام DM", en: "Facebook Messenger & Instagram DM" },
        category: { ar: "القنوات ونطاق العمل", en: "Channels & Capacity" },
        starter: true,
        growth: true,
        pro: true,
      },
      {
        name: { ar: "واتساب كلاود الرسمي (WhatsApp Business API)", en: "Official WhatsApp Cloud API" },
        category: { ar: "القنوات ونطاق العمل", en: "Channels & Capacity" },
        starter: false,
        growth: true,
        pro: true,
      },
      {
        name: { ar: "عدد المستخدمين للوحة التحكم", en: "Dashboard Team Seats" },
        category: { ar: "القنوات ونطاق العمل", en: "Channels & Capacity" },
        starter: { ar: "مستخدم واحد", en: "1 seat" },
        growth: { ar: "3 مستخدمين", en: "3 seats" },
        pro: { ar: "غير محدود", en: "Unlimited" },
      },
    ],
  },
  {
    category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
    features: [
      {
        name: { ar: "فهم العامية المصرية، الفرانكو، والأخطاء الإملائية", en: "Egyptian Arabic, Arabizi & Typo Resilience" },
        category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
        starter: { ar: "مع باقة الـ AI", en: "With AI Addon" },
        growth: true,
        pro: true,
      },
      {
        name: { ar: "الكتالوج التفاعلي وسلة المشتريات داخل الشات", en: "Interactive In-Chat Catalog & Cart" },
        category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
        starter: true,
        growth: true,
        pro: true,
      },
      {
        name: { ar: "تفريغ بيانات الشحن المصري (المحافظة، المنطقة، علامات)", en: "Egyptian Address & Shipping Parsing" },
        category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
        starter: true,
        growth: true,
        pro: true,
      },
      {
        name: { ar: "الرد الآلي على الأسئلة الشائعة وسياسات المتجر", en: "Automated Store Knowledge & FAQs" },
        category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
        starter: { ar: "أساسي", en: "Basic" },
        growth: { ar: "متقدم وذكي", en: "Advanced AI" },
        pro: { ar: "مخصص بالكامل", en: "Custom Tuned" },
      },
      {
        name: { ar: "التحويل البشري الفوري وإيقاف البوت", en: "Human Handover & Bot Pause" },
        category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
        starter: false,
        growth: true,
        pro: true,
      },
      {
        name: { ar: "أولوية معالجة الذكاء الاصطناعي", en: "AI Inference Priority" },
        category: { ar: "الذكاء الاصطناعي وتجربة العميل", en: "AI & Experience" },
        starter: { ar: "قياسية", en: "Standard" },
        growth: { ar: "عالية وسريعة", en: "High Priority" },
        pro: { ar: "سيرفرات فائقة السرعة مخصصة", en: "Dedicated Top Tier" },
      },
    ],
  },
  {
    category: { ar: "الربط والشحن والدعم", en: "Integrations & Support" },
    features: [
      {
        name: { ar: "تصدير تلقائي لإكسيل وشيتس (Google Sheets)", en: "Live Google Sheets & Excel Export" },
        category: { ar: "الربط والشحن والدعم", en: "Integrations & Support" },
        starter: true,
        growth: true,
        pro: true,
      },
      {
        name: { ar: "الربط مع شركات الشحن والـ Webhooks", en: "Shipping APIs & Custom Webhooks" },
        category: { ar: "الربط والشحن والدعم", en: "Integrations & Support" },
        starter: false,
        growth: { ar: "Webhooks أساسية", en: "Standard Webhooks" },
        pro: { ar: "ربط كامل مخصص", en: "Custom Enterprise API" },
      },
      {
        name: { ar: "قنوات الدعم الفني", en: "Support Channels" },
        category: { ar: "الربط والشحن والدعم", en: "Integrations & Support" },
        starter: { ar: "بريد وشات مساعدة", en: "Email & Help Center" },
        growth: { ar: "شات واتساب مباشر وسريع", en: "Priority WhatsApp Chat" },
        pro: { ar: "مدير حساب مخصص وتليفون 24/7", en: "Dedicated Manager & 24/7 Phone" },
      },
    ],
  },
];

export const FAIR_USAGE_TERMS = {
  title: {
    ar: "سياسة الاستخدام العادل لباقة الذكاء الاصطناعي (Fair Usage Terms)",
    en: "AI Add-on Fair Usage Terms (FUP)",
  },
  subtitle: {
    ar: "حرية كاملة لنمو متجرك بدون قيود خانقة أو انقطاع مفاجئ أثناء حملاتك الإعلانية",
    en: "Complete operational freedom for your store without rigid limits or sudden campaign disruptions",
  },
  principles: [
    {
      icon: "⚡",
      title: {
        ar: "استخدام عادل سخي يغطي متجرك الطبيعي",
        en: "Generous Fair Usage for Legitimate Business",
      },
      desc: {
        ar: "صممنا الباقة لتغطي كل محادثات متجرك اليومية واستفسارات المبيعات الطبيعية مهما بلغت في أوقات الذروة والمواسم بدون أن نلزمك بحساب عدد التوكنز أو الكلمات.",
        en: "Our AI tier is calibrated to comfortably cover all legitimate commercial inquiries, peaks, and seasonal campaigns without micro-managing token counts.",
      },
    },
    {
      icon: "🛡️",
      title: {
        ar: "لا انقطاع مفاجئ في عز الأوردرات",
        en: "No Sudden Mid-Campaign Cutoffs",
      },
      desc: {
        ar: "لو حققت حملتك الإعلانية مبيعات غير متوقعة وتضاعفت رسائلك، البوت لن يتوقف فجأة. نوفر لك مرونة تشغيلية مع تنبيهات استباقية قبل أي تعديل.",
        en: "If a viral ad doubles your traffic, the bot never cuts off abruptly. You receive a proactive advisory well before any plan adjustment is required.",
      },
    },
    {
      icon: "🎯",
      title: {
        ar: "مخصصة للتجارة وخدمة العملاء فقط",
        en: "Exclusively for Commerce & Customer Service",
      },
      desc: {
        ar: "يُحظر استخدام البوت في إرسال الرسائل الدعائية العشوائية (Spam) أو الإزعاج غير القانوني. النظام مخصص لاستقبال عملاء متجرك المهتمين بالشراء والتفاعل معهم.",
        en: "Usage is strictly reserved for inbound customer care and sales conversations. Cold outbound spam or mass messaging scraping is strictly prohibited.",
      },
    },
    {
      icon: "💳",
      title: {
        ar: "شفافية مطلقة في تكاليف محادثات Meta",
        en: "100% Transparent Meta API Pass-Through",
      },
      desc: {
        ar: "رسائل الواتساب الرسمية (WhatsApp Cloud API) تُحسب بتكلفتها الرسمية المباشرة من شركة Meta دون أن نضع عليها أي هامش ربح إضافي إطلاقاً.",
        en: "Official Meta conversations for WhatsApp Cloud API are billed transparently at Meta direct cost, without any markup or hidden intermediary fees.",
      },
    },
  ],
};

export const PAYMENT_METHODS = [
  { name: "InstaPay (إنستاباي)", desc: "تحويل لحظي وسهل لجميع البنوك المصرية" },
  { name: "محافظ الموبايل (Vodafone Cash, Orange, Etisalat, WE)", desc: "الدفع فوراً من محفظتك الذكية في ثوانٍ" },
  { name: "البطاقات البنكية (Visa & Mastercard)", desc: "بوابة دفع إلكترونية آمنة ومعتمدة من البنك المركزي المصري" },
  { name: "بطاقات ميزة (Meeza)", desc: "دعم البطاقات الوطنية المحلية بسهولة تامة" },
];

export const PRICING_FAQS = [
  {
    q: {
      ar: "هل يمكنني تجربة تِجارتك بوت مجانًا قبل الاشتراك؟",
      en: "Can I try TijaratkBot for free before subscribing?",
    },
    a: {
      ar: "نعم! نمنحك تجربة مجانية متكاملة تشمل أول 30 أوردر حقيقي لتجرب النظام بكامل مميزاته في شات متجرك وبدون الحاجة لإدخال بطاقة ائتمانية.",
      en: "Yes! You get a free full-featured trial covering your first 30 real orders with zero credit card required.",
    },
  },
  {
    q: {
      ar: "ماذا يحدث إذا تجاوز متجري عدد الأوردرات المسموح به في باقتي؟",
      en: "What happens if my store exceeds the order quota for the month?",
    },
    a: {
      ar: "لن يتوقف متجرك أبداً عن استقبال الطلبات. سنرسل لك إشعاراً بسيطاً باقتراب الحد، ويمكنك الترقية للباقة الأعلى بسهولة مع دفع فرق السعر فقط، أو شحن باقة أوردرات إضافية مرنة.",
      en: "Your store never stops receiving orders. We send a proactive alert and let you smoothly upgrade by paying the difference or purchasing a flexible booster pack.",
    },
  },
  {
    q: {
      ar: "هل أحتاج لسيرفر أو أجهزة تظل تعمل 24 ساعة؟",
      en: "Do I need a server or a computer running 24/7?",
    },
    a: {
      ar: "إطلاقاً. تِجارتك بوت منصة سحابية (Cloud SaaS) بالكامل تعمل على خوادم سريعة ومحمية وتستجيب للعملاء في أجزاء من الثانية طوال الـ 24 ساعة حتى وموبايلك مغلق.",
      en: "Not at all. TijaratkBot is 100% cloud-hosted. It runs continuously, replying to buyers in milliseconds even when your devices are offline.",
    },
  },
  {
    q: {
      ar: "هل يوجد خصم عند الاشتراك السنوي؟",
      en: "Is there a discount on annual subscriptions?",
    },
    a: {
      ar: "بالتأكيد! نوفر خصم 20% كامل على جميع الخطط عند اختيار الدفع السنوي، ما يمنحك توفيراً يعادل شهرين ونصف مجاناً كل عام.",
      en: "Yes! You save 20% across all plans when choosing annual billing, giving you nearly 2.5 months free every year.",
    },
  },
];

export function getPricingMarkdown(lang: string = "ar"): string {
  const isAr = lang === "ar";
  if (isAr) {
    return `# باقات وأسعار تِجارتك بوت (TijaratkBot)

استثمار بسيط لعائد أضخم ومبيعات مؤكدة 24/7 مباشرة من شات السوشيال ميديا في مصر.

---

## الباقات المتاحة

### 1. باقة الأساسية (Starter)
- **السعر الأساسي**: 499 ج.م / شهريًا (أو وفر 20% عند الاشتراك السنوي)
- **إضافة الذكاء الاصطناعي**: +250 ج.م / شهريًا
- **الحد الشهري**: حتى 150 أوردر مكتمل
- **القنوات**: صفحة فيسبوك + حساب إنستجرام
- **المميزات**:
  - وضع الكتالوج التفاعلي وسلة التسوق داخل المحادثة
  - تفريغ فوري لبيانات الشحن والعناوين المصرية
  - تصدير مباشر للطلبات إلى Google Sheets وإكسيل
  - لوحة تحكم لإدارة المنتجات وحالات الطلب
  - دعم فني قياسي

### 2. باقة النمو (Growth) — الأكثر طلباً للتجار
- **السعر الأساسي**: 749 ج.م / شهريًا (أو وفر 20% عند الاشتراك السنوي)
- **إضافة الذكاء الاصطناعي**: +350 ج.م / شهريًا
- **الحد الشهري**: حتى 600 أوردر مكتمل
- **القنوات**: فيسبوك + إنستجرام + واتساب كلاود الرسمي (WhatsApp Business API)
- **المميزات**:
  - محرك الذكاء الاصطناعي لفهم العامية المصرية والفرانكو والأخطاء الإملائية
  - الرد الذكي على الأسئلة الشائعة وسياسات الاستبدال والشحن
  - نظام التحويل البشري الفوري مع إشعار للمشرفين
  - لوحة تحكم متعددة المستخدمين (حتى 3 موظفين)
  - تحليلات مبيعات تفصيلية وتقارير التحويل
  - دعم فني سريع عبر الواتساب

### 3. باقة المحترفين (Pro / Enterprise)
- **السعر الأساسي**: 1199 ج.م / شهريًا (أو وفر 20% عند الاشتراك السنوي)
- **إضافة الذكاء الاصطناعي**: +450 ج.م / شهريًا
- **الحد الشهري**: أوردرات غير محدودة
- **القنوات**: صفحات وقنوات وحسابات واتساب غير محدودة
- **المميزات**:
  - أعلى أولوية معالجة على سيرفرات الذكاء الاصطناعي
  - تخصيص نبرة البوت (Persona) وقواعد العمل المتقدمة
  - ربط Webhooks بأنظمة الشحن والمخازن (ERP)
  - عدد لا محدود من المقاعد وموظفي خدمة العملاء
  - مدير حساب مخصص ودعم طوارئ 24/7
  - ضمان مستوى الخدمة SLA 99.9%

---

## سياسة الاستخدام العادل لباقة الذكاء الاصطناعي (Fair Usage Terms)

1. **استخدام عادل سخي**: صُممت الباقة لتغطي كل محادثات متجرك الاعتيادية بدون حساب معقد للتولكنز أو الكلمات.
2. **لا انقطاع مفاجئ**: لا ينقطع البوت أبداً أثناء الحملات الإعلانية ومواسم التخفيضات الكبرى.
3. **للتجارة وخدمة العملاء فقط**: يحظر استخدام البوت في الرسائل الترويجية العشوائية المجمعة (Spam).
4. **شفافية رسائل Meta**: رسائل WhatsApp Cloud API الرسمية تُحسب بتكلفتها المباشرة بدون أي هوامش ربح مضافة.

---

## طرق الدفع المحلية في مصر
- **InstaPay**: تحويل لحظي من أي بنك مصري
- **محافظ الموبايل**: فودافون كاش، أورنج كاش، اتصالات كاش، وي باي
- **البطاقات البنكية**: فيزا وماستركارد
- **بطاقة ميزة**: دعم البطاقة الوطنية المصرية

---

## الأسئلة الشائعة حول الأسعار
- **هل يوجد تجربة مجانية؟** نعم، أول 30 أوردر مجاناً بالكامل بدون بطاقة بنكية.
- **ماذا لو تجاوزت باقتي؟** نرسل لك تنبيهاً مبكراً، ويمكنك الترقية بدفع فرق السعر فقط بدون أي توقف للبوت.
- **هل أحتاج لسيرفر؟** لا، المنصة سحابية بالكامل وتعمل 24/7 دون أي أجهزة مفتوحة.
`;
  }

  return `# TijaratkBot Pricing & Plans

Automate your social media sales 24/7 directly in Facebook, Instagram, and WhatsApp chat.

## Plans
- **Starter**: 499 EGP/mo (Base) + 250 EGP/mo (AI Addon). Up to 150 orders/mo, FB & IG, interactive catalog, Google Sheets export.
- **Growth (Most Popular)**: 749 EGP/mo (Base) + 350 EGP/mo (AI Addon). Up to 600 orders/mo, FB + IG + WhatsApp Cloud, Egyptian Arabic & Franco understanding, automated FAQ replies, human handover.
- **Pro / Enterprise**: 1199 EGP/mo (Base) + 450 EGP/mo (AI Addon). Unlimited orders, unlimited channels, highest-priority AI, custom webhooks, dedicated account manager.

## AI Addon Fair Usage Terms
- Generous fair usage designed for real e-commerce operations.
- Zero sudden mid-campaign cutoffs.
- Strictly for legitimate inbound sales & support (anti-spam).
- Meta direct API pass-through with no extra margins.

## Local Payment Methods (Egypt)
- InstaPay
- Mobile Wallets (Vodafone Cash, Orange, Etisalat, WE)
- Credit/Debit Cards (Visa & Mastercard)
- Meeza National Cards
`;
}
