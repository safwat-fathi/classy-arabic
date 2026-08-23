import type { Product } from "@/lib/products";

function formatVariants(variants: Record<string, unknown>): string {
  const parts = Object.entries(variants).map(([key, value]) => {
    const values = Array.isArray(value) ? value.join(", ") : String(value);
    return `${key}: ${values}`;
  });
  return parts.join(" · ") || "no variants";
}

export function ProductCatalog({ products }: { products: Product[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Merchant catalog</h2>
      <ul className="flex flex-col gap-2">
        {products.map((product) => (
          <li
            key={product.id}
            className="rounded border border-black/10 p-3 dark:border-white/10"
          >
            <p className="font-medium">{product.name}</p>
            {product.aliases.length > 0 && (
              <p className="text-xs text-black/50 dark:text-white/50">
                aka {product.aliases.join(", ")}
              </p>
            )}
            <p className="text-xs text-black/60 dark:text-white/60">
              {formatVariants(product.variants)}
            </p>
          </li>
        ))}
        {products.length === 0 && (
          <li className="text-sm text-black/50 dark:text-white/50">No products seeded.</li>
        )}
      </ul>
    </section>
  );
}
