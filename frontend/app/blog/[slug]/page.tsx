import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Nav } from "@/components/landing/nav";
import { FinalCTA } from "@/components/landing/final-cta";
import { BLOG_POSTS } from "@/lib/content/blog-content";

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title.ar} | مدونة تِجارتك بوت`,
    description: post.metaDescription.ar,
    alternates: {
      canonical: `https://tijaratk.com/blog/${slug}`,
      types: {
        "text/markdown": `https://tijaratk.com/blog/${slug}.md`,
      },
    },
    openGraph: {
      title: post.title.ar,
      description: post.metaDescription.ar,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name.ar],
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title.ar,
      description: post.metaDescription.ar,
      datePublished: post.publishedAt,
      mainEntityOfPage: `https://tijaratk.com/blog/${slug}`,
      author: {
        "@type": "Person",
        name: post.author.name.ar,
        jobTitle: post.author.role.ar,
      },
      publisher: {
        "@type": "Organization",
        name: "تِجارتك بوت (TijaratkBot)",
        url: "https://tijaratk.com",
      },
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
        {
          "@type": "ListItem",
          position: 3,
          name: post.title.ar,
          item: `https://tijaratk.com/blog/${slug}`,
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#fafbfc] text-gray-900 selection:bg-emerald-500 selection:text-white">
        <Nav />

        {/* Article Header */}
        <article className="px-5 pt-12 pb-16 sm:px-8 sm:pt-20">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumbs & Category */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
              <Link href="/blog" className="text-emerald-700 hover:underline">
                المدونة
              </Link>
              <span>/</span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-200">
                {post.category.ar}
              </span>
              <span>•</span>
              <span>{post.readTime.ar}</span>
              <span>•</span>
              <time dateTime={post.publishedAt}>{post.publishedAt}</time>
            </div>

            {/* Headline */}
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-gray-950 leading-tight tracking-tight mb-6">
              {post.title.ar}
            </h1>

            {/* Author bar */}
            <div className="flex items-center justify-between border-y border-gray-200 py-4 mb-8">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name.ar}
                  className="h-12 w-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <p className="text-sm font-black text-gray-950">
                    {post.author.name.ar}
                  </p>
                  <p className="text-xs text-gray-500">{post.author.role.ar}</p>
                </div>
              </div>

              {/* Markdown crawler link */}
              <a
                href={`/blog/${post.slug}.md`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 hover:border-emerald-300"
              >
                <span>نسخة ماركداون للـ AI</span>
                <span className="font-mono text-[10px]">.md ↗</span>
              </a>
            </div>

            {/* Rendered Body */}
            <div className="article-content prose prose-lg prose-emerald max-w-none text-[15.5px] leading-loose text-gray-800">
              {renderMarkdownToReact(post.markdownContent.ar)}
            </div>

            {/* In-article CTA Box */}
            <div className="my-12 rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-[#0a0f0d] to-[#121c17] p-8 sm:p-10 text-white shadow-xl">
              <span className="rounded-md bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400 border border-emerald-500/30">
                حوّل شات صفحتك لماكينة مبيعات
              </span>
              <h3 className="font-display mt-3 text-2xl sm:text-3xl font-black text-white">
                ابدأ تجربة تِجارتك بوت مجانًا لأول 30 أوردر
              </h3>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed max-w-xl">
                بلاش تضيع مبيعاتك في الردود المتأخرة والقوالب الباردة. جرب محرك الذكاء
                الاصطناعي العامي والسلة التفاعلية بنفسك في أقل من 5 دقائق.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-gray-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
                >
                  جرب شات محاكاة تفاعلي
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all"
                >
                  عرض تفاصيل الباقات
                </Link>
              </div>
            </div>

            {/* Other Articles */}
            {otherPosts.length > 0 && (
              <div className="border-t border-gray-200 pt-10 mt-12">
                <h3 className="font-display text-xl font-black text-gray-950 mb-6">
                  مقالات أخرى قد تهمك:
                </h3>
                <div className="grid gap-4">
                  {otherPosts.map((op) => (
                    <Link
                      key={op.slug}
                      href={`/blog/${op.slug}`}
                      className="group rounded-2xl border border-gray-200 bg-white p-5 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col gap-1"
                    >
                      <span className="text-xs font-bold text-emerald-700">
                        {op.category.ar} • {op.readTime.ar}
                      </span>
                      <h4 className="font-bold text-base text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {op.title.ar}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {op.excerpt.ar}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <FinalCTA />
      </main>
    </>
  );
}

// Lightweight Markdown-to-React Parser for Blog Typography
function renderMarkdownToReact(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  const flushTable = () => {
    if (tableLines.length > 0) {
      elements.push(renderTable(tableLines, elements.length));
      tableLines = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      tableLines.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(
        <hr key={i} className="my-8 border-t border-gray-200" />
      );
      continue;
    }

    // Heading 1 (skip if already page title, or render small)
    if (line.startsWith("# ")) {
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="font-display mt-10 mb-4 text-2xl sm:text-3xl font-black text-gray-950 leading-snug"
        >
          {parseInlineText(line.replace("## ", ""))}
        </h2>
      );
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="font-display mt-6 mb-3 text-lg sm:text-xl font-bold text-gray-900 leading-snug"
        >
          {parseInlineText(line.replace("### ", ""))}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="my-4 border-s-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-e-xl text-emerald-950 font-medium italic"
        >
          {parseInlineText(line.replace("> ", ""))}
        </blockquote>
      );
      continue;
    }

    // Bullet point
    if (line.trim().startsWith("- ")) {
      elements.push(
        <li key={i} className="ms-5 my-1.5 list-disc text-gray-700">
          {parseInlineText(line.trim().replace("- ", ""))}
        </li>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="my-4 leading-loose text-gray-700">
        {parseInlineText(line)}
      </p>
    );
  }

  if (inTable) {
    flushTable();
  }

  return <>{elements}</>;
}

function renderTable(tableLines: string[], key: number) {
  const rows = tableLines.map((row) =>
    row
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
  );

  if (rows.length < 2) return null;

  const header = rows[0];
  const bodyRows = rows.slice(2); // row 1 is delimiter: | :--- | :--- |

  return (
    <div key={key} className="my-8 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-right border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {header.map((col, idx) => (
              <th key={idx} className="p-3.5 font-black text-gray-900">
                {parseInlineText(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-50/50">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-3.5 text-gray-700 leading-relaxed">
                  {parseInlineText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseInlineText(text: string): React.ReactNode {
  // Regex to split by bold **text** or *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-black text-gray-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="font-semibold text-emerald-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
