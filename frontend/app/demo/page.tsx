import Link from "next/link";
import { getConversations } from "@/lib/conversations";
import { getProducts, type Product } from "@/lib/products";
import { BrandMark } from "../logo";
import { Workspace } from "./workspace";

function DemoHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <BrandMark size="sm" />
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-emerald-700"
        >
          الرئيسية
        </Link>
      </div>
    </header>
  );
}

export default async function Home() {
  const conversations = await getConversations();
  let conversation = conversations[0];
  let products: Product[] = [];

  if (!conversation) {
    return (
      <>
        <DemoHeader />
        <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
          <h1 className="text-2xl font-semibold">
            Classy Arabic — ديمو المحرك
          </h1>
          <p className="text-sm text-red-600">
            مفيش محادثة موجودة. شغّل <code>make seed</code> في{" "}
            <code>backend/</code> الأول، وبعد كده حدّث الصفحة.
          </p>
        </main>
      </>
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
    <>
      <DemoHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 p-8">
        <h1 className="text-2xl font-semibold">
          Classy Arabic — تجربة محادثة مع عميل
        </h1>
        <p className="text-sm text-gray-500">
          محاكاة لتعرف الذكاء الاصطناعي على منتجاتك من خلال رسائل عملائك
        </p>
        <Workspace conversationId={conversation.id} products={products} />
      </main>
    </>
  );
}
