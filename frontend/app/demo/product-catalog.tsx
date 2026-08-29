import Image from "next/image";
import type { Product } from "@/lib/products";
import * as m from "@/paraglide/messages";

function formatVariants(variants: any[] | Record<string, unknown> | null) {
  if (!variants) return [];
  
  if (Array.isArray(variants)) {
    return variants.map((v) => {
      // If the backend returns ProductVariant objects
      const key = v.label || v.sku || "Variant";
      let values = "";
      if (v.price) values += `${v.price} ${m.demo_catalog_egp()}`;
      if (v.stock) values += values ? ` (${v.stock})` : String(v.stock);
      if (!values) values = "متوفر";
      
      return { key, values };
    });
  }

  return Object.entries(variants).map(([key, value]) => {
    const values = Array.isArray(value) ? value.join(", ") : String(value);
    return { key, values };
  });
}

function getImageForProduct(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("denim")) return "/images/denim_jacket.jpg";
  if (lower.includes("linen")) return "/images/linen_dress.jpg";
  if (lower.includes("shirt")) return "/images/black_tshirt.jpg";
  return "/images/denim_jacket.jpg"; // fallback
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
      <h2 className="font-display text-xl font-semibold tracking-tight">{m.demo_catalog_title()}</h2>
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
                <div className="absolute end-2 top-2 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  {m.demo_catalog_matched()}
                </div>
              )}
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={getImageForProduct(product.name)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  {product.price !== null && (
                    <span className="font-semibold text-gray-900">
                      {product.price} {m.demo_catalog_egp()}
                    </span>
                  )}
                </div>
                {product.aliases.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {m.demo_catalog_aka()} {product.aliases.join(", ")}
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
                      {m.demo_catalog_no_options()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {m.demo_catalog_empty()}
          </div>
        )}
      </div>
    </section>
  );
}
