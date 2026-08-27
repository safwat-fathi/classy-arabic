
import * as m from "@/paraglide/messages";

export function ROIAndProfitLogic() {
  return (
    <section className="bg-emerald-900 px-5 py-16 sm:px-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl text-center mx-auto">
          <span className="text-sm font-extrabold tracking-wide text-emerald-300">
            {m.roi_badge()}
          </span>
          <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold sm:text-4xl">
            {m.roi_title()}
          </h2>
          <p className="text-[15px] leading-loose text-emerald-100/80">
            {m.roi_desc()}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white text-gray-900 shadow-xl">
          <div className="grid md:grid-cols-2">
            <div className="p-8 border-b md:border-b-0 md:border-l border-gray-100">
              <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                <span className="text-2xl">❌</span> {m.roi_trad_title()}
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">{m.roi_reply_time()}</span>
                  <span className="font-bold">{m.roi_trad_reply()}</span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">{m.roi_close_rate()}</span>
                  <span className="font-bold text-red-600">
                    {m.roi_trad_close()}
                  </span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">{m.roi_shipping_err()}</span>
                  <span className="font-bold text-red-600">
                    {m.roi_trad_err()}
                  </span>
                </li>
                <li className="flex justify-between pb-3">
                  <span className="text-gray-500">{m.roi_mod_cost()}</span>
                  <span className="font-bold">{m.roi_trad_cost()}</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-emerald-50">
              <h3 className="text-xl font-bold text-emerald-700 mb-6 flex items-center gap-2">
                <span className="text-2xl">✅</span> {m.roi_bot_title()}
              </h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">وقت الرد</span>
                  <span className="font-bold text-emerald-900">
                    {m.roi_bot_reply()}
                  </span>
                </li>
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">معدل إغلاق البيعة</span>
                  <span className="font-bold text-emerald-700">
                    {m.roi_bot_close()}
                  </span>
                </li>
                <li className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-emerald-800/70">أخطاء الشحن</span>
                  <span className="font-bold text-emerald-700">
                    {m.roi_bot_err()}
                  </span>
                </li>
                <li className="flex justify-between pb-3">
                  <span className="text-emerald-800/70">{m.roi_cost_lbl()}</span>
                  <span className="font-bold text-emerald-900">
                    {m.roi_bot_cost()}
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
