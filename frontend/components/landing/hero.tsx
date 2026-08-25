import Link from "next/link";
import Image from "next/image";
import { CheckIcon } from "@/components/ui/check-icon";

export function Hero() {
  return (
    <section
      className="relative"
      style={{
        background:
          "radial-gradient(1100px 520px at 82% -10%, rgba(16,185,129,0.24), transparent 60%), radial-gradient(700px 420px at 8% 110%, rgba(16,185,129,0.14), transparent 55%), #0a0f0d",
      }}
    >
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 pt-8 pb-16 sm:px-8 sm:pt-12 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-16 lg:pb-28">
        <div>
          <h1 className="font-display mb-5 text-4xl leading-tight font-black text-white sm:text-5xl lg:text-6xl">
            مش محتاج موقع إلكتروني.. <br /> شات الفيسبوك هو متجرك الإلكتروني
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-loose text-gray-400">
            اربط كتالوج منتجاتك بفيسبوك، إنستجرام، وواتساب في مكان واحد. عميلك
            هيشوف منتجاتك ويطلب مباشرة من الشات من خلال{" "}
            <strong className="text-gray-300">كتالوج تفاعلي منظم</strong> و{" "}
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 p-2 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] leading-relaxed">
              <span className="text-[13px]">✨</span> ذكاء اصطناعي
            </span>{" "}
            يفهم أسئلة واستفسارات عملاءك ويرد عليهم و يقفل الاوردرز تلقائيا.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 mb-5">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-6.5 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              🚀 ابدأ تجربتك المجانية (30 أوردر علينا)
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-6.5 py-3.5 text-[15px] font-semibold text-gray-200 transition-colors hover:bg-white/10"
            >
              📱 جرّب شات تجريبي حي الآن
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="text-emerald-500 w-4 h-4" /> بدون الحاجة
              لبطاقة بنكية
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 text-base">⚡</span> إعداد متجرك
              في دقيقتين
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 text-base">🔒</span> الأسعار
              والمخزون مؤكدة 100%
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4.5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-gray-500">
                محادثة واردة &middot; ماسنجر
              </span>
            </div>
            <div
              dir="ltr"
              className="max-w-[84%] self-start rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-gray-900 text-left font-medium"
            >
              3ayz 2 tshirt aswd XL w whed abyad L f 15 shary el tahrir el dokki
            </div>
            <div className="flex items-center gap-2 self-start rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              </svg>
              <span>جاري الفهم وتحديد المخزون...</span>
            </div>

            {/* Split Screen Logic Representation */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-900">
                  <Image
                    src="/images/black_tshirt.jpg"
                    alt="تيشيرت أساسي"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-extrabold text-gray-900">
                    2x تيشيرت أساسي أسود (XL)
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    1x تيشيرت أساسي أبيض (L)
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-extrabold whitespace-nowrap text-emerald-800">
                  متوفر
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>العنوان:</span>
                  <span className="font-bold text-gray-900">
                    15 شارع التحرير، الدقي
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>إجمالي المنتجات:</span>
                  <span className="font-bold text-gray-900">750 ج.م</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>الشحن (الدقي):</span>
                  <span className="font-bold text-gray-900">45 ج.م</span>
                </div>
                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                  <span className="text-gray-900 font-bold">الإجمالي:</span>
                  <span className="font-bold text-emerald-700">795 ج.م</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute start-[-18px] bottom-[-18px] flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-xl">
            <CheckIcon className="text-emerald-700" />
            <span className="text-xs font-extrabold text-gray-900">
              أوردر جاهز للشحن 📦
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
