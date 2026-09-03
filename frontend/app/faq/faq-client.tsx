"use client";

import { useState, useMemo } from "react";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/content/faq-content";

export function FaqClient() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "need-website": true,
    "egyptian-dialect": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCat === "all" ||
        item.category.ar ===
          FAQ_CATEGORIES.find((c) => c.id === selectedCat)?.label.ar;

      const q = item.question.ar.toLowerCase();
      const a = item.answer.ar.toLowerCase();
      const s = searchQuery.toLowerCase().trim();
      const matchesSearch = !s || q.includes(s) || a.includes(s);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCat, searchQuery]);

  return (
    <>
      {/* Live Search Bar */}
      <div className="mx-auto mt-8 max-w-xl">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأسئلة (مثلاً: شحن، عامية، واتساب، تجربة مجانية)..."
            className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 pe-12 text-sm shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
          />
          <span className="absolute end-4 text-gray-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {FAQ_CATEGORIES.map((cat) => {
          const isSelected = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {cat.label.ar}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="mt-12">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-base font-bold text-gray-700">
              لم نجد إجابة تطابق كلمة البحث الحالية
            </p>
            <p className="mt-1 text-xs text-gray-400">
              جرب البحث بكلمة أخرى أو تصفح الأقسام من الأعلى
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCat("all");
              }}
              className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              عرض جميع الأسئلة
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id];
              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-right font-black text-gray-900 transition-colors hover:text-emerald-700"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {faq.category.ar}
                      </span>
                      <span className="text-base sm:text-lg leading-snug">
                        {faq.question.ar}
                      </span>
                    </div>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-transform ${
                        isOpen ? "rotate-180 bg-emerald-100 text-emerald-800" : ""
                      }`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 sm:px-6 pb-6 pt-4 text-[14.5px] leading-loose text-gray-600">
                      {faq.answer.ar}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
