import React from "react";

const TESTIMONIALS = [
  {
    quote:
      "بقيت مبسوطة إني مش بارد يدوي على كل رسالة. الطلبات بقت بتتسجل لوحدها وأنا بس بأكد عليها.",
    name: "سارة عبد الرحمن",
    role: "لبس حريمي · انستجرام",
    initial: "س",
  },
  {
    quote:
      "أهم حاجة إنه بيفهم العرباوي زي ما بنكتب بالظبط، مش لغة فصحى مصطنعة محدش بيتكلم بيها.",
    name: "محمود العدوي",
    role: "إكسسوارات · واتساب بيزنس",
    initial: "م",
  },
  {
    quote:
      "التصعيد للمراجعة بس لما يحصل لخبطة فعلًا وفّر عليا وقت كتير كنت بضيعه في متابعة كل حاجة يدوي.",
    name: "نور الشريف",
    role: "بوتيك أونلاين · فيسبوك",
    initial: "ن",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            آراء التجار
          </span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            تجار بيبيعوا على السوشيال ميديا بيستخدموه فعلًا
          </h2>
          <p className="text-xs text-gray-400">شهادات تجريبية لغرض العرض</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5.5"
            >
              <p className="text-sm leading-loose text-gray-700">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <span className="font-display flex size-9.5 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">
                  {t.initial}
                </span>
                <div>
                  <div className="text-[13px] font-extrabold text-gray-900">
                    {t.name}
                  </div>
                  <div className="text-[11.5px] text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
