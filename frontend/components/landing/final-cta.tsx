import Link from "next/link";
import { BrandMark } from "@/app/logo";
import * as m from "@/paraglide/messages";

export function FinalCTA() {
  return (
    <div className="bg-[#0a0f0d]">
      <section className="border-b border-white/10 px-5 py-16 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display mb-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">
            {m.cta_title()}
          </h2>
          <p className="mb-8 text-[16px] leading-loose text-gray-400">
            أول 30 أوردر علينا مجاناً بالكامل لتجربة النظام على أرض الواقع. بدون
            إدخال بطاقة ائتمانية.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-[15.5px] font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {m.cta_btn_main()}
            </Link>
            <a
              href="#example"
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-white/20 px-8 py-3.5 text-[15.5px] font-bold text-white transition-colors hover:bg-white/10"
            >
              {m.cta_btn_sec()}
            </a>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <Link
          href="/demo"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-[15px] font-bold text-white shadow-2xl transition-transform active:scale-95"
        >
          {m.cta_btn_mob()}
        </Link>
      </div>

      <footer className="px-5 pt-12 pb-24 md:pb-7 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
            <div>
              <div className="mb-3.5">
                <BrandMark tone="dark" />
              </div>
              <p className="mb-4.5 max-w-md text-[13px] leading-loose text-gray-400">
                منصة التجارة الذكية الأولى في مصر. حوّل شات السوشيال ميديا
                لمبيعات مؤكدة بدون تدخل بشري.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-extrabold text-gray-400">
                {m.footer_product()}
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/how-it-works"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  {m.nav_link_how()}
                </Link>
                <Link
                  href="/features"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  {m.nav_link_features()}
                </Link>
                <Link
                  href="/pricing"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  {m.nav_link_pricing()}
                </Link>
                <Link
                  href="/blog"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  {m.nav_link_blog()}
                </Link>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-extrabold text-gray-400">
                {m.footer_company()}
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/demo"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  {m.footer_contact()}
                </Link>
                <Link
                  href="/faq"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  {m.nav_link_faq()}
                </Link>
                <Link
                  href="/sitemap"
                  className="text-[13.5px] text-gray-300 hover:text-white"
                >
                  خريطة الموقع (Sitemap)
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center">
            <span className="text-[12.5px] text-gray-500">
              {m.footer_copyright()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
