"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { ProductCatalog } from "./product-catalog";
import { MessageComposer } from "./message-composer";
import { AIInsights } from "./ai-insights";
import { StoreKnowledgeView } from "./store-knowledge-view";
import type { IngestState } from "./actions";
import type { StoreKnowledge } from "@/lib/knowledge";
import * as m from "@/paraglide/messages";

export function Workspace({
  conversationId,
  products,
  knowledge,
}: {
  conversationId: string;
  products: Product[];
  knowledge: StoreKnowledge[];
}) {
  const [ingestState, setIngestState] = useState<IngestState>({ status: "idle" });
  const [activeTab, setActiveTab] = useState<"products" | "knowledge">("products");

  let highlightedProductIds: string[] = [];
  if (ingestState.status === "success" && ingestState.data.order) {
    highlightedProductIds = ingestState.data.order.line_items
      .map((item) => item.product_id)
      .filter(Boolean) as string[];
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 items-start">
      <div className="flex flex-col gap-8 h-[calc(100vh-8rem)] sticky top-8">
        <MessageComposer
          conversationId={conversationId}
          onStateChange={setIngestState}
        />
      </div>
      <div className="flex flex-col gap-8 border-s-0 md:border-s border-gray-200 md:ps-8">
        <AIInsights state={ingestState} products={products} />
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "products"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m.demo_tab_products()}
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "knowledge"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m.demo_tab_knowledge()}
            </button>
          </div>
          
          {activeTab === "products" ? (
            <ProductCatalog products={products} highlightedProductIds={highlightedProductIds} />
          ) : (
            <StoreKnowledgeView knowledge={knowledge} />
          )}
        </div>
      </div>
    </div>
  );
}
