"use client";

import { useState } from "react";
import Link from "next/link";
import * as m from "@/paraglide/messages";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function PricingSection() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  // Helper to calculate price with optional AI and optional 20% yearly discount
  const getPrice = (base: number, aiPrice: number) => {
    let total = base + (aiEnabled ? aiPrice : 0);
    if (isYearly) {
      total = Math.round(total * 0.8);
    }
    return total;
  };

  return (
    <section
      id="pricing"
      className="border-t border-gray-200 bg-gray-50 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 flex flex-col items-center text-center">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            {m.pricing_title()}
          </span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {m.pricing_headline()}
          </h2>
          <p className="mb-6 text-[15px] leading-loose text-gray-500">
            {m.pricing_desc()}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-lg px-5 py-2 text-[13px] font-bold transition-all ${
                  !isYearly
                    ? "bg-gray-100 text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {m.pricing_monthly()}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-lg px-5 py-2 text-[13px] font-bold transition-all ${
                  isYearly
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-emerald-700"
                }`}
              >
                {m.pricing_yearly()}
              </button>
            </div>

            {/* AI Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setAiEnabled(false)}
                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-all ${
                  !aiEnabled
                    ? "bg-gray-100 text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {m.pricing_basic_mode()}
              </button>
              <button
                onClick={() => setAiEnabled(true)}
                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                  aiEnabled
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-purple-700"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"/></svg>
                {m.pricing_ai_addon()}
              </button>
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {/* Starter Plan */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
              {m.pricing_starter_name()}
            </h3>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900 transition-all">
                {getPrice(499, 250)}
              </span>
              <span className="text-[13px] font-bold text-gray-500">
                {m.pricing_currency_month()}
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              {m.pricing_starter_cta()}
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                m.pricing_starter_f1(),
                m.pricing_starter_f2(),
                m.pricing_starter_f3(),
                m.pricing_starter_f4(),
                m.pricing_starter_f5(),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13px] leading-relaxed text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Plan */}
          <div className="relative flex flex-col rounded-2xl border border-emerald-700 bg-[#0a0f0d] p-6.5 shadow-2xl">
            <span className="absolute -top-3.5 start-6.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white">
              {m.pricing_growth_badge()}
            </span>
            <h3 className="mt-2 mb-1.5 text-base font-extrabold text-white">
              {m.pricing_growth_name()}
            </h3>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-white transition-all">
                {getPrice(749, 350)}
              </span>
              <span className="text-[13px] font-bold text-gray-400">
                {m.pricing_currency_month()}
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              {m.pricing_growth_cta()}
            </Link>
            <ul className="flex flex-col gap-3 border-t border-white/10 pt-5">
              {[
                m.pricing_growth_f1(),
                m.pricing_growth_f2(),
                m.pricing_growth_f3(),
                m.pricing_growth_f4(),
                m.pricing_growth_f5(),
                m.pricing_growth_f6(),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-400" />
                  <span className="text-[13px] leading-relaxed text-gray-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6.5">
            <h3 className="mb-1.5 text-base font-extrabold text-gray-900">
              {m.pricing_pro_name()}
            </h3>
            <div className="mb-5.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black text-gray-900 transition-all">
                {getPrice(1199, 450)}
              </span>
              <span className="text-[13px] font-bold text-gray-500">
                {m.pricing_currency_month()}
              </span>
            </div>
            <Link
              href="/demo"
              className="mb-6 flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
            >
              {m.pricing_pro_cta()}
            </Link>
            <ul className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              {[
                m.pricing_pro_f1(),
                m.pricing_pro_f2(),
                m.pricing_pro_f3(),
                m.pricing_pro_f4(),
                m.pricing_pro_f5(),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckIcon className="text-emerald-700" />
                  <span className="text-[13px] leading-relaxed text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-xl bg-white p-5 border border-gray-200 text-[13px] text-gray-600">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">💳</span>
            <p><strong>{m.pricing_footer_payment_title()}</strong> {m.pricing_footer_payment_desc()}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5">🌐</span>
            <p><strong>{m.pricing_footer_meta_title()}</strong> {m.pricing_footer_meta_desc()}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
