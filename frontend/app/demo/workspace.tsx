"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import type { StoreKnowledge } from "@/lib/knowledge";
import { DemoProductCatalog } from "./demo-product-catalog";
import { MessageComposer } from "./message-composer";
import { AIInsights } from "./ai-insights";
import { StoreKnowledgeView } from "./store-knowledge-view";
import {
  fetchKnowledgeAction,
  fetchProductsAction,
  type IngestState,
} from "./actions";
import * as m from "@/paraglide/messages";

export function Workspace({
  conversationId,
  merchantId,
  products: initialProducts,
  knowledge: initialKnowledge,
}: {
  conversationId: string;
  merchantId?: string;
  products: Product[];
  knowledge: StoreKnowledge[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [knowledge, setKnowledge] = useState<StoreKnowledge[]>(initialKnowledge);
  const [ingestState, setIngestState] = useState<IngestState>({
    status: "idle",
  });
  const [activeTab, setActiveTab] = useState<"products" | "knowledge">("products");

  const refreshProducts = async () => {
    try {
      const updated = await fetchProductsAction(merchantId);
      setProducts(updated);
    } catch (e) {
      console.error("Failed to refresh products", e);
    }
  };

  const refreshKnowledge = async () => {
    try {
      const updated = await fetchKnowledgeAction(merchantId);
      setKnowledge(updated);
    } catch (e) {
      console.error("Failed to refresh knowledge", e);
    }
  };

  let highlightedProductIds: string[] = [];
  if (ingestState.status === "success" && ingestState.data.order) {
    highlightedProductIds = ingestState.data.order.line_items
      .map((item) => item.product_id)
      .filter(Boolean) as string[];
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Main Grid: Chat on Left, Products/Knowledge/Insights on Right */}
      <div className="grid gap-8 md:grid-cols-2 items-start">
        <div className="flex flex-col gap-8 h-[calc(85vh-8rem)] sticky top-8">
          <MessageComposer
            conversationId={conversationId}
            isTakeover={false}
            onStateChange={setIngestState}
          />
        </div>

        <div className="flex flex-col gap-8 border-s-0 md:border-s border-gray-200 md:ps-8">
          <AIInsights state={ingestState} products={products} activeTab={activeTab} />

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
                {m.demo_tab_products()} ({products.length})
              </button>
              <button
                onClick={() => setActiveTab("knowledge")}
                className={`pb-2 text-sm font-medium ${
                  activeTab === "knowledge"
                    ? "border-b-2 border-emerald-600 text-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m.demo_tab_knowledge()} ({knowledge.length})
              </button>
            </div>

            {activeTab === "products" ? (
              <DemoProductCatalog
                products={products}
                highlightedProductIds={highlightedProductIds}
              />
            ) : (
              <StoreKnowledgeView
                knowledge={knowledge}
                merchantId={merchantId}
                onRefresh={refreshKnowledge}
                readOnly={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
