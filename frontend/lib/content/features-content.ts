export interface FeaturePillar {
  id: string;
  badge: { ar: string; en: string };
  title: { ar: string; en: string };
  tagline: { ar: string; en: string };
  description: { ar: string; en: string };
  bulletPoints: Array<{
    title: { ar: string; en: string };
    desc: { ar: string; en: string };
  }>;
  highlightCard: {
    type: "chat" | "stats" | "comparison" | "address";
    title: { ar: string; en: string };
    subtitle?: { ar: string; en: string };
    items?: Array<{ label: { ar: string; en: string }; value: { ar: string; en: string } }>;
  };
}

export const FEATURE_PILLARS: FeaturePillar[] = [
  {
    id: "egyptian-dialect-ai",
    badge: { ar: "محرك الذكاء الاصطناعي المتخصص", en: "Specialized Egyptian AI" },
    title: {
      ar: "فهم عبقري للعامية المصرية، الفرانكو، ومصطلحات البيع والشراء",
      en: "Native Egyptian Colloquial & Arabizi Natural Understanding",
    },
    tagline: {
      ar: "مش مجرد بوت عادي بقوالب جامدة؛ ده بياع مصري شاطر بيفهم قصد الزبون من نص كلمة!",
      en: "Not a rigid decision tree; an authentic Egyptian sales closer that grasps intent instantly.",
    },
    description: {
      ar: "معظم الشات بوتس التقليدية بتفشل وتغضب الزبون المصري لما يكتب 'أصل كنت عاوز لون كحلي لو متاح مقاس 44 يوصل المهندسين بكام'. تِجارتك بوت مدرب على مئات الآلاف من رسائل التجارة في مصر وبيقدر يستخرج النية بدقة 98% ويرد بنبرة ودودة ومقنعة.",
      en: "Traditional flow bots fail when customers write freeform Egyptian slang or typo-heavy messages. TijaratkBot is fine-tuned on real commerce conversations, boasting 98%+ intent precision.",
    },
    bulletPoints: [
      {
        title: { ar: "دعم العامية البيضاء بمختلف لهجات المحافظات", en: "Comprehensive Egyptian Slang Coverage" },
        desc: { ar: "بيفهم كلام القاهرة، إسكندرية، الدلتا، والصعيد بدون أي لخبطة.", en: "Accurately handles Cairo, Alexandria, Delta, and Upper Egypt idioms." },
      },
      {
        title: { ar: "فهم الفرانكو والأخطاء الإملائية الشائعة", en: "Arabizi & Typo Resilience" },
        desc: { ar: "سواء كتب الزبون بالعربي أو الفرانكو أو أخطأ في الحروف، البوت بيفهمه فوراً.", en: "Understands Arabizi (Franco-Arabic) and common phonetic typos flawlessly." },
      },
      {
        title: { ar: "إجابة ذكية على استفسارات المتجر الشائعة", en: "Automated Store Knowledge QA" },
        desc: { ar: "بيرد على تفاصيل الخامات، المقاسات، أوقات العمل، وسياسة الاسترجاع بدقة.", en: "Answers material, sizing, store hours, and return policy questions accurately." },
      },
    ],
    highlightCard: {
      type: "chat",
      title: { ar: "محادثة حقيقية يفهمها البوت في ثوانٍ", en: "Real Conversation Handled Instantly" },
      items: [
        { label: { ar: "العميل", en: "Customer" }, value: { ar: "3ayez a3raf el se3r w hal feh mennoh navy xl?", en: "3ayez a3raf el se3r w hal feh mennoh navy xl?" } },
        { label: { ar: "تِجارتك بوت", en: "TijaratkBot" }, value: { ar: "أهلاً بيك يا فندم! التيشرت سعره 320 ج.م ومتاح منه اللون الكحلي مقاس XL جاهز للشحن فوراً 👕 تحب أضيفه لحضرتك في السلة؟", en: "Welcome! The shirt is 320 EGP and Navy in size XL is available now! Would you like me to add it to your cart?" } },
      ],
    },
  },
  {
    id: "in-chat-catalog-cart",
    badge: { ar: "تجارة تفاعلية داخل الشات", en: "Native Conversational Cart" },
    title: {
      ar: "كتالوج تفاعلي وسلة تسوق كاملة داخل شات العميل",
      en: "Interactive Catalog & Shopping Cart Inside Chat",
    },
    tagline: {
      ar: "مفيش تحويل لروابط خارجية بطيئة بتطفش العميل وتضيع الأوردر!",
      en: "Zero redirection to slow external links that cause cart abandonment.",
    },
    description: {
      ar: "أكبر سبب لضياع المبيعات في مصر هو إرسال رابط موقع إلكتروني خارجي للعميل أثناء حديثه في الشات. تِجارتك بوت بيخلي العميل يتصفح صور المنتجات، يختار المقاس واللون من أزرار تفاعلية أنيقة، ويشوف إجمالي السلة ومصاريف الشحن مباشرة داخل نافذة المحادثة.",
      en: "External website links lose over 70% of Egyptian social shoppers. TijaratkBot enables in-chat browsing, variant selection, live subtotaling, and checkout without ever leaving the conversation.",
    },
    bulletPoints: [
      {
        title: { ar: "تصفح الصور والمتغيرات في كاروسيل سلس", en: "Visual In-Chat Carousel" },
        desc: { ar: "عرض صور المنتجات، الألوان، والمقاسات بأزرار تفاعلية سهلة بنقرة واحدة.", en: "Showcases rich galleries, color swatches, and size selectors natively." },
      },
      {
        title: { ar: "سلة تسوق ديناميكية", en: "Dynamic In-Chat Cart" },
        desc: { ar: "إضافة وتعديل الكميات، حساب الخصومات، وإظهار السعر النهائي لحظياً.", en: "Live quantity adjustments, promo code application, and subtotal calculation." },
      },
      {
        title: { ar: "تقليل معدل الارتداد ومضاعفة الأوردرات", en: "Massive Cart Completion Lift" },
        desc: { ar: "الاستفادة من حماس الزبون لحظة الشات بدلاً من الانتظار لفتح موقع ثقيل.", en: "Converts high-intent moments directly before attention wanders." },
      },
    ],
    highlightCard: {
      type: "stats",
      title: { ar: "أرقام وتأثير الكتالوج التفاعلي", en: "Impact on Order Metrics" },
      items: [
        { label: { ar: "زيادة معدل إتمام الشراء", en: "Checkout Completion Increase" }, value: { ar: "+68%", en: "+68%" } },
        { label: { ar: "سرعة إغلاق المحادثة", en: "Average Time to Close" }, value: { ar: "أقل من دقيقتين", en: "< 2 Minutes" } },
        { label: { ar: "انخفاض الأوردرات الضائعة", en: "Drop-off Reduction" }, value: { ar: "4.2 أضعاف", en: "4.2x Fewer Drops" } },
      ],
    },
  },
  {
    id: "egyptian-address-parsing",
    badge: { ar: "تفريغ فوري وتأكيد الطلبات", en: "Egyptian Address Parser" },
    title: {
      ar: "استخراج بيانات الشحن المصرية بدقة 100% بدون أخطاء يدوية",
      en: "Flawless Egyptian Address Extraction & Data Sanitization",
    },
    tagline: {
      ar: "انسى وجع دماغ التفريغ اليدوي وشركات الشحن اللي بترجع الأوردر بسبب عنوان ناقص!",
      en: "Say goodbye to manual data entry and returned shipments caused by incomplete addresses.",
    },
    description: {
      ar: "العملاء في مصر بيكتبوا العنوان بأسلوب تلقائي غير منظم: 'أحمد إبراهيم 01012345678 شارع الهرم بجوار كافيه كذا الدور التالت شقة 5 الجيزة ومعايا رقم فودافون تاني 01099999999'. نظامنا بيتعرف على كل جزء بدقة، وبيتأكد إن رقم الموبايل 11 رقم سليم، وبيفصل المحافظة عن العنوان التفصيلي تلقائياً.",
      en: "Egyptian buyers write unstructured paragraphs. Our engine parses exact governorates, districts, landmarks, and validates 11-digit mobile numbers, outputting pristine delivery sheets.",
    },
    bulletPoints: [
      {
        title: { ar: "التحقق التلقائي من أرقام الموبايل المصرية", en: "Egyptian Phone Verification" },
        desc: { ar: "التأكد من أن الرقم يبدأ بـ (010، 011، 012، 015) ومكون من 11 رقماً بدون نقص.", en: "Verifies Egyptian mobile prefixes (010, 011, 012, 015) and strictly 11 digits." },
      },
      {
        title: { ar: "فرز المحافظات وتطبيق مصاريف الشحن بدقة", en: "Governorate Shipping Matrix" },
        desc: { ar: "تحديد المحافظة تلقائياً واحتساب تكلفة شحنها الصحيحة بدون تدخل بشري.", en: "Auto-maps governorate to apply correct regional shipping rates." },
      },
      {
        title: { ar: "تصدير مباشر لشيتات الشحن (Bosta, OTO, Google Sheets)", en: "Carrier-Ready Manifests" },
        desc: { ar: "تنزيل شيت إكسيل جاهز للرفع على سيستم شركة الشحن فوراً بدون أي تعديل.", en: "Export manifests ready for immediate courier dispatch with zero reformatting." },
      },
    ],
    highlightCard: {
      type: "address",
      title: { ar: "نموذج استخراج البيانات المفرغة", en: "Parsed Address Blueprint" },
      items: [
        { label: { ar: "المحافظة والمدينة", en: "Governorate / City" }, value: { ar: "الجيزة - الهرم", en: "Giza - Haram" } },
        { label: { ar: "العنوان التفصيلي", en: "Street & Landmarks" }, value: { ar: "شارع الهرم الرئيسي، برج الأطباء، الدور 3، شقة 5", en: "Main Haram St, Doctors Tower, Fl 3, Apt 5" } },
        { label: { ar: "رقم الموبايل والبديل", en: "Primary & Alternate Phone" }, value: { ar: "01012345678 / 01099999999 (مفحوص وسليم)", en: "01012345678 / 01099999999 (Verified)" } },
      ],
    },
  },
  {
    id: "unified-inbox-human-handover",
    badge: { ar: "المرونة والتحكم الكامل", en: "Unified Inbox & Human Handover" },
    title: {
      ar: "صندوق رسائل موحد وتحويل بشري ذكي في ثانية واحدة",
      en: "Unified Social Inbox with Instant Human Takeover",
    },
    tagline: {
      ar: "البوت يخدمك ويقفل الأوردرات، وتيم خدمة العملاء جاهز للتدخل وقت ما تحب بدون أي تضارب.",
      en: "The AI closes orders automatically, while your support team can intervene anytime with zero friction.",
    },
    description: {
      ar: "لو زبون عنده طلب خاص، مفاوضة خاصة، أو محتاج استفسار معقد، البوت بيكتشف ده بذكاء ويوقف نفسه فوراً، ويبعت تنبيه لفريقك بالتدخل. الفريق يقدر يرد مباشرة من لوحة تحكم تِجارتك بوت بدون ما يفتح 3 تطبيقات مختلفة.",
      en: "If a customer requests special negotiation or human support, the bot pauses autonomously and notifies your team. Moderators reply directly from TijaratkBot without app-switching.",
    },
    bulletPoints: [
      {
        title: { ar: "إيقاف ذكي وتلقائي للبوت لمنع الإحراج", en: "Autonomous Bot Pause" },
        desc: { ar: "البوت لا يقاطع الموظف البشري أبداً ويترك له المساحة للحديث مع العميل بحرية.", en: "Prevents embarrassing interruptions when a human agent is active on the chat." },
      },
      {
        title: { ar: "إدارة متعددة القنوات في مكان واحد", en: "Omnichannel Command Center" },
        desc: { ar: "فيسبوك، إنستجرام، وواتساب مجمعين مع فلاتر حسب حالة الأوردر ونوع الرسالة.", en: "Centralize FB, IG, and WhatsApp with smart filters for order states and intents." },
      },
      {
        title: { ar: "صلاحيات ومقاعد لفريق العمل", en: "Role-Based Team Access" },
        desc: { ar: "تخصيص صلاحيات للمشرفين والموظفين لمتابعة المحادثات وتجهيز الطلبات بسهولة.", en: "Assign permission roles to moderators and fulfillment specialists." },
      },
    ],
    highlightCard: {
      type: "stats",
      title: { ar: "كفاءة فريق خدمة العملاء مع تِجارتك بوت", en: "Team Efficiency Uplift" },
      items: [
        { label: { ar: "توفير وقت المشرفين", en: "Time Saved on Repetitive FAQs" }, value: { ar: "85%", en: "85%" } },
        { label: { ar: "سرعة الرد الأولى للعميل", en: "First Response Time" }, value: { ar: "1.8 ثانية", en: "1.8s" } },
        { label: { ar: "تغطية ساعات العمل", en: "Operational Coverage" }, value: { ar: "24/7/365", en: "24/7/365" } },
      ],
    },
  },
];

