"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { ProductCatalog } from "./product-catalog";
import { MessageComposer } from "./message-composer";

export function Workspace({
  conversationId,
  products,
}: {
  conversationId: string;
  products: Product[];
}) {
  const [highlightedProductIds, setHighlightedProductIds] = useState<string[]>([]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductCatalog products={products} highlightedProductIds={highlightedProductIds} />
      <MessageComposer
        conversationId={conversationId}
        products={products}
        onHighlightProducts={setHighlightedProductIds}
      />
    </div>
  );
}
