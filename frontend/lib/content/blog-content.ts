export interface BlogPost {
  slug: string;
  title: { ar: string; en: string };
  metaDescription: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  category: { ar: string; en: string };
  readTime: { ar: string; en: string };
  publishedAt: string;
  author: {
    name: { ar: string; en: string };
    role: { ar: string; en: string };
    avatar: string;
  };
  contentHtml?: string;
  markdownContent: { ar: string; en: string };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "comparison-with-other-tools",
    title: {
      ar: "مقارنة شاملة: تِجارتك بوت في مواجهة بوتات الشات التقليدية (ManyChat و Chatfuel) — ليه الشات بوت القديم بيخسر مبيعات في مصر؟",
      en: "Comprehensive Comparison: TijaratkBot vs Traditional Chatbot Builders (ManyChat & Chatfuel) — Why Legacy Bots Lose Sales in Egypt",
    },
    metaDescription: {
      ar: "مقارنة تفصيلية بين الشات بوت التقليدي القائم على القوائم الجامدة وبين تِجارتك بوت المدعوم بالذكاء الاصطناعي العامي. اكتشف كيف تكسب مبيعات أكثر وتتجنب نفور الزبائن.",
      en: "In-depth comparison between rigid flow-based bots (ManyChat, Chatfuel) and TijaratkBot's dialect AI engine. Discover how to close more orders in Egyptian social commerce.",
    },
    excerpt: {
      ar: "الزبون المصري مبيحبش 'اضغط 1 للمقاسات واضغط 2 للأسعار'! لو بتستخدم ManyChat أو Chatfuel في صفحتك، المقال ده هيوضحلك بالأرقام ليه القوالب الجامدة بتطفش الزبائن، وإزاي الذكاء الاصطناعي بيفهم العامية والفرانكو ويقفل الأوردرات بدون مجهود.",
      en: "Egyptian shoppers despise 'Press 1 for Sizes, Press 2 for Prices'. Discover why legacy decision trees fail locally and how native dialect AI delivers 3x conversion rates.",
    },
    category: { ar: "مقارنات وتحليلات السوق", en: "Market Comparisons" },
    readTime: { ar: "7 دقائق قراءة", en: "7 min read" },
    publishedAt: "2026-09-01",
    author: {
      name: { ar: "فريق نمو التجارة", en: "Commerce Growth Team" },
      role: { ar: "خبراء تجارة السوشيال ميديا في مصر", en: "Egyptian Social Commerce Specialists" },
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",
    },
    markdownContent: {
      ar: `# مقارنة شاملة: تِجارتك بوت في مواجهة بوتات الشات التقليدية (ManyChat و Chatfuel)
### ليه الشات بوت القديم القائم على القوائم بيخسر مبيعات في السوق المصري؟

لو سألت أي تاجر شاطر في مصر بيبيع أونلاين على إنستجرام أو فيسبوك: **"إيه أكتر حاجة بتضيع منك وقت ومبيعات؟"**
الإجابة هتكون دايماً واحدة: **"الرد على رسايل الشات وتفريغ بيانات الأوردرات"**.

ولأن الحملات الإعلانية بتجيب مئات الرسايل يومياً، أول فكرة بتخطر على بال التاجر هي اللجوء للأدوات العالمية المعروفة زي ManyChat أو Chatfuel أو بوتات الواتساب القائمة على الشاشات والقوائم.

لكن الصدمة الحقيقية بتيجي بعد أول أسبوع تشغيل: **الزبائن بتتضايق، معدل تحويل الرسايل لأوردرات بينهار، وفريقك بيضطر يرجع يرد يدوي برضه!**

في المقال ده، هنحلل مع بعض أسباب فشل البوتات التقليدية في مصر، وإزاي **تِجارتك بوت (TijaratkBot)** غير قواعد اللعبة بذكاء اصطناعي صُمم خصيصاً للتجارة بالعامية المصرية.

---

## 1. مشكلة "اضغط 1 واضغط 2": ثقافة المشتري المصري لا تقبل الروبوتات الجامدة

الشات بوتس التقليدية بتعتمد على ما يسمى بالـ **Rule-based Decision Trees** (أشجار القرارات المبنية على الكلمات المفتاحية والأزرار). يعني لازم ترسم شجرة معقدة:
- لو العميل داس على زرار كذا، ابعتله كذا.
- لو كتب كلمة "سعر"، ابعتله القائمة دي.

### إيه اللي بيحصل على أرض الواقع؟
الزبون المصري مبيتعاملش مع الشات كأنه ماكينة صراف آلي (ATM). الزبون بيكتب رسالة عفوية وتلقائية جداً زي:
> *"مساء الفل يا غالي، التيشرت الأوفر سايز الأبيض متاح منه لارج؟ وهل خاماته صيفي قطن 100%؟ وممكن يوصل مصر الجديدة بكرة قبل ما أسافر؟"*

**رد بوت ManyChat أو Chatfuel التقليدي:**
> *"عفواً، لم أفهم طلبك! يرجى الضغط على أحد الأزرار التالية: [تصفح المنتجات] [مواعيد العمل] [تواصل مع الموظف]"*

**النتيجة؟** الزبون بيحس بالإحباط والبرود، بيقفل الشات فوراً، ويروح يشتري من المنافس اللي بيرد عليه كإنسان!

---

## 2. لغة الشارع والتجارة: العامية المصرية والفرانكو

السوق المصري له خصوصية فريدة جداً في لغة الشات:
- مزيج بين **العامية المصرية** بمصطلحاتها المتنوعة ("في منه كحلي؟"، "كام من الآخر؟"، "بتوصلوا زايد؟").
- استخدام مكثف للـ **Franco-Arabic** زي: *"3ayez a3raf el se3r"* أو *"feh menno XL?"*.
- أخطاء إملائية سريعة وتبديل للحروف ناتج عن الكتابة بالموبايل على عجل.

الأنظمة القديمة مجهزة فقط للغة الإنجليزية أو العربية الفصحى المعقمة، وبالتالي بتعجز تماماً عن التقاط المقصد الحقيقي. 

في المقابل، **تِجارتك بوت** مجهز بمحرك ذكاء اصطناعي متخصص مدرّب على سلوك المستهلك المصري، بيفهم سياق الرسالة بالكامل ويرد عليه فوراً بنفس لهجة المحادثة الودودة المحترمة:
> *"أهلاً بيك يا فندم! أيوة التيشرت الأوفر سايز الأبيض متاح منه مقاس L جاهز للشحن فوراً، وخامته قطن 100% معالج ضد الانكماش 👕 والشحن لمصر الجديدة 45 ج.م ويوصلك بكرة بإذن الله. تحب أحجزه لحضرتك فوراً؟"*

---

## 3. تفريغ العناوين والشحن: المأساة الكبرى لشركات الشحن في مصر

العناوين في مصر حكاية تانية خالص! العميل مبيدخلش يملأ استمارة فيها:
- الدولة: مصر
- الرمز البريدي: 11371
- الشارع: رقم كذا

العميل بيكتب العنوان في فقرة واحدة على الواتساب:
> *"ابعتلي على المنصورة، توريل الجديدة، شارع سعد زغلول بعد صيدلية الطرشوبي عمارة برج النور الدور الخامس شقة 9، ورقمي 01012345678 ومعايا فودافون كاش 01234567890"*

- **في الأنظمة التقليدية**: المودريتور لازم يقعد ينسخ الاسم، وبعدين يدور على رقم التليفون، ويفصل المحافظة عن المنطقة عشان يحطها في شيت الإكسيل. وأي رقم ناقص بيرجع الشحنة ويكلف التاجر مصاريف شحن رايح جاي بدون أي فائدة!
- **في تِجارتك بوت**: محرك استخراج البيانات المخصص (Address Extraction Engine) بيحلل الرسالة في أجزاء من الثانية، يستخرج المحافظة والمنطقة تلقائياً، يتأكد إن رقم الموبايل 11 رقم سليم ومش ناقص، ويصدر كل الداتا دي في ثانية واحدة لـ Google Sheets وسيستم الشحن الخاص بيك!

---

## 4. الكتالوج التفاعلي وسلة الشراء: البيع داخل الشات vs التحويل لموقع خارجي

معظم مستخدمي ManyChat بيعملوا حاجة خطيرة جداً بتدمر مبيعاتهم: أول ما العميل يسأل عن منتج، البوت يبعتله لينك الموقع الإلكتروني ويقوله: *"تفضل بالشراء عبر الرابط!"*.

دراسات التجارة الإلكترونية في مصر أثبتت إن **أكثر من 72% من المشترين بيخرجوا ومبيكملوش الأوردر** أول ما يتفتح رابط خارجي! ليه؟
1. باقة الموبايل إنترنت ضعيفة أو بطيئة في تحميل صفحات الويب الثقيلة.
2. الكسل من إنشاء حساب، وتذكر كلمة السر، وملء 6 صفحات من استمارات التسجيل.
3. تفضيل الدفع عند الاستلام والتأكيد المباشر مع التاجر.

تِجارتك بوت بيحل المعضلة دي بذكاء: **البيع كامل بيحصل داخل الشات نفسه!** العميل بيتصفح الكتالوج في صور وكاروسيل جذاب، بيختار اللون والمقاس بزرار تفاعلي، ويشوف سلة مشترياته بتتحسب لحظة بلحظة بدون مغادرة إنستجرام أو ماسنجر أو واتساب.

---

## 5. جدول المقارنة الشامل

| الميزة | تِجارتك بوت (TijaratkBot) | بوتات الشات التقليدية (ManyChat / Chatfuel) |
| :--- | :--- | :--- |
| **طريقة فهم العميل** | ذكاء اصطناعي يفهم العامية المصرية، السياق، والفرانكو بنسبة دقة 98%+ | قواعد وأزرار جامدة وقوائم تتطلب إدخال نصوص حرفية |
| **سلة التسوق والتصفح** | سلة تسوق تفاعلية كاملة داخل المحادثة مباشرة | مجرد روابط لمواقع خارجية تؤدي لارتفاع نسبة ترك السلة |
| **استخراج بيانات الشحن** | تفريغ تلقائي للمحافظة، المنطقة، العلامات المميزة، وفحص رقم الموبايل | إما جمع يدوي أو طلب ملء فورمات طويلة تنفر المشتري |
| **ملاءمة السوق المحلي** | مصمم ومطور خصيصاً للتجارة والمستهلك المصري وطرق دفعه | أدوات غربية موجهة لثقافة الشراء الأمريكية والأوروبية |
| **التحويل البشري الذكي** | إيقاف فوري وتلقائي للبوت عند طلب العميل إنسان مع تنبيه المشرف | تداخل بين ردود البوت وردود الموظف يسبب إحراجاً للمتجر |
| **الدعم الفني واللغة** | دعم فني محلي مباشر عبر الواتساب بالعربي وبفهم لطبيعة البيزنس | تذاكر دعم بالإنجليزي وبفوارق توقيت كبيرة |

---

## الخلاصة: الاستثمار في المبيعات، مش مجرد شات!

الهدف من أتمتة متجرك مش إنك تشغل روبوت يرد ببرود على العملاء؛ الهدف هو **إنك متفوتش ولا أوردر، وترد في ثانية واحدة في عز حماس المشتري، وتقدم تجربة تسوق راقية وسهلة تحبب الزبون في براندك.**

جرب **تِجارتك بوت** النهاردة مجاناً في أول 30 أوردر وشوف الفرق بنفسك في أرقام مبيعاتك وراحة بالك!
`,
      en: `# Comprehensive Comparison: TijaratkBot vs Legacy Chatbot Builders (ManyChat & Chatfuel)
### Why Decision-Tree Bots Fail in the Egyptian Social Commerce Ecosystem

When asking Egyptian online merchants about their primary operational bottleneck, the answer is unanimous: **"Handling chat inquiries and manually processing order addresses."**

To cope with advertising traffic, merchants often turn to well-known international builders like ManyChat or Chatfuel. However, within days of deployment, conversion rates drop, customers express frustration with robotic menus, and staff end up taking over manually.

Here is why rigid decision-tree bots fail locally, and how TijaratkBot revolutionizes conversational commerce with specialized Egyptian AI.

## 1. The Death of 'Press 1 for Sizes': Egyptian Cultural Nuances
Egyptian consumers interact naturally, sharing full-sentence requests packed with colloquial queries rather than clicking through 5 levels of button trees. When a rigid bot fails to parse freeform text, the customer simply leaves for a competitor.

## 2. Egyptian Arabic & Arabizi Fluency
TijaratkBot is fine-tuned on authentic MENA commerce dialogue, handling slang, Franco-Arabic, and mobile typos effortlessly with 98%+ intent accuracy.

## 3. Egyptian Address Extraction
Unstructured Egyptian addresses (landmarks, floors, alternate numbers) break standard forms. TijaratkBot segments governorates, districts, and strictly validates 11-digit mobile numbers for pristine delivery dispatch.

## 4. In-Chat Checkout vs Link Redirection
Dropping external web links into chat loses over 70% of Egyptian buyers. TijaratkBot completes product selection, variant picking, and checkout natively inside the messaging app.
`,
    },
  },
  {
    slug: "why-sell-from-chat-inbox",
    title: {
      ar: "ليه لازم تبيع من داخل شات السوشيال ميديا؟ وليه موقع الويب لوحده بيضيّع 70% من مبيعاتك في مصر؟",
      en: "Why You Must Sell Directly from Your Chat Inbox: How Standalone Websites Lose 70% of Sales in Egypt",
    },
    metaDescription: {
      ar: "دراسة تحليلية لسلوك المشتري المصري على إنستجرام وفيسبوك وواتساب. اكتشف لماذا تتفوق التجارة عبر المحادثات على المتاجر التقليدية بمعدل تحويل 3 أضعاف.",
      en: "An analytical deep dive into Egyptian consumer behavior on Instagram, Facebook, and WhatsApp. Learn why conversational commerce outperforms traditional web storefronts.",
    },
    excerpt: {
      ar: "هل فكرت قبل كده ليه إعلاناتك بتجيب زيارات كتير على الموقع بس نسبة اللي بيشتروا ضعيفة جداً؟ في مصر، الشات هو الملك! اكتشف سيكولوجية المشتري المصري وليه البيع المباشر من الإنبوكس هو سر أرباح أكبر براندات التجارة الإلكترونية اليوم.",
      en: "Why do expensive ads drive web traffic but meager conversions? In Egypt, chat is king. Discover consumer psychology and why native in-chat ordering triples your ROI.",
    },
    category: { ar: "استراتيجيات التجارة الإلكترونية", en: "E-Commerce Strategy" },
    readTime: { ar: "6 دقائق قراءة", en: "6 min read" },
    publishedAt: "2026-09-02",
    author: {
      name: { ar: "سيف الدين القاضي", en: "Seif El-Kady" },
      role: { ar: "مستشار تسويق ونمو المبيعات", en: "Commerce Strategy Director" },
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    },
    markdownContent: {
      ar: `# ليه لازم تبيع من داخل شات السوشيال ميديا؟
### وليه الاعتماد على موقع الويب لوحده بيضيّع أكتر من 70% من مبيعات متجرك في مصر؟

لو بتصرف فلوس على إعلانات فيسبوك وإنستجرام وتيك توك، فأكيد مريت بالمشهد ده:
الحملة جايبة آلاف النقرات (Clicks)، الزوار بيدخلوا على صفحة المنتج في موقعك أو متجرك، وفجأة تلاقي **نسبة الشراء الفعلية (Conversion Rate) لا تتجاوز 1% أو 1.5%!**

بينما لو بصيت على الرسايل اللي بتجيلك على الخاص: الزبون بيبعت صورة المنتج ويسأل: *"لسه متاح؟"* أو *"هيوصل امتى؟"* ومستني حد يدردش معاه ويقفل معاه الأوردر.

السؤال هنا: **ليه المستهلك المصري بيفضل الشات ويهرب من مواقع الويب؟ وليه البراندات اللي بتبيع مباشرة من داخل الشات هي اللي بتحقق أعلى أرباح في السوق النهاردة؟**

---

## 1. ثقافة الشراء في مصر: "أنا عايز أكلم حد يطمّني"

التجارة الإلكترونية في الشرق الأوسط عموماً، وفي مصر خصوصاً، ليست مجرد عملية رقمية باردة؛ بل هي **تجربة اجتماعية مبنية على الثقة**.

المشتري المصري لما يشوف إعلان، بيكون جواه عدة مخاوف طبيعية جداً:
- هل الخامة اللي في الصورة هي اللي هتوصلني بجد ولا مقلب؟
- هل المتجر ده شغال ولا صفحة وهمية هتاخد بياناتي؟
- لو المقاس طلع مش مظبوط، هعرف أستبدله بسهولة ولا هدوخ؟

لما بتبعت الزبون لموقع ويب خارجي، بيحس إنه لوحده قدام شاشة صامتة. أما لما بيلاقي **رد فوري داخل الشات في أقل من ثانيتين**، بيحس بالأمان والاطمئنان، وبيتأكد إن وراء البراند ده كيان حقيقي مهتم ومستعد لخدمته فوراً.

---

## 2. احتكاك الروابط الخارجية (Friction) ومعدل الارتداد الكارثي

تعال نحسبها من وجهة نظر العميل على الموبايل:
1. العميل بيتصفح إنستجرام أو فيسبوك مستمتع بوقته.
2. داس على إعلان متجرك، فالمتصفح الداخلي لتطبيق فيسبوك بيفتح ببطء.
3. صفحة الموقع بتاخد من 4 إلى 8 ثواني عشان تفتح بالصور والجافاسكريبت.
4. الزبون بيختار المنتج، يدوس "إضافة للسلة"، فالموقع يطلب منه تسجيل حساب جديد وكتابة الإيميل والباسورد!
5. صفحة الدفع تطلب الرمز البريدي وبيانات تفصيلية صعبة على شاشة موبايل صغيرة.

**إيه النتيجة؟**
في كل خطوة من الخطوات دي، بتخسر 20% إلى 30% من المهتمين. على بال ما يوصل لصفحة تأكيد الأوردر، بيكون 70% إلى 80% من المشترين قفلوا الصفحة ورجعوا يكملوا تصفح!

**أما في تجربة الشات مع تِجارتك بوت:**
العميل لا يغادر تطبيقه المفضل إطلاقاً! 
- بيشوف الكتالوج داخل المحادثة.
- بيدوس على المقاس واللون اللي عاوزه بلمسة واحدة.
- بيكتب عنوانه ورقم تليفونه بالطريقة اللي متعود عليها.
- الأوردر بيتقفل في أقل من دقيقة وبدون أي خطوة تعقيد واحدة!

---

## 3. الدفع عند الاستلام (COD) وتأكيد الجدية

أكتر من 75% من مشتريات الأونلاين في مصر بتعتمد على **الدفع عند الاستلام (Cash on Delivery)**. 
المشكلة الكبرى في مواقع الويب هي الأوردرات الوهمية أو الزبائن اللي بتطلب وتنسى، ولما المندوب يوصل يكتشف إن العميل قفل تليفونه أو رفض الاستلام، والتاجر يتحمل مصاريف الشحن!

في شات السوشيال ميديا، المحادثة بتسمح للبوت بتأكيد الأوردر ومراجعته مع العميل في التو واللحظة:
> *"تمام يا فندم! أوردر حضرتك جاهز: تيشرت أوفر سايز أسود مقاس XL، الإجمالي مع الشحن 365 ج.م والدفع كاش عند الاستلام بعد المعاينة، هيوصلك يوم الأربعاء بإذن الله. رقم حضرتك لتأكيد موعد وصول المندوب هو 01012345678.. تمام نعتمد الشحن؟"*

الأسلوب ده بيرفع نسبة استلام الشحنات (Delivery Rate) لأكتر من **88% إلى 94%** مقارنة بمواقع الويب!

---

## 4. البيع بالدافع اللحظي (Impulse Buying) وسرعة الرد

التجارة عبر السوشيال ميديا قائمة بشكل أساسي على **الشراء العاطفي اللحظي**. الزبون شاف قطعة عجبتها، وعايز يشتريها دلوقتي حالا.
- لو بعت رسالة والمتجر رد بعد 30 دقيقة: حماس الزبون هدأ، وممكن يكون شاف إعلان تاني لمنافس واشترى منه.
- لو بعت رسالة وتِجارتك بوت رد في **ثانية ونصف**، واستعرض الألوان المتاحة وأكد المقاس وقفل الأوردر في دقيقتين: الصفقة تمت بنجاح قبل ما انتباه الزبون يتشتت!

---

## الخلاصة: مستقبلك التجاري داخل صندوق الرسائل

موقع الويب أداة ممتازة لعرض الكتالوج وبناء هوية البراند على المدى الطويل، لكن **ماكينة الكاش ومعدلات التحويل الأسطورية في مصر موجودة جوة شات السوشيال ميديا!**

الدمج بين راحة الشات وقوة الذكاء الاصطناعي مع **تِجارتك بوت** بيمنحك متجر متكامل شغال 24 ساعة، بيقفل مبيعاتك وأنت نايم، وبيوفر عليك آلاف الجنيهات في مصاريف المودريتورز وتفريغ الشيتات.

**ابدأ الآن مجاناً** وشوف بنفسك إزاي شات صفحتك هيتحول لأقوى بياع في فريقك!
`,
      en: `# Why Selling Directly from Your Chat Inbox Outperforms Websites in Egypt
### Why Traditional Web Stores Lose Over 70% of Potential Social Commerce Revenue

If you run paid ads on Meta or TikTok, you are familiar with the phenomenon: thousands of high-intent clicks landing on external pages, yet the final checkout conversion rate stagnates at 1-1.5%. Meanwhile, customers flock to your DMs asking for sizes and prices.

Here is why conversational commerce in chat consistently delivers 3x higher conversion rates in Egypt compared to standalone websites.

## 1. Conversational Trust Over Cold Interfaces
Egyptian buyers seek human reassurance: fabric quality, real sizing advice, and quick dispute resolution. Instant, friendly chat replies eliminate buyer hesitations immediately.

## 2. Frictionless Checkout Inside the App
Mobile web stores suffer high drop-offs: slow browser loading times, account creation friction, and complex billing forms. In-chat checkout keeps the buyer engaged inside Instagram or WhatsApp with zero external hops.

## 3. Cash-on-Delivery (COD) Confirmation
Conversational order verification in chat confirms phone numbers and delivery dates, boosting delivery fulfillment rates from typical 65% website baselines to 90%+.

## 4. Capturing Impulse Buying in Seconds
Social buying is driven by immediate desire. Instant AI replies capture this enthusiasm before attention drifts to another ad.
`,
    },
  },
];

