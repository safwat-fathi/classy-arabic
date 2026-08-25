import React from "react";

export function Stats() {
  const stats = [
    { value: "92%", label: "من الطلبات تتأكد تلقائيًا" },
    { value: "<2s", label: "متوسط زمن فهم الرسالة" },
    { value: "10K+", label: "رسالة تتم معالجتها يوميًا" },
    { value: "8%", label: "بس بتحتاج تصعيد لمراجعة" },
  ];
  return (
    <section className="bg-emerald-50 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                dir="ltr"
                className="font-display text-3xl font-black text-emerald-700 sm:text-4xl"
              >
                {stat.value}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-emerald-900">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
