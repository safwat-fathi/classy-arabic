import { getConversations } from "@/lib/conversations";
import { getProducts, type Product } from "@/lib/products";
import { MessageComposer } from "./message-composer";
import { ProductCatalog } from "./product-catalog";

export default async function Home() {
  const conversations = await getConversations();
  let conversation = conversations[0];
  let products: Product[] = [];

  if (!conversation) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Classy Arabic — Engine Demo</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          No conversation found. Run <code>make seed</code> in <code>backend/</code> first,
          then reload this page.
        </p>
      </main>
    );
  }

  for (const c of conversations) {
    const p = await getProducts(c.merchant_id);
    if (p.length > 0) {
      conversation = c;
      products = p;
      break;
    }
  }

  if (products.length === 0) {
    // Fallback if none have products
    products = await getProducts(conversation.merchant_id);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Classy Arabic — Engine Demo</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Conversation {conversation.id} · customer {conversation.customer_ref} · state{" "}
        {conversation.state}
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductCatalog products={products} />
        <MessageComposer conversationId={conversation.id} products={products} />
      </div>
    </main>
  );
}