export function getBlogListMarkdown(lang: string = "ar"): string {
  const isAr = lang === "ar";
  if (isAr) {
    let md = `# مدونة تِجارتك بوت (TijaratkBot Blog)\n\n`;
    md += `أدلة، استراتيجيات، ومقارنات عملية للتجار وأصحاب البراندات لمضاعفة مبيعات السوشيال ميديا والتجارة الإلكترونية في مصر.\n\n---\n\n`;

    for (const post of BLOG_POSTS) {
      md += `## [${post.title.ar}](/blog/${post.slug})\n`;
      md += `- **التصنيف**: ${post.category.ar} | **وقت القراءة**: ${post.readTime.ar} | **تاريخ النشر**: ${post.publishedAt}\n`;
      md += `${post.excerpt.ar}\n\n`;
      md += `[قراءة المقال بالكامل](/blog/${post.slug}) | [نسخة الماركداون للـ AI](/blog/${post.slug}.md)\n\n---\n\n`;
    }
    return md;
  }

  let md = `# TijaratkBot Blog & Guides\n\nStrategies, technical breakdowns, and playbooks for scaling social commerce sales in Egypt.\n\n---\n\n`;
  for (const post of BLOG_POSTS) {
    md += `## [${post.title.en}](/blog/${post.slug})\n`;
    md += `- **Category**: ${post.category.en} | **Read Time**: ${post.readTime.en} | **Date**: ${post.publishedAt}\n`;
    md += `${post.excerpt.en}\n\n`;
    md += `[Read Full Article](/blog/${post.slug}) | [AI Markdown Version](/blog/${post.slug}.md)\n\n---\n\n`;
  }
  return md;
}

export function getArticleMarkdown(slug: string, lang: string = "ar"): string | null {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return null;
  return lang === "ar" ? post.markdownContent.ar : post.markdownContent.en;
}
