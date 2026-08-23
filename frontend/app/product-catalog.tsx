import Image from "next/image";
import type { Product } from "@/lib/products";

function formatVariants(variants: Record<string, unknown>) {
  return Object.entries(variants).map(([key, value]) => {
    const values = Array.isArray(value) ? value.join(", ") : String(value);
    return { key, values };
  });
}

function getImageForProduct(name: string) {
  if (name.toLowerCase().includes("denim")) return "/images/denim_jacket.jpg";
  if (name.toLowerCase().includes("linen")) return "/images/linen_dress.jpg";
  return "/images/denim_jacket.jpg"; // fallback
}

function getDummyPrice(name: string) {
  if (name.toLowerCase().includes("denim")) return "$89.99";
  if (name.toLowerCase().includes("linen")) return "$129.99";
  return "$49.99"; // fallback
}

export function ProductCatalog({
  products,
  highlightedProductIds = [],
}: {
  products: Product[];
  highlightedProductIds?: string[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Merchant Catalog</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {products.map((product) => {
          const isHighlighted = highlightedProductIds.includes(product.id);
          const variants = formatVariants(product.variants);

          return (
            <div
              key={product.id}
              className={`relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
                isHighlighted
                  ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500"
                  : "border-gray-200 bg-white shadow-sm hover:shadow-md"
              }`}
            >
              {isHighlighted && (
                <div className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Matched
                </div>
              )}
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={getImageForProduct(product.name)}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="font-semibold text-gray-900">
                    {getDummyPrice(product.name)}
                  </span>
                </div>
                {product.aliases.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    aka {product.aliases.join(", ")}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <span
                      key={v.key}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                    >
                      {v.key}: {v.values}
                    </span>
                  ))}
                  {variants.length === 0 && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      No variants
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No products seeded.
          </div>
        )}
      </div>
    </section>
  );
}
