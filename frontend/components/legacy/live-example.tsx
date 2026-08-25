import React from "react";
import Image from "next/image";

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

export function LiveExample() {
  return (
    <section id="example" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-11 max-w-xl">
          <span className="text-sm font-extrabold tracking-wide text-emerald-700">
            مثال حي
          </span>
          <h2 className="font-display mt-2 mb-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            من محادثة عادية لطلب مؤكد
          </h2>
          <p className="text-[15px] leading-loose text-gray-500">
            مثال توضيحي ببيانات تجريبية &mdash; كده بيتصرف المحرك مع رسالة
            حقيقية من عميل.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-1 text-xs font-extrabold text-gray-400">
              محادثة انستجرام
            </div>
            <div className="max-w-[88%] self-start rounded-2xl rounded-bl-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">
              هاي، الجاكيت الجينز اللي في آخر بوست، متوفر مقاس L؟
            </div>
            <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-emerald-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">
              أيوة متوفر، تحبي تأكدي الطلب دلوقتي؟
            </div>
            <div className="max-w-[88%] self-start rounded-2xl rounded-bl-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">
              أيوة، ابعتيه لنفس عنوان أوضة عرب اللي طلبت منه قبل كده، وهدفع عند
              الاستلام
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <CheckIcon />
              <span>تم استخراج الطلب تلقائيًا</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-400">
                بيانات الطلب المستخرجة
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                ثقة 94%
              </span>
            </div>
            <div className="mb-4 flex gap-3">
              <Image
                src="/images/denim_jacket.jpg"
                alt="جاكيت جينز كلاسيك"
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div>
                <div className="text-[14.5px] font-extrabold text-gray-900">
                  جاكيت جينز كلاسيك
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  مقاس L &middot; قطعة واحدة
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">العنوان</span>
                <span className="font-bold text-gray-900">
                  محفوظ من طلب سابق
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">رقم التليفون</span>
                <span dir="ltr" className="font-bold text-gray-900">
                  01••••••••
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">طريقة الدفع</span>
                <span className="font-bold text-gray-900">
                  كاش عند الاستلام
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">الحالة</span>
                <span className="font-extrabold text-emerald-700">
                  تأكيد تلقائي
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Image
              src="/images/linen_dress.jpg"
              alt="فستان كتان صيفي"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold text-gray-900">
                فستان كتان صيفي
              </div>
              <div className="text-[11px] text-gray-400">
                آخر مزامنة: منذ دقيقتين
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Image
              src="/images/denim_jacket.jpg"
              alt="جاكيت جينز كلاسيك"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold text-gray-900">
                جاكيت جينز كلاسيك
              </div>
              <div className="text-[11px] text-gray-400">
                آخر مزامنة: منذ 5 دقايق
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
