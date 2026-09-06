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
    slug: "tijaratkbot-vs-arabybot",
    title: {
      ar: "مقارنة شاملة: تِجارتك بوت في مواجهة عربي بوت (ArabyBot) — أيهما أفضل لمتجرك الإلكتروني في مصر؟",
      en: "Comprehensive Comparison: TijaratkBot vs ArabyBot — Which Platform Best Drives E-Commerce Orders in Egypt?",
    },
    metaDescription: {
      ar: "مقارنة تفصيلية ومحايدة بين تِجارتك بوت وعربي بوت (ArabyBot). اكتشف الفرق بين منصات الحملات والتسويق وبين بائع الذكاء الاصطناعي المتخصص في قفل المبيعات بالعامية المصرية وسلة الشراء الفورية.",
      en: "Objective in-depth comparison between TijaratkBot and ArabyBot. Learn the core architectural differences between broadcast marketing bots and conversational AI sales closers.",
    },
    excerpt: {
      ar: "هل تبحث عن شات بوت لأتمتة محادثات متجرك على واتساب وإنستجرام؟ نقارن في هذا الدليل بين تِجارتك بوت وعربي بوت (ArabyBot) من حيث فهم العامية المصرية، سلة الشراء داخل الشات، وتكلفة الرسائل والتحويلات.",
      en: "Choosing between TijaratkBot and ArabyBot? Compare their conversational capabilities, checkout friction, address extraction, and pricing models for Egyptian social commerce.",
    },
    category: { ar: "مقارنات وتحليلات السوق", en: "Market Comparisons" },
    readTime: { ar: "8 دقائق قراءة", en: "8 min read" },
    publishedAt: "2026-09-06",
    author: {
      name: { ar: "فريق تِجارتك بوت", en: "TijaratkBot Team" },
      role: { ar: "فريق أبحاث وتطوير التجارة عبر المحادثات", en: "Conversational Commerce R&D Team" },
      avatar: "/icon1.png",
    },
    markdownContent: {
      ar: `# مقارنة شاملة: تِجارتك بوت في مواجهة عربي بوت (ArabyBot)
### أيهما أنسب لمتجرك الإلكتروني لزيادة المبيعات وقفل الأوردرات في مصر؟

إذا كنت تدير متجراً أو براند تجارة إلكترونية في مصر وتعتمد على إعلانات فيسبوك وإنستجرام وتيك توك، فأنت تعلم يقيناً أن **صندوق الرسائل (Inbox)** هو المكان الذي تُحسم فيه الصفقات وتتحقق فيه الأرباح.

مع تزايد أعداد الرسائل اليومية، يصبح الاعتماد على الرد اليدوي أمراً مستحيلاً ومكلفاً، وهنا يبدأ البحث عن أفضل شات بوت لإدارة محادثات واتساب وماسنجر وإنستجرام.

في السوق العربي والمصري، يبرز اسمان رئيسيان بحلول متقدمة: **تِجارتك بوت (TijaratkBot)** و **عربي بوت (ArabyBot)**.

ولكن، رغم تشابه بعض القنوات التي تدعمها المنصتان، إلا أن **الفلسفة الهندسية ونموذج العمل لكل منهما يختلفان تماماً**:
- هل تبحث عن منصة تركز على **التسويق الشامل، إرسال حملات البرودكاست الجماعية، وتوثيق أرقام OTP عبر واتساب**؟
- أم تبحث عن **بائع ذكاء اصطناعي متخصص في إغلاق المبيعات (Sales Closer)، يفهم العامية المصرية، ويستخرج بيانات العناوين والشحن آلياً، ويدير سلة تسوق كاملة داخل الشات**؟

في هذا المقال، نقدم مقارنة محايدة ودقيقة لمساعدتك على اختيار الحل الأمثل لنمو أعمالك.

---

## 1. الفلسفة الأساسية والهدف من المنصة

| وجه المقارنة | تِجارتك بوت (TijaratkBot) | عربي بوت (ArabyBot) |
| :--- | :--- | :--- |
| **التركيز الأساسي** | بائع ذكاء اصطناعي متخصص في **إغلاق المبيعات وقفل الأوردرات** داخل الشات | منصة **تسويق وحملات جماعية وأتمتة محادثات** متعددة القنوات |
| **طبيعة المعالجة** | استخراج ذكي لبيانات المنتجات، السلة، والعنوان بدون مغادرة المحادثة | حملات بث (Broadcast)، أكواد OTP، وردود تعليقات ومحادثات عامة |
| **الجمهور المستهدف** | متاجر وبراندات السوشيال ميديا والتجارة المعتمدة على الدفع عند الاستلام (COD) | الشركات التي تحتاج حملات تسويقية كبيرة وتوثيق رسمي عبر شريك Meta |

### عربي بوت (ArabyBot): قوة التسويق والمراسلات المؤسسية
عربي بوت منصة ممتازة ومعتمدة كشريك رسمي لـ Meta. قوتها الضاربة تكمن في:
1. **حملات البث الجماعي (Broadcast):** إرسال رسائل ترويجية لآلاف العملاء في حملة واحدة عبر WhatsApp Cloud API.
2. **خدمة رسائل التحقق (OTP):** إرسال أكواد التأكيد للمواقع والتطبيقات.
3. **أتمتة السوشيال ميديا:** الرد على تعليقات المنشورات وتحويل المعلقين إلى رسائل خاصة في الماسنجر وإنستجرام.

إذا كان هدفك الأساسي هو تشغيل حملات تسويقية وإرسال نشرات دورية للعملاء، فعربي بوت يقدم أدوات متينة في هذا المجال.

### تِجارتك بوت (TijaratkBot): بائع ذكي يركز على الكاش والأوردرات
تِجارتك بوت بُنيت من اليوم الأول لهدف واحد لا شريك له: **تحويل محادثة العميل الباردة إلى أوردر شراء مؤكد في أقل من دقيقتين**.
بدلاً من مجرد إرسال عروض ترويجية، يتولى تِجارتك بوت:
1. فهم لغة العميل العامية وتفضيلاته للمقاسات والألوان.
2. إدارة سلة تسوق حية وحساب مصاريف الشحن حسب المحافظة في التو واللحظة.
3. استخراج العنوان المصري المعقد وتأكيد رقم الهاتف آلياً.
4. إرسال الأوردر فوراً لسيستم الشحن وجداول العمليات الخاصة بك.

---

## 2. فهم اللغة: العامية المصرية والفرانكو مقابل القوالب المعقمة

المستهلك المصري لا يتحدث بالعربية الفصحى، ولا يكتب وفق قوالب جاهزة. الزبون يكتب جملاً سريعة مثل:
> *"عايز تيشيرت أسود لارج هاتهولي مع المندوب بكرة على كفر عبده جنب صيدلية خليل"*

- **في عربي بوت:** توفر المنصة وكلاء ذكاء اصطناعي وقوالب ردود، ولكنها صُممت لتخدم مختلف اللهجات في الشرق الأوسط (مصر، السعودية، الإمارات)، مما يجعل الردود أحياناً تميل للرسمية، أو تتطلب ضبطاً دقيقاً ومطولاً للقواعد والمستندات (RAG).
- **في تِجارتك بوت:** محرك الذكاء الاصطناعي مدرب خصيصاً على **المحادثات التجارية العامية المصرية والمصطلحات الدارجة والفرانكو (Franco-Arabic)**. يلتقط تفاصيل المقاس واللون والمنطقة حتى مع وجود أخطاء إملائية شائعة على الموبايل، ويرد بلهجة ودودة تشبه أمهر بائع في متجرك.

---

## 3. تجربة الشراء وسلة التسوق (In-Chat Checkout)

واحدة من أكبر المشاكل في تجارة السوشيال ميديا هي **هروب العميل (Drop-off)** عند إرسال روابط لمواقع خارجية.

- **عربي بوت:** يتيح عرض الكتالوج وتوصيل المتجر، ولكنه في كثير من المسارات يوجه العميل إلى روابط الويب لإتمام الشراء أو الاعتماد على قوالب متجر واتساب القياسية.
- **تِجارتك بوت:** يوفر **سلة تسوق تفاعلية داخل الشات نفسه**. يرى العميل ملخص أوردره، يعدل الكميات، ويؤكد طريقة الدفع (كاش عند الاستلام أو تحويل رقمي) في شاشة واحدة دون أن يفتح متصفحاً خارجياً أو ينشئ حساباً جديداً.

---

## 4. استخراج العناوين المصرية المعقدة

في مصر، نادراً ما يستخدم المشترون الرموز البريدية. العناوين تأتي عفوية ومختلطة بالعلامات المميزة ورقم الشقة والدور:
> *"العنوان: شبين الكوم، شارع صبري أبو علم، برج الصفا، الدور التالت شقة 6، ورقمي التاني 010xxxxxxxx"*

- **في عربي بوت:** قد يتطلب الأمر أسئلة متتالية (ما هي محافظتك؟ ثم ما هو شارعك؟) أو الاعتماد على نماذج إدخال بيانات، وهو ما يسبب ملل العميل وترك المحادثة.
- **في تِجارتك بوت:** يمتلك محركاً عصبياً مخصصاً لاستخراج العناوين (Egyptian Address Extraction Engine). يقرأ الرسالة بضغطة زر واحدة، ويفصل المحافظة، والمنطقة، والعلامة المميزة، ويتأكد من صحة رقم الموبايل المصري (11 رقماً)، ويفرغ البيانات فورياً في شيتات العمليات.

---

## 5. جدول المقارنة الشامل

| الميزة والقدرة | تِجارتك بوت (TijaratkBot) | عربي بوت (ArabyBot) |
| :--- | :--- | :--- |
| **الهدف الأبرز** | قفل الأوردرات ومضاعفة مبيعات السوشيال ميديا | أتمتة المحادثات والحملات التسويقية ورسائل OTP |
| **فهم العامية المصرية والفرانكو** | دقة فائقة متخصصة في لغة التجارة المصرية | ممتاز عموماً مع تركيز على مختلف لهجات الشرق الأوسط |
| **سلة تسوق كاملة داخل الشات** | نعم — تصفح، سلة، وتأكيد أوردر بالكامل داخل الشات | يعتمد على قوالب الكتالوج والروابط الخارجية |
| **استخراج العناوين الذكي** | تفريغ تلقائي للمحافظات والمناطق وفحص الموبايل | يتطلب تدفقات وأسئلة متعددة للحصول على الحقول |
| **تأكيد الدفع عند الاستلام (COD)** | محرك تأكيد مخصص لرفع نسبة استلام الشحنات إلى 90%+ | متاح عبر تكاملات وأتمتة مخصصة |
| **حملات البث الجماعي (Broadcast)** | تركز على المتابعات البيعية للعملاء المهتمين | حملات جماعية واسعة النطاق لآلاف الأرقام |
| **شريك Meta رسمي** | يعتمد تكاملات Meta Cloud API القياسية | شريك رسمي معتمد لـ Meta مع ميزات التوثيق المؤسسي |
| **طبيعة التسعير** | باقات شهرية واضحة ومناسبة بالجنيه المصري للمتاجر | باقات تتناسب مع الشركات ومستهلكي رسائل Meta الرسمية |

---

## متى تختار عربي بوت (ArabyBot)؟
- إذا كنت تدير شركة كبيرة تحتاج إلى **إرسال حملات تسويقية ضخمة (Broadcasts)** لعشرات الآلاف من الأرقام دورياً.
- إذا كنت بحاجة إلى خدمة **إرسال أكواد تحقق (OTP)** لتطبيق هاتفي أو منصة ويب عبر واتساب.
- إذا كنت تركز على التواجد المؤسسي متعدد الدول في الخليج ومصر وتريد شريكاً معتمداً رسمياً من Meta.

## متى تختار تِجارتك بوت (TijaratkBot)؟
- إذا كان همك الأول هو **وقف نزيف المبيعات الضائعة في الإنبوكس** وتحويل زوار إعلاناتك لأوردرات فورية.
- إذا كنت تبيع داخل مصر وتريد نظاماً يفهم طبيعة المستهلك المصري، والعناوين غير المهيكلة، والدفع عند الاستلام.
- إذا كنت تريد حلاً اقتصادياً وسريعاً يعمل كـ "بائع محترف" 24 ساعة دون الحاجة لتوظيف فريق مودريتورز كبير.

---

## الخلاصة والقرار

كلتا المنصتين تقدمان تكنولوجيا متطورة، ولكن الفارق يكمن في أولوياتك:
- **عربي بوت** هو خيارك الأقوى للمراسلات المؤسسية والحملات الإعلانية الجماعية.
- **تِجارتك بوت** هو ماكينتك المخصصة لبيع منتجاتك، وتأكيد شحناتك، ورفع نسبة الأوردرات الناجحة داخل السوق المصري.

**جرب تِجارتك بوت مجاناً لأول 30 أوردر**، ولاحظ الفارق في سرعة إغلاق الصفقات ورضا العملاء!
`,
      en: `# Comprehensive Comparison: TijaratkBot vs ArabyBot
### Which Platform Is Best Suited to Scale E-Commerce Sales in Egypt?

If you manage an e-commerce brand in Egypt running paid campaigns on Meta and TikTok, you already know that your messaging inbox (WhatsApp, Instagram, Messenger) is where purchasing decisions are made.

When message volumes surge, two prominent platforms frequently emerge for automation: **TijaratkBot** and **ArabyBot**.

While both operate across Meta messaging channels, their underlying architectures and strategic goals serve completely different business objectives:
- **ArabyBot** is built as an official Meta Business Partner specializing in omnichannel broadcast marketing, OTP verification, and multi-region chatbot flows.
- **TijaratkBot** is built from the ground up as an **autonomous AI sales closer**, fine-tuned for Egyptian colloquial Arabic, zero-friction in-chat cart checkout, and automated address extraction for Cash on Delivery (COD).

Here is an objective breakdown of how the two platforms compare.

---

## 1. Core Architecture & Philosophy

### ArabyBot: Enterprise Broadcast & Marketing Automation
ArabyBot is an official Meta Partner platform geared towards communication management:
- **Bulk WhatsApp Broadcasts:** Sending promotional campaigns to hundreds of thousands of contacts via WhatsApp Cloud API.
- **OTP Verification:** Delivering transactional authentication codes for web platforms and mobile applications.
- **Comment-to-DM Marketing:** Converting public social comments into Messenger and Instagram DMs automatically.

### TijaratkBot: The Autonomous AI Sales Closer
TijaratkBot focuses squarely on one operational metric: **converting conversational inquiries into completed, fulfilled orders**.
Rather than just broadcasting messages, TijaratkBot:
- Employs a specialized Egyptian Arabic LLM engine that parses colloquial nuances and Franco-Arabic.
- Delivers an interactive in-chat cart, keeping customers inside their native messaging app.
- Automatically extracts complex Egyptian delivery addresses and validates 11-digit mobile numbers in under a second.
- Integrates seamlessly with shipping sheets and logistics dispatch.

---

## 2. Feature Comparison Matrix

| Feature | TijaratkBot | ArabyBot |
| :--- | :--- | :--- |
| **Primary Goal** | Autonomous order closing & conversion | Marketing automation & bulk messaging |
| **Egyptian Colloquial NLP** | Native dialect & Franco engine | Regional Arabic & custom AI prompts |
| **In-Chat Cart & Checkout** | Full native interactive cart in chat | Catalog menus & web link redirection |
| **Egyptian Address Extraction** | Instant multi-field extraction from raw text | Multi-turn structured question flows |
| **COD Verification** | Automated delivery confirmation flow | Available via custom workflow setups |
| **Mass WhatsApp Broadcasts** | Targeted conversational follow-ups | High-volume scheduled broadcast engine |
| **Meta Official Partner** | Meta Cloud API standards compliant | Official Meta Business Partner |
| **Pricing Structure** | Flat merchant-friendly tiers in EGP | Enterprise & message-usage pricing |

---

## 3. Which Platform Should You Choose?

- **Choose ArabyBot** if your priority is sending high-volume marketing broadcasts, integrating WhatsApp OTP verification, or managing corporate campaigns across multiple MENA markets.
- **Choose TijaratkBot** if your main objective is closing orders faster, eliminating manual order entry from DMs, understanding Egyptian slang, and maximizing Cash on Delivery fulfillment without bloated team overhead.
`,
    },
  },
  {
    slug: "tijaratkbot-vs-botorders",
    title: {
      ar: "مقارنة تفصيلية: تِجارتك بوت في مواجهة بوت أوردرز (BotOrders) — سحر استخراج العناوين بالذكاء الاصطناعي مقابل استمارات الخرائط",
      en: "Detailed Comparison: TijaratkBot vs BotOrders — Conversational AI Address Parsing vs Map-Based Webviews",
    },
    metaDescription: {
      ar: "مقارنة دقيقة بين تِجارتك بوت وبوت أوردرز (BotOrders). كيف تمنع هروب الزبائن أثناء تحديد العنوان؟ ولماذا يتفوق الاستخراج التلقائي للنصوص على فتح ويب فيو الخريطة؟",
      en: "Direct comparison between TijaratkBot and BotOrders. Discover why natural language address parsing converts higher than external map webviews in Egyptian social commerce.",
    },
    excerpt: {
      ar: "كلا الحلين مصريان ويهدفان لأتمتة مبيعات السوشيال ميديا، ولكن الفارق في تجربة الزبون جوهري: هل يجبر العميل على فتح خريطة لتحديد موقعه أم يفهم عنوانه المكتوب عفوياً؟",
      en: "While both platforms automate chat sales for Egyptian merchants, their address collection and AI philosophies differ radically. Here is the full breakdown.",
    },
    category: { ar: "مقارنات وتحليلات السوق", en: "Market Comparisons" },
    readTime: { ar: "7 دقائق قراءة", en: "7 min read" },
    publishedAt: "2026-09-06",
    author: {
      name: { ar: "فريق تِجارتك بوت", en: "TijaratkBot Team" },
      role: { ar: "فريق أبحاث وتطوير التجارة عبر المحادثات", en: "Conversational Commerce R&D Team" },
      avatar: "/icon1.png",
    },
    markdownContent: {
      ar: `# مقارنة تفصيلية: تِجارتك بوت في مواجهة بوت أوردرز (BotOrders)
### سحر استخراج العناوين بالذكاء الاصطناعي مقابل استمارات ويب فيو الخرائط

في مشهد التجارة الإلكترونية وسوشيال كوميرس (Social Commerce) داخل مصر، تبرز منصتان محليتان تستهدفان نفس التحدي: تحويل صفحات فيسبوك، حسابات إنستجرام، وواتساب إلى قنوات بيع آلية.

هاتان المنصتان هما **تِجارتك بوت (TijaratkBot)** و **بوت أوردرز (BotOrders)** (التابعة لشركة ويب آند آرت في المعادي).

وعلى الرغم من أن المنصتين تقدمان ميزات تجارة الدردشة وعرض الكتالوجات داخل المحادثة، إلا أن هناك **فروقاً جوهرية في تجربة المستخدم وطريقة معالجة البيانات تؤثر مباشرة على نسبة إتمام الأوردرات (Conversion Rate)**.

في هذا الدليل، نلقي نظرة متعمقة على الفروق التشغيلية والتقنية بين المنصتين.

---

## 1. معضلة العنوان في مصر: استخراج النصوص بالذكاء الاصطناعي مقابل خريطة Webview

تعتبر خطوة "جمع عنوان التوصيل" هي المرحلة الأكثر حساسية في تجارة الأونلاين؛ ففيها تحدث أعلى نسبة إلغاء للأوردرات (Drop-off Rate).

### كيف يجمع بوت أوردرز (BotOrders) العنوان؟
يعتمد بوت أوردرز على إرسال رابط أو **نافذة داخلية (Webview) تحتوي على خريطة تفاعلية**، ويطلب من العميل الضغط على الرابط وفتح الخريطة وتحديد موقعه الجغرافي بالـ GPS.

**ما هي المشاكل الواقعية لهذه الطريقة مع الزبون المصري؟**
1. **بطء التحميل:** فتح متصفح داخلي لتحميل خريطة تفاعلية يستهلك باقة الموبايل إنترنت ويستغرق من 5 إلى 12 ثانية.
2. **صلاحيات الموقع (GPS Permissions):** يتردد كثير من العملاء في منح صلاحيات الموقع لتطبيقات السوشيال ميديا لأسباب تتعلق بالخصوصية أو سهو الإعدادات.
3. **عدم دقة الخرائط الداخلية:** في كثير من المدن والقرى المصرية، لا توضح الخرائط أرقام العمارات أو أسماء الحارات والعلامات المميزة الحقيقية.
4. **نسبة الهروب:** تشير الإحصاءات إلى أن طلب فتح رابط خارجي أو خريطة يتسبب في فقدان ما بين 30% إلى 45% من المشترين في هذه الخطوة وحدها!

### كيف يحل تِجارتك بوت (TijaratkBot) هذه المعضلة؟
في تِجارتك بوت، **لا يغادر العميل شاشة الدردشة إطلاقاً ولا يفتح أي روابط خارجية**.
العميل يكتب عنوانه كما اعتاد تماماً بالعامية في رسالة عادية:
> *"ابعتلي على طنطا شارع البحر عمارة التأمين الدور الرابع شقة 8، ورقمي 011xxxxxxxx"*

محرك الذكاء الاصطناعي الخاص بتِجارتك بوت يقوم بما يلي في أقل من نصف ثانية:
- استخراج **المحافظة** (الغربية) و **المدينة** (طنطا).
- استخراج **اسم الشارع ورقم العمارة والشقة والعلامة المميزة**.
- التحقق الرياضي من **صحة رقم الموبايل المصري** المكون من 11 رقماً وتنبيه العميل إذا كان ناقصاً.
- اعتماد الأوردر فورياً دون أي احتكاك تقني.

---

## 2. الذكاء الاصطناعي وفهم الأسئلة الاعتراضية مقابل القوائم الجامدة

- **في بوت أوردرز:** يعتمد النظام بشكل أساسي على تدفقات الأزرار وسير العمل المبرمج مسبقاً (Structured Flow). إذا سأل العميل سؤالاً غير مدرج بالقائمة مثل: *"هو المقاس الأوفر سايز بيبقى واسع أوي من الكتف؟"* أو *"ينفع المندوب يجي بعد الساعة 5 عشان بكون في الشغل؟"*، قد يعجز النظام عن تقديم إجابة سياقية ويضطر العميل للانتظار.
- **في تِجارتك بوت:** يعمل روبوت المحادثة بنموذج لغوي حديث مدرب على قواعد التجارة وسلوك المستهلك المصري. يستطيع البوت الإجابة على استفسارات الخامات، سياسة الاستبدال والاسترجاع، ومواعيد التوصيل، ثم يعيد توجيه العميل بذكاء لإتمام سلة المشتريات.

---

## 3. بوابات الدفع والتكاملات اللوجستية

| المجال | تِجارتك بوت (TijaratkBot) | بوت أوردرز (BotOrders) |
| :--- | :--- | :--- |
| **طرق الدفع المدعومة** | تركيز فائق على الدفع عند الاستلام (COD) + فودافون كاش وإنستاباي | تكاملات مع Paymob و Fawry للدفع الإلكتروني بالبطاقات |
| **تأكيد شحنات COD** | رسائل تأكيد آلية وتأكيد الجدية لخفض نسبة المرتجع | نظام فواتير وسداد مسبق |
| **التكاملات اللوجستية** | ربط فوري مع Google Sheets وشركات الشحن الرائدة والـ Webhooks | ربط مدمج مع شركة بوسطة (Bosta) |
| **شروط الاشتراك** | متاح فوراً لجميع البراندات والتجار وتجار السوشيال ميديا | يشترط وجود كيان تجاري وسجل قانوني معتمد |

بوت أوردرز يتميز بتكاملات جيدة مع بوابات الدفع الرسمية مثل Paymob ومزود الشحن Bosta، وهو خيار مناسب للشركات المسجلة قانونياً التي تعتمد بشكل كبير على الدفع الإلكتروني المسبق.

في المقابل، يتفوق تِجارتك بوت في تلبية طبيعة السوق الحقيقية في مصر حيث تمثل طلبات **الدفع عند الاستلام (COD)** أكثر من 75% من إجمالي المعاملات، مع توفير آليات تأكيد ذكية ترفع معدل استلام الشحنات إلى أكثر من 90%.

---

## 4. جدول المقارنة المباشرة

| المعيار | تِجارتك بوت | بوت أوردرز (BotOrders) |
| :--- | :--- | :--- |
| **طريقة جمع العنوان** | ذكاء اصطناعي يفهم النص العفوي بدون روابط | خريطة ويب فيو تفاعلية تتطلب GPS |
| **احتكاك تجربة المستخدم (Friction)** | منعدم — كل العمليات داخل الشات | متوسط — يتطلب فتح نوافذ خارجية للعنوان |
| **فهم اللهجة المصرية** | محرك متقدم يستوعب العامية والفرانكو | تدفقات محددة بأزرار واختيارات |
| **سهولة الإطلاق** | في دقائق معدودة وبدون تعقيدات ورقية | تتطلب إجراءات تسجيل تجارية رسمية |
| **تجربة الدفع عند الاستلام** | محسنة لتقليل المرتجعات وتأكيد موعد التسليم | متاحة مع تركيز إضافي على الدفع الرقمي |

---

## متى تختار بوت أوردرز (BotOrders)؟
- إذا كنت شركة مسجلة رسمياً بسجل تجاري وبطاقة ضريبية وتبحث عن تكاملات مصرفية مع Paymob و Fawry.
- إذا كان لديك ربط مباشر مع شركة بوسطة وتريد الاعتماد الكامل على الخرائط التفاعلية الجغرافية.

## متى تختار تِجارتك بوت (TijaratkBot)؟
- إذا كنت تريد **أعلى معدل تحويل مبيعات** وتجنب هروب الزبائن بسبب تعقيدات الخرائط واستمارات الويب.
- إذا كنت ترغب في بائع ذكي يفهم الرسائل النصية العامية والفرانكو بمرونة تامة.
- إذا كنت تريد منصة فورية الإطلاق تخدم المتاجر سريعة النمو بدون عوائق بيروقراطية.

---

## الخلاصة

الزبون المصري يبحث دائماً عن الأسهل والأسرع. إجبار المشتري على فتح رابط خارجي وتحديد موقعه على خريطة غالباً ما يؤدي إلى تراجعه وتأجيل الشراء.

مع **تِجارتك بوت**، تتم كل خطوة — من السؤال عن المقاس وحتى تأكيد العنوان ورقم الهاتف — داخل المحادثة نفسها وبسلاسة مطلقة.

**ابدأ الآن مجاناً** وشاهد كيف يضاعف الذكاء الاصطناعي معدل إغلاق مبيعات متجرك!
`,
      en: `# Detailed Comparison: TijaratkBot vs BotOrders
### Conversational AI Address Parsing vs Map-Based Webviews in Egypt

In the Egyptian social commerce sphere, **TijaratkBot** and **BotOrders** (developed by Web and Art in Cairo) represent two home-grown platforms designed to automate chat sales on Facebook, Instagram, and WhatsApp.

However, each platform adopts a profoundly different philosophy regarding **user friction, address collection, and conversational depth**.

---

## 1. The Delivery Address Dilemma: Natural Language vs Map Webviews

Order dropout spikes at the address collection phase in Egyptian e-commerce:

- **BotOrders' Approach:** Sends a webview link loading an interactive map where buyers must enable GPS permissions and pinpoint their location manually.
  - *Friction Points:* Slower loading on cellular networks (5-12 seconds), reluctance to grant location permissions, and high buyer dropout (up to 40%).
- **TijaratkBot's Approach:** Zero external links. The customer texts their address naturally in one sentence (governorate, neighborhood, landmarks). TijaratkBot's dedicated NLP engine parses the address components, verifies the 11-digit mobile number, and confirms the order in 500ms inside the chat.

---

## 2. Conversational Flexibility & Dialect Fluency

- **BotOrders:** Relies primarily on structured button-driven menus and catalog navigation. Unscripted questions (sizing nuances, fabric inquiries) typically require human escalation.
- **TijaratkBot:** Powered by an advanced conversational LLM trained on Egyptian commerce discourse. It negotiates sizes, answers FAQ objections, and cross-sells related items autonomously.

---

## 3. Comparison Summary

| Capability | TijaratkBot | BotOrders |
| :--- | :--- | :--- |
| **Address Collection** | AI text extraction (zero links) | Interactive map webview via GPS |
| **Checkout Friction** | 100% inside conversational chat | Requires opening external map views |
| **Egyptian Arabic NLP** | Fluid colloquial & Franco-Arabic | Pre-configured menu paths |
| **Target Audience** | Fast-scaling D2C brands & social sellers | Registered commercial business entities |
| **Payment Gateways** | COD confirmation focus + InstaPay | Paymob & Fawry payment gateways |
| **Logistics Integration** | Google Sheets, Webhooks & major couriers | Native Bosta courier integration |

---

## The Verdict

If you are an established legal corporate entity requiring prepaid Paymob/Fawry checkout and insist on GPS-based map pinning, **BotOrders** offers structured integration.

If your core metric is **conversion rate, lower friction, and native Egyptian dialect sales closing without drop-off**, **TijaratkBot** provides the superior conversational customer experience.
`,
    },
  },
  {
    slug: "tijaratkbot-vs-bosla",
    title: {
      ar: "مقارنة موضوعية: تِجارتك بوت في مواجهة بوصلة (Bosla) — بائع آلي متخصص أم منصة CRM متعددة المقاعد؟",
      en: "Objective Comparison: TijaratkBot vs Bosla CRM — Dedicated Autonomous Sales Closer vs Multi-Seat Team CRM",
    },
    metaDescription: {
      ar: "تحليل شامل للفروق بين تِجارتك بوت وبوصلة (Bosla). أيهما أنسب لطبيعة عملك: منصة تذاكر وخدمة عملاء بمقاعد مدفوعة، أم روبوت ذكاء اصطناعي يقفل المبيعات فورياً بدون فريق؟",
      en: "Detailed comparison between TijaratkBot and Bosla CRM. Compare total cost of ownership, omnichannel team inboxes vs autonomous AI order-taking in Egypt.",
    },
    excerpt: {
      ar: "هل تحتاج إلى صندوق وارد موحد لإدارة 10 موظفين خدمة عملاء، أم تريد وكيلاً ذكياً يتولى البيع وتأكيد الدفع عند الاستلام بدون تدخل بشري وبتكلفة اقتصادية؟ اكتشف المقارنة الكاملة.",
      en: "Do you need an omnichannel ticketing CRM for a support team or an autonomous conversational closer that captures every order 24/7? Compare TijaratkBot vs Bosla.",
    },
    category: { ar: "مقارنات وتحليلات السوق", en: "Market Comparisons" },
    readTime: { ar: "8 دقائق قراءة", en: "8 min read" },
    publishedAt: "2026-09-06",
    author: {
      name: { ar: "فريق تِجارتك بوت", en: "TijaratkBot Team" },
      role: { ar: "فريق أبحاث وتطوير التجارة عبر المحادثات", en: "Conversational Commerce R&D Team" },
      avatar: "/icon1.png",
    },
    markdownContent: {
      ar: `# مقارنة موضوعية: تِجارتك بوت في مواجهة بوصلة (Bosla)
### بائع ذكاء اصطناعي متخصص في زيادة المبيعات أم منصة CRM وإدارة خدمة العملاء؟

مع نمو مبيعات التجارة الإلكترونية في مصر والشرق الأوسط، يجد التاجر نفسه أمام خيارين استراتيجيين لإدارة المحادثات اليومية:

1. **الخيار الأول:** بناء فريق خدمة عملاء ومودريتورز واستخدام منصة **CRM موحدة** لتوزيع المحادثات وتذاكر الدعم عبر الشاشات المختلفة.
2. **الخيار الثاني:** الاعتماد على **وكيل ذكاء اصطناعي مستقل (Autonomous Sales Agent)** يتولى عملية البيع وإتمام الأوردرات آلياً من الألف إلى الياء، دون الحاجة لتحمل أعباء ورواتب فريق عمل ضخم.

منصة **بوصلة (Bosla)** تمثل الخيار الأول بجدارة في فئة الـ Omnichannel CRM، بينما تمثل **تِجارتك بوت (TijaratkBot)** الخيار الثاني كبائع ذكي عالي الكفاءة يركز على إغلاق الصفقات وتحقيق العائد اللحظي.

في هذا الدليل، نوضح الفروق الجوهرية في التكلفة، وطريقة التشغيل، والهدف الاستثماري لمساعدتك في اتخاذ القرار الصحيح.

---

## 1. الفلسفة التشغيلية: إدارة التذاكر أم إغلاق المبيعات التلقائي؟

### بوصلة (Bosla CRM): نظام تشغيل كامل لفريق الدعم
بوصلة مصممة في الأساس كـ **منصة CRM متعددة القنوات** للمتاجر التي تقوم بآلاف الطلبات وتمتلك بالفعل فريقاً من الموظفين:
- **صندوق وارد موحد (Unified Inbox):** يجمع رسائل واتساب، إنستجرام، ماسنجر، وتيليجرام في شاشة واحدة.
- **مقاعد الفريق والصلاحيات (Team Seats):** تعيين المحادثات للموظفين، وتحديد أدوار المشرفين والإداريين.
- **الربط مع المنصات الجاهزة:** تكامل مدمج مع متاجر شوبيفاي (Shopify)، سلة (Salla)، وإيزي أوردرز (EasyOrders).
- **وكيل ذكاء اصطناعي للمساعدة:** يساعد الموظفين في الردود وتأكيد الطلبات.

### تِجارتك بوت (TijaratkBot): بائع مستقل بدون تعقيدات إدارية
تِجارتك بوت صُمم كـ **محرك بيع مستقل (Turnkey AI Sales Agent)** لا يتطلب وجود فريق مودريتورز يدير الشاشات:
- يتلقى رسائل العميل على إنستجرام أو فيسبوك أو واتساب.
- يعرض المنتجات المتوفرة بمقاساتها وألوانها الحية.
- يقفل الأوردر، ويستخرج العنوان المصري بالكامل، ويؤكد الهاتف، ويرسل البيانات لشيت الأوردرات فوراً.
- يتيح لك تحقيق مبيعات قياسية وأنت نائم أو أثناء تركيزك على تصنيع المنتجات وتطوير الإعلانات، دون تكلفة رواتب أو اشتراكات مقاعد الموظفين.

---

## 2. مقارنة التكلفة الإجمالية للملكية (Total Cost of Ownership)

تعتبر التكلفة الشهرية عاملاً حاسماً للمتاجر التي تحرص على حماية هوامش أرباحها:

### تسعير بوصلة (Bosla):
تبدأ أسعار بوصلة من:
- باقة Starter: بـ **1,500 جنيه مصري شهرياً**.
- باقة Growth: بـ **5,400 جنيه مصري شهرياً**.
- باقة Scale: بـ **9,900 جنيه مصري شهرياً**.
*(تعتمد التكلفة على عدد العملاء النشطين شهرياً وحجم المقاعد المطلوبة).*

### تسعير تِجارتك بوت (TijaratkBot):
يقدم تِجارتك بوت نموذج تسعير فائق الاقتصادية يناسب المتاجر الناشئة والكبيرة على حد سواء:
- وصول مدى الحياة: بـ **3,990 جنيه مصري تُدفع مرة واحدة فقط**.

هذا يعني أنه يمكنك تشغيل تِجارتك بوت لعدة أشهر بتكلفة اشتراك شهر واحد فقط في منصات الـ CRM المعقدة، مما يوفر لمتجرك سيولة نقدية مباشرة لإعادة استثمارها في إعلاناتك الممولة!

---

## 3. البنية التحتية للمتجر وسهولة الربط

- **في بوصلة:** تظهر القوة القصوى للمنصة إذا كان لديك بالفعل متجر إلكتروني مبني على Shopify أو Salla ومربوط بمستودعات شحن مثل Bosta أو ShipBlu. إذا لم تكن تمتلك هذه البنية، فلن تستفيد من كامل إمكانيات النظام.
- **في تِجارتك بوت:** لا يشترط وجود متجر إلكتروني خارجي إطلاقاً! يمكنك البدء بالبيع مباشرة من كتالوجك الخاص، مع تفريغ جميع البيانات في Google Sheets أو إرسالها عبر Webhook لنظامك الداخلي، مما يجعله الحل المثالي لبراندات السوشيال ميديا وD2C سريعة التطور.

---

## 4. جدول المقارنة الشامل

| وجه المقارنة | تِجارتك بوت (TijaratkBot) | بوصلة (Bosla CRM) |
| :--- | :--- | :--- |
| **طبيعة النظام** | وكيل ذكاء اصطناعي مستقل لإغلاق المبيعات | منصة CRM متكاملة وصندوق وارد موحد للفرق |
| **الحاجة لفريق بشري** | يعمل آلياً بالكامل 24/7 دون الحاجة لمودريتورز | مصمم لإدارة فرق خدمة العملاء وتوزيع التذاكر |
| **نظام التسعير** | **3,990 ج.م** تدفع مرة واحدة مدى الحياة | يبدأ من **1,500 ج.م** وحتى **9,900 ج.م** شهرياً |
| **الاعتماد على منصات المتجر** | يعمل بشكل مستقل تماماً أو عبر Webhook | يتطلب أو يفضل الارتباط بـ Shopify / Salla |
| **استخراج العناوين المصرية** | محرك NLP مخصص للمحافظات والمناطق وأرقام الموبايل | متصل بتطبيقات التجارة وعناوين الشحن |
| **تأكيد الدفع عند الاستلام (COD)** | تأكيد لحظي للطلبات ورفع نسبة التسليم | مدمج مع متتبعات الشحن (Bosta / ShipBlu) |
| **قنوات المحادثة** | ماسنجر، إنستجرام، وواتساب | واتساب، إنستجرام، ماسنجر، وتيليجرام |

---

## متى تختار منصة بوصلة (Bosla)؟
- إذا كان لديك **فريق خدمة عملاء ومودريتورز مكوّن من 5 إلى 20 موظفاً** وتريد منصة موحدة لإدارتهم وتوزيع المحادثات بينهم.
- إذا كان متجرك يعمل بالفعل على **Shopify أو Salla** ولديك مئات التذاكر اليومية المتعلقة بخدمات ما بعد البيع.
- إذا كانت ميزانيتك الشهرية تسمح باشتراكات تبدأ من 1,500 إلى 9,900 جنيه للمنصة وحدها بخلاف تكاليف التشغيل.

## متى تختار تِجارتك بوت (TijaratkBot)؟
- إذا كنت تريد **أتمتة مبيعاتك بالكامل** دون الحاجة لتحمل رواتب شهرية لفرق المودريتورز أو إدارة الشفتات.
- إذا كنت تبحث عن **أعلى عائد استثماري (ROI)** بدون اشتراكات متكررة (دفع لمرة واحدة مدى الحياة).
- إذا كنت تبيع عبر السوشيال ميديا وتريد بائعاً يتقن العامية المصرية، يفرغ العناوين تلقائياً، ويغلق الأوردرات فورياً بدون تعقيدات برمجية.

---

## الخلاصة

السؤال الحقيقي ليس أيهما أفضل، بل **ما الذي يحتاجه متجرك اليوم؟**
- إذا كنت بحاجة إلى "مكتب خدمة عملاء متعدد الموظفين"، فإن **بوصلة** خيار مؤسسي قوي.
- أما إذا كنت تريد "بائع مبيعات محترف يعمل 24 ساعة لزيادة أرباحك وتخفيض تكاليفك"، فإن **تِجارتك بوت** هو شريكك الذكي الأنسب للمنافسة والربح في السوق المصري.

**ابدأ تجربتك المجانية مع تِجارتك بوت اليوم لأول 30 أوردر**، وشاهد أرباحك تنمو بدون مجهود إداري!
`,
      en: `# Objective Comparison: TijaratkBot vs Bosla CRM
### Dedicated AI Sales Closer vs Multi-Seat Omnichannel CRM in Egypt

Scaling an e-commerce brand in Egypt requires a strategic operational decision for handling daily message volume:

1. **Option A:** Implement an **Omnichannel Helpdesk CRM** to manage support agents, assign tickets, and centralize customer inquiries.
2. **Option B:** Deploy an **Autonomous AI Sales Agent** that manages customer conversations end-to-end, closes orders, extracts delivery addresses, and confirms Cash on Delivery (COD) without large team payrolls.

**Bosla** represents Option A as an omnichannel CRM platform, while **TijaratkBot** exemplifies Option B as a dedicated AI sales closer.

---

## 1. Core Operating Differences

### Bosla: Omnichannel Workspace for Support Teams
Bosla is engineered as a unified workspace for stores doing thousands of monthly orders with dedicated support staff:
- **Unified Inbox:** Centralizes WhatsApp, Instagram DMs, Messenger, and Telegram.
- **Team Seats & Permissions:** Assigns conversations to human agents with role controls.
- **E-Commerce Integrations:** Connects directly with Shopify, Salla, and EasyOrders.
- **Courier Tracking:** Integrates delivery updates with Bosta and ShipBlu.

### TijaratkBot: The Autonomous AI Closer
TijaratkBot is designed for lean, high-velocity merchants who want sales closed automatically:
- Interacts natively with customers in Egyptian Arabic and Franco-Arabic.
- Guides the buyer through catalog selection, sizing choices, and interactive cart checkout.
- Extracts unformatted Egyptian delivery addresses and validates mobile numbers instantly.
- Dispatches clean structured orders to Google Sheets and external systems 24/7 without manual moderator shifts.

---

## 2. Pricing & Cost Comparison

- **Bosla CRM:** Tiered pricing in EGP:
  - Starter: **1,500 EGP / month**
  - Growth: **5,400 EGP / month**
  - Scale: **9,900 EGP / month**
- **TijaratkBot:** Streamlined, highly accessible pricing for growing brands:
  - Lifetime Access: **3,990 EGP one-time payment**

---

## 3. Comparison Matrix

| Criteria | TijaratkBot | Bosla CRM |
| :--- | :--- | :--- |
| **Primary Function** | Autonomous AI sales closer | Omnichannel team ticketing CRM |
| **Human Team Requirement** | Fully autonomous 24/7 sales | Built for agent teams & workspace seats |
| **Starting Price** | **3,990 EGP (One-time)** | **1,500 EGP / mo** |
| **Store Dependency** | Standalone or Webhook / Sheets | Connects with Shopify, Salla, EasyOrders |
| **Egyptian Address Extraction** | Specialized NLP engine for messy text | Uses synced store checkout data |
| **Channels** | Messenger, Instagram, WhatsApp | WhatsApp, Instagram, Messenger, Telegram |

---

## The Verdict

- **Choose Bosla** if you operate an existing multi-seat customer support team, run your store on Shopify or Salla, and need an omnichannel ticketing helpdesk.
- **Choose TijaratkBot** if you want to eliminate moderator costs, capture orders directly inside chat with native Egyptian Arabic AI, and maximize ROI at a fraction of enterprise CRM pricing.
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
      name: { ar: "فريق تِجارتك بوت", en: "TijaratkBot Team" },
      role: { ar: "فريق أبحاث وتطوير التجارة عبر المحادثات", en: "Conversational Commerce R&D Team" },
      avatar: "/icon1.png",
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
