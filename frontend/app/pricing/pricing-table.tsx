"use client";

import { useState } from "react";
import Link from "next/link";
import { PRICING_TIERS } from "@/lib/content/pricing-content";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function PricingTable() {
  const [isUsd, setIsUsd] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const calculatePrice = (base: number, ai: number) => {
    const totalEgp = base + (aiEnabled ? ai : 0);
    const totalUsd = (base === 3990 ? 99 : 0) + (aiEnabled ? 29 : 0);
    return isUsd ? totalUsd : totalEgp;
  };

  return (
    <div>
      {/* Toggles */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
        {/* Currency Toggle */}
        <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setIsUsd(false)}
            className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              !isUsd
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            بالجنيه المصري (EGP)
          </button>
          <button
            type="button"
            onClick={() => setIsUsd(true)}
            className={`relative flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              isUsd
                ? "bg-emerald-600 text-white shadow-md"
                : "text-gray-500 hover:text-emerald-700"
            }`}
          >
            بالدولار الأمريكي (USD)
          </button>
        </div>

        {/* AI Addon Switch */}
        <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setAiEnabled(false)}
            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              !aiEnabled
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            الوضع الأساسي
          </button>
          <button
            type="button"
            onClick={() => setAiEnabled(true)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              aiEnabled
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                : "text-gray-500 hover:text-purple-700"
            }`}
          >
            <span>✨</span>
            مع محرك الـ AI العامي
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="flex justify-center max-w-lg mx-auto w-full">
        {PRICING_TIERS.map((tier) => {
          const isHighlight = tier.highlighted;
          const price = calculatePrice(tier.basePrice, tier.aiAddonPrice);

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all duration-300 ${
                isHighlight
                  ? "border-2 border-emerald-500 bg-[#0a0f0d] text-white shadow-2xl scale-[1.02] lg:-translate-y-2"
                  : "border border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md"
              }`}
            >
              {isHighlight && (
                <div className="absolute -top-4 start-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-1 text-xs font-black text-gray-950 shadow-md">
                  {tier.badge?.ar || "الأكثر طلباً للتجار"}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2
                    className={`text-xl font-black ${
                      isHighlight ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {tier.name.ar}
                  </h2>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      isHighlight
                        ? "bg-white/10 text-emerald-300"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {tier.ordersLimit.ar}
                  </span>
                </div>

                <p
                  className={`mt-2 mb-6 text-[13.5px] leading-relaxed ${
                    isHighlight ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {tier.description.ar}
                </p>

                {/* Price Tag */}
                <div className="mb-6 flex items-baseline gap-2">
                  <span
                    className={`font-display text-4xl sm:text-5xl font-black tracking-tight ${
                      isHighlight ? "text-white" : "text-gray-950"
                    }`}
                  >
                    {price}
                  </span>
                  <div className="flex flex-col text-xs font-semibold">
                    <span className={isHighlight ? "text-gray-200" : "text-gray-700"}>
                      {isUsd ? "دولار أمريكي (USD)" : "جنيه مصري (EGP)"}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold mt-1">
                      تدفع مرة واحدة مدى الحياة
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href={tier.ctaHref}
                  className={`flex min-h-12 w-full items-center justify-center rounded-xl text-sm font-black transition-all ${
                    isHighlight
                      ? "bg-emerald-500 text-gray-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "border border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tier.ctaText.ar}
                </Link>

                {/* Features List */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <p
                    className={`mb-4 text-xs font-black uppercase tracking-wider ${
                      isHighlight ? "text-gray-400" : "text-gray-400"
                    }`}
                  >
                    المميزات المتضمنة:
                  </p>
                  <ul className="flex flex-col gap-3">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckIcon
                          className={`mt-0.5 ${
                            isHighlight ? "text-emerald-400" : "text-emerald-600"
                          }`}
                        />
                        <span
                          className={`text-[13.5px] leading-snug ${
                            isHighlight ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {feat.ar}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                className={`mt-8 pt-4 border-t text-[12px] font-semibold ${
                  isHighlight
                    ? "border-white/10 text-gray-400"
                    : "border-gray-100 text-gray-500"
                }`}
              >
                القنوات: {tier.channels.ar}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
