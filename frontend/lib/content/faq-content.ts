export interface FaqItem {
  id: string;
  category: { ar: string; en: string };
  question: { ar: string; en: string };
  answer: { ar: string; en: string };
}

export const FAQ_CATEGORIES = [
  { id: "all", label: { ar: "الكل", en: "All" } },
  { id: "getting-started", label: { ar: "البداية والإعداد", en: "Getting Started" } },
  { id: "ai-dialect", label: { ar: "الذكاء الاصطناعي واللهجة المصرية", en: "AI & Egyptian Dialect" } },
  { id: "channels", label: { ar: "القنوات والربط", en: "Channels & Integrations" } },
  { id: "orders-shipping", label: { ar: "الطلبات واستخراج العناوين", en: "Orders & Shipping" } },
  { id: "human-takeover", label: { ar: "التدخل البشري وفريق العمل", en: "Human Handover" } },
  { id: "billing", label: { ar: "الأسعار والاستخدام العادل", en: "Pricing & Fair Usage" } },
];

export const FAQ_ITEMS: FaqItem[] = [
  // Getting Started
  {
    id: "need-website",
    category: { ar: "البداية والإعداد", en: "Getting Started" },
    question: {
      ar: "هل أحتاج لموقع إلكتروني أو متجر شوبيفاي عشان أستخدم تِجارتك بوت؟",
      en: "Do I need a website or Shopify store to use TijaratkBot?",
    },
    answer: {
      ar: "لا على الإطلاق! تِجارتك بوت مصمم ليحول رسائل صفحتك على فيسبوك، وإنستجرام، وواتساب إلى متجر متكامل يبيع مباشرة داخل الشات. العميل يتصفح المنتجات، يختار المقاس واللون، يضيف للسلة، ويكتب عنوانه، والأوردر يتقفل بنجاح بدون ما يخرج من تطبيق الشات لحظة واحدة.",
      en: "Not at all! TijaratkBot is built to turn your Facebook, Instagram, and WhatsApp chats into a standalone storefront. Customers browse products, select variants, add to cart, and enter shipping info without leaving the chat app.",
    },
  },
  {
    id: "setup-time",
    category: { ar: "البداية والإعداد", en: "Getting Started" },
    question: {
      ar: "الإعداد بياخد وقت قد إيه؟ وهل محتاج خبرة برمجية؟",
      en: "How long does setup take, and do I need technical skills?",
    },
    answer: {
      ar: "الإعداد يستغرق أقل من 10 دقائق وبدون كتابة سطر كود واحد! كل اللي عليك هو تسجيل الدخول، ربط صفحتك بضغطة زر عبر Meta Login الرسمي، ورفع منتجاتك إما بملف إكسيل بسيط أو إضافتها يدوياً من لوحة التحكم.",
      en: "Setup takes under 10 minutes with zero coding required. Simply log in, link your social accounts using official Meta Login, and upload your products via a simple Excel sheet or the merchant dashboard.",
    },
  },
  {
    id: "free-trial",
    category: { ar: "البداية والإعداد", en: "Getting Started" },
    question: {
      ar: "إيه تفاصيل التجربة المجانية؟ وهل هتدفعوني فلوس لو مجربتش؟",
      en: "What does the free trial include, and is a credit card required?",
    },
    answer: {
      ar: "نوفر لك تجربة مجانية كاملة لأول 30 أوردر حقيقي يستقبله متجرك. تقدر تجرب كل الميزات والذكاء الاصطناعي وتشوف تأثيره على مبيعاتك وأرباحك بدون إدخال أي كارت بنكي أو دفع أي مليم.",
      en: "We offer a full-featured free trial covering your first 30 real customer orders. Test every capability, including the AI engine, with zero upfront payment and no credit card required.",
    },
  },

  // AI & Dialect
  {
    id: "egyptian-dialect",
    category: { ar: "الذكاء الاصطناعي واللهجة المصرية", en: "AI & Egyptian Dialect" },
    question: {
      ar: "إزاي الذكاء الاصطناعي بيفهم العامية المصرية والفرانكو؟",
      en: "How does the AI handle Egyptian slang and Arabizi (Franco)?",
    },
    answer: {
      ar: "المحرك الخاص بتِجارتك بوت مدرب ومضبوط خصيصاً على مئات الآلاف من محادثات البيع والشراء في السوق المصري. يفهم المصطلحات الدارجة مثل ('في منه كحلي؟'، 'كام من الآخر؟'، 'هيوصل امتى مدينة نصر؟'، 'ممكن مقاس اكس لارج؟') كما يفهم الفرانكو مثل ('3ayez a3raf el se3r') ويتجاوز الأخطاء الإملائية بكل ذكاء وسلاسة.",
      en: "Our proprietary AI engine is specifically fine-tuned on hundreds of thousands of Egyptian social commerce conversations. It understands colloquial nuances, Egyptian regional terms, Arabizi, and spelling mistakes effortlessly.",
    },
  },
  {
    id: "voice-notes-photos",
    category: { ar: "الذكاء الاصطناعي واللهجة المصرية", en: "AI & Egyptian Dialect" },
    question: {
      ar: "لو العميل بعت صورة للمنتج أو سأل عن تفاصيل دقيقة، البوت بيتصرف إزاي؟",
      en: "How does the bot handle product photos or nuanced questions?",
    },
    answer: {
      ar: "البوت يتعرف على استفسارات المنتجات ويربطها فوراً بكتالوج متجرك. وإذا كانت هناك تفاصيل دقيقة مذكورة في وصف المنتج أو في سياسات متجرك (زي سياسة الاستبدال أو مدة الشحن)، البوت يجاوب العميل بدقة واحترافية. وفي الحالات الاستثنائية التي تحتاج قراراً من التاجر، يحول المحادثة فوراً لموظف بشري.",
      en: "The bot references your uploaded catalog and knowledge base to answer specific inquiries immediately. For exceptional customer requests requiring human discretion, it smoothly transfers the chat to your team.",
    },
  },

  // Channels
  {
    id: "whatsapp-official",
    category: { ar: "القنوات والربط", en: "Channels & Integrations" },
    question: {
      ar: "هل الربط مع واتساب رسمي وآمن من الحظر؟",
      en: "Is the WhatsApp integration official and safe from bans?",
    },
    answer: {
      ar: "نعم 100%! نحن نستخدم واجهة واتساب الرسمية السحابية (Official WhatsApp Cloud API) من Meta مباشرة. لا نستخدم برامج غير رسمية أو مسح QR Code مشبوه يعرض رقمك للحظر. رقمك موثق ومحمي تماماً.",
      en: "100% yes! We integrate exclusively via the official Meta WhatsApp Cloud API. We do not use unofficial scrapers or risky web-QR emulators, ensuring your number is completely safe from bans.",
    },
  },
  {
    id: "unified-inbox",
    category: { ar: "القنوات والربط", en: "Channels & Integrations" },
    question: {
      ar: "هل أقدر أدير رسائل فيسبوك وإنستجرام وواتساب من مكان واحد؟",
      en: "Can I manage Facebook, Instagram, and WhatsApp messages in one place?",
    },
    answer: {
      ar: "بالتأكيد. توفر لك لوحة تحكم تِجارتك بوت صندوق رسائل موحد (Unified Inbox). كل المحادثات والطلبات الواردة من كل قنواتك تتجمع في شاشة واحدة منظمة مع وضوح القناة ومصدر الأوردر.",
      en: "Absolutely. TijaratkBot provides a unified inbox where inquiries and orders across Facebook Messenger, Instagram DMs, and WhatsApp are organized in a single intuitive interface.",
    },
  },

  // Orders & Logistics
  {
    id: "address-extraction",
    category: { ar: "الطلبات واستخراج العناوين", en: "Orders & Shipping" },
    question: {
      ar: "إزاي البوت بيفرغ بيانات الشحن المصرية المعقدة بدون أخطاء؟",
      en: "How does the bot accurately extract nuanced Egyptian shipping addresses?",
    },
    answer: {
      ar: "العناوين في مصر عادة ما تكون تفصيلية ومصحوبة بعلامات مميزة (مثل: بجوار صيدلية كذا، عمارة رقم، الدور، الشقة). البوت مبرمج لتقسيم العنوان تلقائياً واستخراج المحافظة، المنطقة، الشارع، أرقام الموبايل (الأساسي والبديل)، وتأكيد صحة رقم التليفون لضمان عدم وجود أرقام ناقصة قبل إرسال الأوردر للمخزن.",
      en: "Egyptian addresses frequently feature landmarks, floor numbers, and secondary phone numbers. Our engine parses the exact governorate, district, landmarks, and validates 11-digit Egyptian phone numbers before confirming.",
    },
  },
  {
    id: "shipping-companies-sync",
    category: { ar: "الطلبات واستخراج العناوين", en: "Orders & Shipping" },
    question: {
      ar: "إزاي الأوردرات بتوصل لشركة الشحن أو لملف الإكسيل؟",
      en: "How do orders sync with shipping companies or Excel?",
    },
    answer: {
      ar: "بمجرد تأكيد العميل للأوردر، تظهر كافة بياناته فوراً في لوحة التحكم وتُسجل تلقائياً في Google Sheets مباشر خاص بك. يمكنك تصدير الملف بضغطة زر لشيت شركات الشحن (مثل بوسطة Bosta، أوتو OTO، مشاوير وغيرها) أو الربط عبر الـ Webhooks.",
      en: "As soon as an order is confirmed, details sync live to your Google Sheet and dashboard. You can export one-click manifests formatted for carriers like Bosta and OTO, or trigger custom Webhook dispatches.",
    },
  },

  // Human Handover
  {
    id: "human-moderators",
    category: { ar: "التدخل البشري وفريق العمل", en: "Human Handover" },
    question: {
      ar: "لو عميل اشتكى أو طلب يكلم إنسان، إيه اللي بيحصل؟",
      en: "What happens if a customer asks for a human or has a complaint?",
    },
    answer: {
      ar: "البوت يكتشف فوراً نية العميل إذا طلب التحدث مع ممثل خدمة عملاء أو كتب شكوى خاصة. في هذه اللحظة، يتوقف البوت عن الرد تلقائياً على تلك المحادثة ويرسل إشعاراً فورياً لفريقك البشري للتدخل والرد مباشرة من لوحة التحكم.",
      en: "The bot immediately identifies escalation intents or complaints. It pauses autonomous responses on that thread and alerts your human moderators to step in and chat directly from the dashboard.",
    },
  },

  // Billing
  {
    id: "ai-fair-usage-explained",
    category: { ar: "الأسعار والاستخدام العادل", en: "Pricing & Fair Usage" },
    question: {
      ar: "ما هي شروط الاستخدام العادل لباقة الذكاء الاصطناعي؟",
      en: "What are the fair usage conditions for the AI Add-on?",
    },
    answer: {
      ar: "سياستنا قائمة على راحة البال للتجار: نوفر استخداماً عادلاً سخياً يغطي جميع المحادثات والمبيعات الاعتيادية لمتجرك حتى في أوقات ذروة الإعلانات. لا نقوم بقطع البوت فجأة، ولا نشغلك بحساب توكنز أو كلمات. الشرط الوحيد هو استخدام البوت في التجارة الحقيقية وخدمة العملاء ومنع الرسائل الدعائية العشوائية (Spam).",
      en: "Our policy guarantees merchant peace of mind: generous fair usage covering all regular store sales conversations, even during peak campaigns. No sudden mid-month cutoffs, no token counting. It simply requires legitimate commercial inbound use and bans spam.",
    },
  },
  {
    id: "payment-types",
    category: { ar: "الأسعار والاستخدام العادل", en: "Pricing & Fair Usage" },
    question: {
      ar: "إيه طرق الدفع المتاحة للاشتراك في مصر؟",
      en: "What payment methods are supported in Egypt?",
    },
    answer: {
      ar: "ندعم جميع طرق الدفع المحلية المفضلة للتجار: إنستاباي (InstaPay)، محافظ الموبايل (فودافون كاش، أورنج، اتصالات، وي)، البطاقات البنكية (Visa & Mastercard)، وبطاقات ميزة الوطنية.",
      en: "We support all primary Egyptian payment methods: InstaPay, Mobile Wallets (Vodafone Cash, Orange, Etisalat, WE), Credit/Debit Cards, and Meeza cards.",
    },
  },
];

