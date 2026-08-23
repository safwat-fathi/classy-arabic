"use client";

import { useActionState } from "react";
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
}: {
  conversationId: string;
  products: Product[];
}) {
  const action = sendMessage.bind(null, conversationId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Send a message</h2>
      <form action={formAction} className="flex flex-col gap-3">
        <textarea
          name="text"
          required
          rows={3}
          placeholder="عايز فستان صيفي..."
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {isPending ? "Analyzing..." : "Send"}
        </button>
      </form>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-3 rounded border border-black/10 p-4 text-sm dark:border-white/10">
          <div>
            <span className="font-medium">Label:</span> {state.data.intent ?? "—"}{" "}
            {state.data.intent_confidence !== null && (
              <span className="text-black/50 dark:text-white/50">
                ({(state.data.intent_confidence * 100).toFixed(0)}% confidence)
              </span>
            )}
          </div>
          <div>
            <span className="font-medium">Model tier:</span> {state.data.model_tier ?? "—"}
          </div>
          {state.data.escalation_reason && (
            <div>
              <span className="font-medium">Escalation reason:</span> {state.data.escalation_reason}
            </div>
          )}

          {state.data.order ? (
            <div className="flex flex-col gap-2 border-t border-black/10 pt-3 dark:border-white/10">
              <div>
                <span className="font-medium">Order status:</span> {state.data.order.status}{" "}
                <span className="text-black/50 dark:text-white/50">
                  ({(state.data.order.confidence_score * 100).toFixed(0)}% confidence,{" "}
                  {state.data.order.extracted_by_tier})
                </span>
              </div>
              {state.data.order.address && (
                <div>
                  <span className="font-medium">Address:</span> {state.data.order.address}
                </div>
              )}
              {state.data.order.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {state.data.order.phone}
                </div>
              )}
              {state.data.order.payment_method && (
                <div>
                  <span className="font-medium">Payment method:</span> {state.data.order.payment_method}
                </div>
              )}
              {state.data.order.ambiguous_fields.length > 0 && (
                <div>
                  <span className="font-medium">Ambiguous fields:</span>{" "}
                  {state.data.order.ambiguous_fields.join(", ")}
                </div>
              )}
              <div>
                <span className="font-medium">Line items:</span>
                <ul className="mt-1 flex flex-col gap-1">
                  {state.data.order.line_items.map((item, i) => {
                    const matched = findProduct(products, item.product_id);
                    return (
                      <li key={i} className="rounded bg-black/5 p-2 dark:bg-white/10">
                        {item.quantity}× {item.product_name}
                        {item.notes && (
                          <span className="text-black/50 dark:text-white/50"> ({item.notes})</span>
                        )}
                        {matched ? (
                          <span className="ml-2 text-green-700 dark:text-green-400">
                            → matched: {matched.name}
                          </span>
                        ) : (
                          <span className="ml-2 text-black/40 dark:text-white/40">
                            → no catalog match
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-black/50 dark:text-white/50">No order extracted from this message.</p>
          )}
        </div>
      )}
    </section>
  );
}
