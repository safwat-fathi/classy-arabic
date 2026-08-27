import * as m from "@/paraglide/messages";

export const getFaqs = () => [
  {
    q: m.faq_1_q(),
    a: m.faq_1_a(),
  },
  {
    q: m.faq_2_q(),
    a: m.faq_2_a(),
  },
  {
    q: m.faq_3_q(),
    a: m.faq_3_a(),
  },
  {
    q: m.faq_4_q(),
    a: m.faq_4_a(),
  },
  {
    q: m.faq_5_q(),
    a: m.faq_5_a(),
  },
  {
    q: m.faq_6_q(),
    a: m.faq_6_a(),
  },
];

export function FAQSection() {
  const FAQS = getFaqs();
  return (
    <section id="faq" className="bg-gray-50 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {m.faq_title()}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <h3 className="mb-3 text-[15px] font-bold text-gray-900 leading-snug">
                {faq.q}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-gray-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
