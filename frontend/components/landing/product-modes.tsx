import { CheckIcon } from "@/components/ui/check-icon";
import * as m from "@/paraglide/messages";

export function ProductModes() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-2xl text-center mx-auto">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            {m.modes_badge()}
          </span>
          <h2 className="font-display mt-2 mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {m.modes_title()}
          </h2>
          <p className="text-[15px] leading-loose text-gray-500">
            تطبيقنا بيقدملك طريقتين للبيع، تقدر تختار الأنسب لحجم وأسلوب بيزنسك،
            مع إمكانية الترقية في أي وقت.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Catalog Mode */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gray-200 text-gray-700">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              {m.modes_cat_title()}
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600">
              بيع هيكلي سريع يتيح للعميل استعراض المنتجات، اختيار المقاسات،
              وإضافة العناصر للسلة من خلال أزرار وقوائم سريعة داخل الشات، دون
              تكلفة الذكاء الاصطناعي.
            </p>
            <ul className="mt-2 flex flex-col gap-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> {m.modes_cat_f1()}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> {m.modes_cat_f2()}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> {m.modes_cat_f3()}
              </li>
            </ul>
          </div>

          {/* AI Commerce Mode */}
          <div className="relative flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8">
            <div className="absolute top-6 left-6 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {m.modes_ai_badge()}
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              {m.modes_ai_title()}
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600">
              {m.modes_ai_desc()}
            </p>
            <ul className="mt-2 flex flex-col gap-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> {m.modes_ai_f1()}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> {m.modes_ai_f2()}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon className="text-emerald-600" /> {m.modes_ai_f3()}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
