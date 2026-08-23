import type { Product } from "@/lib/products";
import type { IngestState } from "./actions";

function findProduct(
  products: Product[],
  productId: string | null,
): Product | null {
  if (!productId) return null;
  return products.find((p) => p.id === productId) ?? null;
}

const intentLabels: Record<string, string> = {
  purchase_intent: "طلب شراء",
  question: "استفسار",
  greeting: "تحية",
  spam: "سبام",
  reaction: "تفاعل",
  other: "أخرى",
};

export function AIInsights({
  state,
  products,
}: {
  state: IngestState;
  products: Product[];
}) {
  let content;

  if (state.status === "idle") {
    content = (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        ابعت رسالة عشان تشوف الذكاء الاصطناعي بيفهمها إزاي.
      </div>
    );
  } else if (state.status === "error") {
    content = (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        {state.message}
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col gap-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-800">
            {state.data.intent
              ? intentLabels[state.data.intent] || state.data.intent
              : "غير معروف"}
          </span>
          {state.data.intent_confidence !== null && (
            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              نسبة التأكد: {(state.data.intent_confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {state.data.escalation_reason && (
          <div className="rounded-md bg-amber-100 p-3 text-sm text-amber-900">
            <span className="font-semibold">تنبيه:</span>{" "}
            {state.data.escalation_reason}
          </div>
        )}

        {state.data.order ? (
          <div className="flex flex-col gap-4 border-t border-emerald-100 pt-4">
            <h3 className="font-semibold text-gray-900">تفاصيل الطلب:</h3>

            <ul className="flex flex-col gap-2 text-sm text-gray-700">
              {state.data.order.address && (
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">العنوان:</span>
                  <span>{state.data.order.address}</span>
                </li>
              )}
              {state.data.order.phone && (
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">الموبايل:</span>
                  <span>{state.data.order.phone}</span>
                </li>
              )}
            </ul>

            <div className="mt-2">
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                المنتجات المطلوبة:
              </h4>
              <ul className="flex flex-col gap-2">
                {state.data.order.line_items.map((item, i) => {
                  const matched = findProduct(products, item.product_id);
                  return (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-3 text-sm shadow-sm"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">
                          {item.quantity}×
                        </span>{" "}
                        {item.product_name}
                        {item.notes && (
                          <span className="mt-1 block text-xs text-gray-500">
                            المواصفات: {item.notes}
                          </span>
                        )}
                      </div>
                      {matched ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          موجود في الكتالوج
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          مش موجود
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            مفيش تفاصيل طلب واضحة في الرسالة.
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold tracking-tight">
        طلب العميل من خلال الرسالة:
      </h2>
      {content}
    </section>
  );
}
