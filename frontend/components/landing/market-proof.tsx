
export function MarketProof() {
  return (
    <section className="border-b border-gray-200 bg-white px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-sm font-extrabold tracking-wide text-emerald-700">
              السوق المصري
            </span>
            <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              ليه الاعتماد على الموقع لوحده بيضيع عليك 90% من الزبائن؟
            </h2>
            <p className="text-[15px] leading-loose text-gray-500">
              زبونك المصري مش هيستنى يفتح رابط موقع أو يسجل حساب.. زبونك متعود
              يشتري من الشات، وإحنا بنخلي الشات يبيع له كأنه متجر كامل!
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>صفحات فيسبوك</span>
                  <span>61.7%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: "61.7%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>جروبات ومحادثات واتساب</span>
                  <span>31.8%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: "31.8%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>مواقع المتاجر المستقلة</span>
                  <span>3.7%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gray-400"
                    style={{ width: "3.7%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400">
                المصدر: تقرير مسح استخدام التجارة الإلكترونية، وزارة الاتصالات و{" "}
                <span dir="ltr">CAPMAS</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
