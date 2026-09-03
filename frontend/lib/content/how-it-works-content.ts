export interface StepItem {
  number: string;
  stepName: { ar: string; en: string };
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  description: { ar: string; en: string };
  merchantOutcome: { ar: string; en: string };
  visualExample: {
    userMessage?: { ar: string; en: string };
    botResponse?: { ar: string; en: string };
    metaBadge?: { ar: string; en: string };
    extractedData?: Array<{ key: { ar: string; en: string }; value: { ar: string; en: string } }>;
  };
}

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: "01",
    stepName: { ar: "الخطوة الأولى: الربط السريع", en: "Step 1: 2-Minute Onboarding" },
    title: {
      ar: "اربط صفحاتك وقنواتك بضغطة زر وبشكل رسمي",
      en: "Connect Your Social Channels with 1 Click",
    },
    subtitle: {
      ar: "بدون أكواد، بدون تعقيد، وباعتماد رسمي من Meta",
      en: "Zero coding, zero hassle, 100% Meta compliant",
    },
    description: {
      ar: "سجل حسابك وقم بربط صفحة الفيسبوك وحساب إنستجرام بيزنس ورقم الواتساب الرسمي (Cloud API) بضغطة زر واحدة عبر تسجيل الدخول الرسمي من ميتا. نظامنا يضمن أمان حساباتك تماماً وبدون أي احتمالية للحظر.",
      en: "Sign up and link your Facebook Page, Instagram Business DM, and official WhatsApp Cloud API line in under two minutes via verified Meta OAuth. Clean, secure, and immune to account bans.",
    },
    merchantOutcome: {
      ar: "قنواتك كلها جاهزة لاستقبال الرسائل في نافذة واحدة مجمعة.",
      en: "All communication channels unified and ready in a single dashboard.",
    },
    visualExample: {
      metaBadge: { ar: "موثق ومعتمد من Meta Business Partner", en: "Verified Meta Official Partner Flow" },
    },
  },
  {
    number: "02",
    stepName: { ar: "الخطوة الثانية: المنتجات والكتالوج", en: "Step 2: Upload Products & Rules" },
    title: {
      ar: "ارفع منتجاتك وحدد سياسات التوصيل والاستبدال",
      en: "Upload Catalog, Prices & Store Rules",
    },
    subtitle: {
      ar: "إكسيل بسيط أو واجهة تحكم مرنة وسريعة",
      en: "Simple Excel upload or quick dashboard forms",
    },
    description: {
      ar: "ارفع صور المنتجات، الأسعار، المقاسات، والألوان المتاحة، وحدد أسعار الشحن لكل محافظة (مثلاً: القاهرة والجيزة 45 ج.م، الصعيد 65 ج.م). كما يمكنك كتابة الأسئلة المعتادة لمتجرك (زي خامات المنتجات أو سياسة الاسترجاع) ليتعلمها البوت فوراً.",
      en: "Upload product photos, prices, sizes, and stock. Set shipping rates by Egyptian governorate and configure common policies (fabrics, return window) so the AI learns your exact store rules instantly.",
    },
    merchantOutcome: {
      ar: "البوت جاهز بمعلومات دقيقة ومحدثة عن كل قطعة في مخزنك.",
      en: "The AI is equipped with real-time stock levels, pricing, and answers.",
    },
    visualExample: {
      metaBadge: { ar: "كتالوج تفاعلي + أسعار شحن المحافظات", en: "Dynamic Catalog + Governorate Shipping Matrix" },
    },
  },
  {
    number: "03",
    stepName: { ar: "الخطوة الثالثة: الرد الآلي الذكي", en: "Step 3: Instant AI Sales Engine" },
    title: {
      ar: "الذكاء الاصطناعي يرد في ثانيتين ويفهم العامية المصرية",
      en: "AI Replies in Seconds & Speaks Egyptian Fluently",
    },
    subtitle: {
      ar: "شغال 24/7 حتى في أوقات نومك وفجر المواسم",
      en: "Active 24/7 while your team rests",
    },
    description: {
      ar: "أول ما العميل يبعت 'بكام التيشرت ده وفيه منه اسود لارج؟' البوت يرد عليه فوراً باحترافية، يوضحله السعر، يعرضله صور المقاس المطلوب، ويوفرله زرار مباشر لإضافة المنتج لسلة المشتريات التفاعلية داخل الشات بدون ما يخرجه برة التطبيق.",
      en: "When a customer asks 'how much is this in black large?', the AI replies instantly in warm Egyptian tone, confirms inventory, displays the photo, and presents an in-chat interactive cart.",
    },
    merchantOutcome: {
      ar: "صفر انتظار للعميل، واستغلال لحظة الحماس للشراء بنسبة تحويل 3 أضعاف.",
      en: "Zero buyer wait time, capitalizing on purchase impulse for 3x higher conversions.",
    },
    visualExample: {
      userMessage: { ar: "مساء الخير، الفستان البيج متاح مقاس 42؟ ويوصل إسكندرية بكام؟", en: "Hi! Is the beige dress available in size 42? How much is shipping to Alexandria?" },
      botResponse: { ar: "مساء الورد! أيوة متاح منه مقاس 42 ولونه تحفة 👗 الشحن لإسكندرية 45 ج.م وبيوصل خلال 48 ساعة. تحبي أضيفه لحضرتك في السلة ونقفل الأوردر؟", en: "Good evening! Yes, size 42 is available in beige! Shipping to Alexandria is 45 EGP within 48 hours. Would you like me to add it to your cart and confirm your order?" },
    },
  },
  {
    number: "04",
    stepName: { ar: "الخطوة الرابعة: تفريغ بيانات الشحن", en: "Step 4: Automated Order Parsing" },
    title: {
      ar: "استخراج وتأكيد بيانات الشحن المصرية المعقدة بدقة",
      en: "Flawless Egyptian Shipping Address Extraction",
    },
    subtitle: {
      ar: "الاسم، المحافظة، المنطقة، علامات مميزة، ورقمين موبايل",
      en: "Governorate, district, landmarks & dual phone verification",
    },
    description: {
      ar: "العميل يكتب عنوانه بالطريقة المصرية العادية ('مدينة نصر آخر عباس العقاد عمارة 12 الدور الرابع شقة 8 جنب صيدلية العزبي ورقمي 010... ورقم تاني 012...')، ومحركنا يقسم البيانات ويفلترها ويتحقق من صحة أرقام الموبايل (11 رقم) لتجنب رجوع الشحنات.",
      en: "Buyers write addresses colloquially. Our specialized parser extracts the exact governorate, street, landmark, floor, and validates dual 11-digit phone numbers, slashing delivery failures.",
    },
    merchantOutcome: {
      ar: "أوردرات مؤكدة بنسبة 100% بدون أخطاء إملائية في العناوين أو أرقام ناقصة.",
      en: "100% verified order data without missing digits or garbled delivery sheets.",
    },
    visualExample: {
      extractedData: [
        { key: { ar: "الاسم", en: "Name" }, value: { ar: "أحمد محمود سالم", en: "Ahmed Mahmoud" } },
        { key: { ar: "الموبايل", en: "Phone" }, value: { ar: "01012345678 (واتساب) / 01298765432", en: "01012345678 / 01298765432" } },
        { key: { ar: "المحافظة والمنطقة", en: "Location" }, value: { ar: "القاهرة - مدينة نصر (شارع عباس العقاد)", en: "Cairo - Nasr City" } },
        { key: { ar: "العنوان بالتفصيل", en: "Address" }, value: { ar: "عمارة 12 الدور 4 شقة 8 بجوار صيدلية العزبي", en: "Bldg 12, Floor 4, Apt 8, Next to El-Ezaby" } },
      ],
    },
  },
  {
    number: "05",
    stepName: { ar: "الخطوة الخامسة: التجهيز والشحن", en: "Step 5: Fulfillment & Delivery Sync" },
    title: {
      ar: "الأوردر جاهز للتغليف والشحن تلقائيًا في إكسيل أو سيستم الشحن",
      en: "Instant Sync with Google Sheets & Shipping Carriers",
    },
    subtitle: {
      ar: "بوسطة، أوتو، شيتات إكسيل مخصصة، وإشعارات لحظية",
      en: "Bosta, OTO, customized spreadsheets & instant alerts",
    },
    description: {
      ar: "بمجرد إغلاق الأوردر، ينزل سطر جديد في Google Sheets الخاص بمتجرك، وتظهر تفاصيل الطلب في لوحة التحكم، ويمكن تصدير البوليصة مباشرة لشركة الشحن بضغطة زر واحدة. وموظف التجهيز يبدأ يجهز الشحنة فوراً!",
      en: "The second an order is confirmed, a new row populates your Google Sheet, the order appears on your merchant dashboard, and you can export manifests directly to couriers.",
    },
    merchantOutcome: {
      ar: "توفير 4 إلى 6 ساعات عمل يومياً كانت تضيع في التفريغ اليدوي والرد المتأخر.",
      en: "Saves 4-6 hours of daily manual busywork, eliminating human copying errors.",
    },
    visualExample: {
      metaBadge: { ar: "تصدير فوري بنقرة واحدة لـ Bosta / Sheets", en: "1-Click Dispatch to Bosta & Google Sheets" },
    },
  },
];

