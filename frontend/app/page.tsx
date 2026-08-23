import { getConversations } from "@/lib/conversations";
import { getProducts, type Product } from "@/lib/products";
import { Workspace } from "./workspace";

export default async function Home() {
  const conversations = await getConversations();
  let conversation = conversations[0];
  let products: Product[] = [];

  if (!conversation) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Classy Arabic — Engine Demo</h1>
        <p className="text-sm text-red-600">
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
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Classy Arabic — Engine Demo</h1>
      <p className="text-sm text-gray-500">
        Conversation {conversation.id} · customer {conversation.customer_ref} · state{" "}
        {conversation.state}
      </p>
      <Workspace conversationId={conversation.id} products={products} />
    </main>
  );
}
