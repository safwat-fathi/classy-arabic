"use client";

import { usePathname, Link } from "@/lib/i18n";
import { languageTag } from "@/paraglide/runtime";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLang = languageTag();
  const targetLang = currentLang === "en" ? "ar" : "en";
  const label = currentLang === "en" ? "العربية" : "English";

  return (
    <Link
      href={pathname}
      locale={targetLang}
      className="text-sm font-extrabold text-gray-700 transition-colors hover:text-emerald-700"
    >
      {label}
    </Link>
  );
}
