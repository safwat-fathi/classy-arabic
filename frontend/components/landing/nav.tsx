import Link from "next/link";
import { BrandMark } from "@/app/logo";
import * as m from "@/paraglide/messages";
import { LanguageSwitcher } from "./language-switcher";

export function Nav() {
  return (
    <>
      <div className="bg-emerald-700 text-white px-4 py-2.5 text-center text-[13.5px] font-bold">
        {m.nav_banner_text()}
        <Link href="/signup" className="underline hover:text-emerald-200 ms-1">
          {m.nav_banner_cta()}
        </Link>
      </div>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              {m.nav_link_how()}
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              {m.nav_link_features()}
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              {m.nav_link_pricing()}
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700"
            >
              {m.nav_link_faq()}
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/demo"
              className="inline-flex min-h-10 items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              {m.nav_cta()}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