export function getFaqMarkdown(lang: string = "ar"): string {
  const isAr = lang === "ar";
  if (isAr) {
    let md = `# الأسئلة الشائعة حول تِجارتك بوت (TijaratkBot FAQ)\n\n`;
    md += `إجابات شاملة ومفصلة عن كل ما يخص أتمتة مبيعات السوشيال ميديا، محرك الذكاء الاصطناعي، وطرق الشحن والدفع في مصر.\n\n---\n\n`;

    const categories = ["البداية والإعداد", "الذكاء الاصطناعي واللهجة المصرية", "القنوات والربط", "الطلبات واستخراج العناوين", "التدخل البشري وفريق العمل", "الأسعار والاستخدام العادل"];

    for (const cat of categories) {
      md += `## ${cat}\n\n`;
      const items = FAQ_ITEMS.filter((item) => item.category.ar === cat);
      for (const item of items) {
        md += `### ${item.question.ar}\n`;
        md += `${item.answer.ar}\n\n`;
      }
    }
    return md;
  }

  let md = `# TijaratkBot Frequently Asked Questions (FAQ)\n\nComprehensive answers about social commerce automation, Egyptian dialect AI, order extraction, and billing.\n\n---\n\n`;
  for (const item of FAQ_ITEMS) {
    md += `### ${item.question.en}\n`;
    md += `${item.answer.en}\n\n`;
  }
  return md;
}
