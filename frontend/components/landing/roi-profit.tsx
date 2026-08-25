
export function ROIAndProfitLogic() {
  return (
    <section className="bg-emerald-900 px-5 py-16 sm:px-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl text-center mx-auto">
          <span className="text-sm font-extrabold tracking-wide text-emerald-300">
            لغة الأرقام
          </span>
          <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold sm:text-4xl">
            إزاي "تِجارتك بوت" بيدفع ثمنه من أول أسبوع؟
          </h2>
          <p className="text-[15px] leading-loose text-emerald-100/80">
            التكلفة مش اشتراك المنصة، التكلفة الحقيقية هي الأوردرات اللي بتضيع
            بسبب التأخير في الرد.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white text-gray-900 shadow-xl">
          <div className="grid md:grid-cols-2">
            <div className="p-8 border-b md:border-b-0 md:border-l border-gray-100">
              <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                <span className="text-2xl">❌</span> الطريقة التقليدية
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">وقت الرد</span>
                  <span className="font-bold">من 15 دقيقة لساعات</span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">معدل إغلاق البيعة</span>
                  <span className="font-bold text-red-600">
                    30% (الزبون بيبرد)
                  </span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">أخطاء الشحن</span>
                  <span className="font-bold text-red-600">
                    واردة (Copy/Paste)
                  </span>
                </li>
                <li className="flex justify-between pb-3">
                  <span className="text-gray-500">تكلفة المودريتورز</span>
                  <span className="font-bold">مرتبات + عمولات متزايدة</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-emerald-50">
              <h3 className="text-xl font-bold text-emerald-700 mb-6 flex items-center gap-2">
                <span className="text-2xl">✅</span> مع تِجارتك بوت
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">وقت الرد</span>
                  <span className="font-bold text-emerald-900">
                    0 ثانية (فوري 24/7)
                  </span>
                </li>
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">معدل إغلاق البيعة</span>
                  <span className="font-bold text-emerald-700">
                    70%+ (العميل سخن)
                  </span>
                </li>
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">أخطاء الشحن</span>
                  <span className="font-bold text-emerald-700">
                    0% (استخراج آلي)
                  </span>
                </li>
                <li className="flex justify-between pb-3">
                  <span className="text-emerald-800/70">التكلفة</span>
                  <span className="font-bold text-emerald-900">
                    اشتراك ثابت ورمزي
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
