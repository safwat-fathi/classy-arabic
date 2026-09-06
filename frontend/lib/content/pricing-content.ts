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
    id: "lifetime",
    name: { ar: "وصول مدى الحياة (Lifetime Access)", en: "Lifetime Access" },
    badge: { ar: "دفع لمرة واحدة", en: "One-Time Payment" },
    description: {
      ar: "امتلك النظام لمتجرك وادفع مرة واحدة فقط، بدون اشتراكات شهرية أو سنوية.",
      en: "Own the system for your store with a single payment. No monthly or annual recurring fees.",
    },
    basePrice: 3990,
    aiAddonPrice: 1499,
    ordersLimit: { ar: "حتى 500 أوردر", en: "Up to 500 orders" },
    channels: { ar: "فيسبوك + واتساب فقط", en: "FB & WA only" },
    highlighted: true,
    ctaText: { ar: "احصل على العرض", en: "Get Lifetime Deal" },
    ctaHref: "/demo",
    features: [
      { ar: "دفع لمرة واحدة، وصول مدى الحياة", en: "One-time payment, lifetime access" },
      { ar: "حتى 500 أوردر", en: "Up to 500 orders limit" },
      { ar: "ربط متكامل مع فيسبوك ماسنجر وواتساب كلاود", en: "Facebook Messenger & WhatsApp Cloud integration" },
      { ar: "وضع الكتالوج التفاعلي وسلة الشراء", en: "Interactive catalog & shopping cart" },
      { ar: "تفريغ بيانات الشحن والتصدير لشيتس", en: "Shipping address parsing & Sheets export" },
      { ar: "تعدد مستخدمي لوحة التحكم", en: "Multi-user dashboard access" },
      { ar: "رد ذكي وتلقائي على الأسئلة مع إضافة الـ AI", en: "Automated FAQ replies with AI add-on" },
      { ar: "دعم فني وتحديثات مستمرة", en: "Ongoing support and updates" },
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
      ar: "هل الدفع شهري أم سنوي؟",
      en: "Is billing monthly or annual?",
    },
    a: {
      ar: "نظامنا يعتمد على الدفع لمرة واحدة. لا توجد أي اشتراكات شهرية أو سنوية.",
      en: "Our system is a one-time lifetime payment. There are no monthly or annual subscriptions.",
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

### وصول مدى الحياة (Lifetime Access)
- **السعر الأساسي**: 3990 ج.م تدفع مرة واحدة
- **إضافة الذكاء الاصطناعي**: +1499 ج.م تدفع مرة واحدة
- **الحد**: حتى 500 أوردر
- **القنوات**: فيسبوك + واتساب فقط
- **المميزات**:
  - وضع الكتالوج التفاعلي وسلة التسوق داخل المحادثة
  - تفريغ فوري لبيانات الشحن والعناوين المصرية
  - تصدير مباشر للطلبات إلى Google Sheets وإكسيل
  - لوحة تحكم لإدارة المنتجات وحالات الطلب
  - دعم فني قياسي

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
- **Lifetime Access**: 3990 EGP (Base) + 1499 EGP (AI Addon). One-time payment. Up to 500 orders, FB & WA, interactive catalog, Google Sheets export.

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
