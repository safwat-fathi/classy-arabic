"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { ProductCatalog } from "./product-catalog";
import { MessageComposer } from "./message-composer";
import { AIInsights } from "./ai-insights";
import type { IngestState } from "./actions";

export function Workspace({
  conversationId,
  products,
}: {
  conversationId: string;
  products: Product[];
}) {
  const [ingestState, setIngestState] = useState<IngestState>({ status: "idle" });

  let highlightedProductIds: string[] = [];
  if (ingestState.status === "success" && ingestState.data.order) {
    highlightedProductIds = ingestState.data.order.line_items
      .map((item) => item.product_id)
      .filter(Boolean) as string[];
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-8">
        <MessageComposer
          conversationId={conversationId}
          onStateChange={setIngestState}
        />
      </div>
      <div className="flex flex-col gap-8 border-s-0 md:border-s border-gray-200 md:ps-8">
        <AIInsights state={ingestState} products={products} />
        <ProductCatalog products={products} highlightedProductIds={highlightedProductIds} />
      </div>
    </div>
  );
}
