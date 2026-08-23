"use client";

import { useActionState, useEffect } from "react";
import type { Product } from "@/lib/products";
import { sendMessage, type IngestState } from "./actions";

const initialState: IngestState = { status: "idle" };

function findProduct(products: Product[], productId: string | null): Product | null {
  if (!productId) return null;
  return products.find((p) => p.id === productId) ?? null;
}

export function MessageComposer({
  conversationId,
  products,
  onHighlightProducts,
}: {
  conversationId: string;
  products: Product[];
  onHighlightProducts?: (ids: string[]) => void;
}) {
  const action = sendMessage.bind(null, conversationId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success" && onHighlightProducts) {
      if (state.data.order) {
        const matchedIds = state.data.order.line_items
          .map((item) => item.product_id)
          .filter(Boolean) as string[];
        onHighlightProducts(matchedIds);
      } else {
        onHighlightProducts([]);
      }
    } else if (state.status !== "success" && onHighlightProducts) {
      onHighlightProducts([]);
    }
  }, [state, onHighlightProducts]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold tracking-tight">إرسال رسالة</h2>
      <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <textarea
          name="text"
          required
          rows={3}
          placeholder="عايز فستان صيفي..."
          className="w-full resize-none rounded-lg border-gray-200 bg-gray-50 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="self-end rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "جاري التحليل..." : "إرسال"}
        </button>
      </form>

      {state.status === "error" && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {state.data.intent ?? "Unknown Intent"}
            </span>
            {state.data.intent_confidence !== null && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {(state.data.intent_confidence * 100).toFixed(0)}% ثقة
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              الموديل: {state.data.model_tier ?? "Unknown"}
            </span>
          </div>

          {state.data.escalation_reason && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-semibold">تصعيد:</span> {state.data.escalation_reason}
            </div>
          )}

          {state.data.order ? (
            <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">بيانات الطلب المستخرجة</h3>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {state.data.order.status}
                  ({(state.data.order.confidence_score * 100).toFixed(0)}% conf, {state.data.order.extracted_by_tier})
                </span>
              </div>
              
              <ul className="flex flex-col gap-2 text-sm text-gray-700">
                {state.data.order.address && (
                  <li className="flex gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{state.data.order.address}</span>
                  </li>
                )}
                {state.data.order.phone && (
                  <li className="flex gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{state.data.order.phone}</span>
                  </li>
                )}
                {state.data.order.payment_method && (
                  <li className="flex gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>{state.data.order.payment_method}</span>
                  </li>
                )}
                {state.data.order.ambiguous_fields.length > 0 && (
                  <li className="flex gap-2 text-amber-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>يحتاج توضيح في: <span className="font-medium">{state.data.order.ambiguous_fields.join(", ")}</span></span>
                  </li>
                )}
              </ul>

              <div className="mt-2">
                <h4 className="mb-2 text-sm font-medium text-gray-900">عناصر الطلب</h4>
                <ul className="flex flex-col gap-2">
                  {state.data.order.line_items.map((item, i) => {
                    const matched = findProduct(products, item.product_id);
                    return (
                      <li key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                        <div>
                          <span className="font-semibold text-gray-900">{item.quantity}×</span> {item.product_name}
                          {item.notes && <span className="text-gray-500"> ({item.notes})</span>}
                        </div>
                        {matched ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            متطابق
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            غير متطابق
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              مقدرناش نستخرج بيانات طلب من الرسالة دي.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