export function getFeaturesMarkdown(lang: string = "ar"): string {
  const isAr = lang === "ar";
  if (isAr) {
    let md = `# مميزات وإمكانيات منصة تِجارتك بوت (TijaratkBot Features)\n\n`;
    md += `استعراض مفصل لكل المزايا التقنية والتجارية المصممة خصيصاً لمتاجر التجارة الإلكترونية في مصر لزيادة المبيعات وتأكيد الأوردرات من داخل الشات.\n\n---\n\n`;

    for (const pillar of FEATURE_PILLARS) {
      md += `## ${pillar.title.ar}\n`;
      md += `*${pillar.tagline.ar}*\n\n`;
      md += `${pillar.description.ar}\n\n`;
      md += `### النقاط البارزة:\n`;
      for (const bp of pillar.bulletPoints) {
        md += `- **${bp.title.ar}**: ${bp.desc.ar}\n`;
      }
      md += `\n---\n\n`;
    }
    return md;
  }

  let md = `# TijaratkBot Features & Architecture\n\nA comprehensive deep-dive into the specialized capabilities built for Egyptian social commerce.\n\n---\n\n`;
  for (const pillar of FEATURE_PILLARS) {
    md += `## ${pillar.title.en}\n`;
    md += `*${pillar.tagline.en}*\n\n`;
    md += `${pillar.description.en}\n\n`;
    for (const bp of pillar.bulletPoints) {
      md += `- **${bp.title.en}**: ${bp.desc.en}\n`;
    }
    md += `\n---\n\n`;
  }
  return md;
}