export function getHowItWorksMarkdown(lang: string = "ar"): string {
  const isAr = lang === "ar";
  if (isAr) {
    let md = `# كيف يعمل تِجارتك بوت؟ (How TijaratkBot Works)\n\n`;
    md += `دليل شامل يوضح رحلة تحويل رسائل شات السوشيال ميديا (فيسبوك، إنستجرام، واتساب) إلى أوردرات حقيقية مؤكدة وجاهزة للشحن في 5 خطوات متكاملة.\n\n---\n\n`;

    for (const step of HOW_IT_WORKS_STEPS) {
      md += `## ${step.number}. ${step.title.ar}\n`;
      md += `*${step.subtitle.ar}*\n\n`;
      md += `${step.description.ar}\n\n`;
      md += `**النتيجة للتاجر**: ${step.merchantOutcome.ar}\n\n`;
      if (step.visualExample.userMessage) {
        md += `> **رسالة العميل**: ${step.visualExample.userMessage.ar}\n`;
        md += `> **رد البوت**: ${step.visualExample.botResponse?.ar}\n\n`;
      }
      md += `---\n\n`;
    }
    return md;
  }

  let md = `# How TijaratkBot Works\n\nA 5-step operational blueprint for converting social media inquiries on Facebook, Instagram, and WhatsApp into paid, shipping-ready orders 24/7.\n\n---\n\n`;
  for (const step of HOW_IT_WORKS_STEPS) {
    md += `## ${step.number}. ${step.title.en}\n`;
    md += `*${step.subtitle.en}*\n\n`;
    md += `${step.description.en}\n\n`;
    md += `**Merchant Outcome**: ${step.merchantOutcome.en}\n\n---\n\n`;
  }
  return md;
}
