import Link from "next/link";
import Script from "next/script";
import { Nav } from "@/components/landing/nav";
import { FinalCTA } from "@/components/landing/final-cta";
import { BLOG_POSTS } from "@/lib/content/blog-content";

export const metadata = {
  title: "مدونة تِجارتك بوت | استراتيجيات ومقارنات التجارة عبر السوشيال ميديا",
  description:
    "مقالات وأدلة عملية لأصحاب المتاجر الإلكترونية في مصر. مقارنات حصرية مع أدوات الشات العالمية، وأسرار تحويل محادثات إنستجرام وفيسبوك وواتساب إلى مبيعات مؤكدة.",
  alternates: {
    canonical: "https://tijaratk.com/blog",
    types: {
      "text/markdown": "https://tijaratk.com/blog.md",
    },
  },
};

export default function BlogIndexPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "مدونة تِجارتك بوت",
      description:
        "مقالات وأدلة عملية لأصحاب المتاجر الإلكترونية في مصر حول أتمتة مبيعات السوشيال ميديا ومضاعفة أرباح الشات.",
      url: "https://tijaratk.com/blog",
      blogPost: BLOG_POSTS.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title.ar,
        description: post.excerpt.ar,
        datePublished: post.publishedAt,
        url: `https://tijaratk.com/blog/${post.slug}`,
        author: {
          "@type": "Person",
          name: post.author.name.ar,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "الرئيسية",
          item: "https://tijaratk.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "المدونة",
          item: "https://tijaratk.com/blog",
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafbfc] text-gray-900 selection:bg-emerald-500 selection:text-white">
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/70 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            أدلة ومقارنات نمو المبيعات
          </span>
          <h1 className="font-display mt-4 mb-4 text-3xl font-black text-gray-950 sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            مدونة تِجارتك بوت.. <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              أسرار وتكتيكات التجارة عبر المحادثات في مصر
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-gray-600 sm:text-[18px]">
            تحليلات واقعية ودراسات سوق مبنية على سلوك المستهلك المصري، لمساعدتك على
            زيادة معدلات التحويل وتقليل المرتجعات وأتمتة مبيعاتك بالكامل.
          </p>

          {/* AI crawler note */}
          <div className="mt-6 text-xs text-gray-400">
            متاح كنسخة ماركداون لوكلاء الذكاء الاصطناعي على:{" "}
            <a href="/blog.md" className="underline hover:text-emerald-600">
              /blog.md
            </a>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between text-xs font-bold">
                    <span className="rounded-md bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200">
                      {post.category.ar}
                    </span>
                    <span className="text-gray-400">{post.readTime.ar}</span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-black text-gray-950 leading-snug group-hover:text-emerald-700 transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title.ar}</Link>
                  </h2>

                  <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                    {post.excerpt.ar}
                  </p>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name.ar}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <p className="text-xs font-black text-gray-900">
                          {post.author.name.ar}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {post.author.role.ar}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition-colors hover:bg-emerald-600 hover:text-white"
                    >
                      <span>اقرأ المقال</span>
                      <span className="text-sm">←</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}
