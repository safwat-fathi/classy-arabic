"use client";

import Image from "next/image";
import type { Product, ProductVariant } from "@/lib/products";
import * as m from "@/paraglide/messages";

function formatVariants(variants: ProductVariant[] | Record<string, unknown> | null) {
  if (!variants) return [];

  if (Array.isArray(variants)) {
    return variants.map((v) => {
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
  return "/images/denim_jacket.jpg";
}

export function DemoProductCatalog({
  products,
  highlightedProductIds = [],
}: {
  products: Product[];
  highlightedProductIds?: string[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold tracking-tight">{m.demo_catalog_title()}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {products.map((product) => {
          const isHighlighted = highlightedProductIds.includes(product.id);
          const variants = formatVariants(product.variants);

          return (
            <div
              key={product.id}
              className={`relative flex overflow-hidden rounded-xl border transition-all duration-300 ${
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

              <div className="relative w-32 shrink-0 bg-gray-100 sm:w-40">
                <Image
                  src={getImageForProduct(product.name)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 128px, 160px"
                  priority
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col p-4 justify-center">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                  <h3 className="font-medium text-gray-900 leading-tight">{product.name}</h3>
                  {product.price !== null && (
                    <span className="font-semibold text-emerald-700 whitespace-nowrap">
                      {product.price} {m.demo_catalog_egp()}
                    </span>
                  )}
                </div>
                {product.aliases && product.aliases.length > 0 && (
                  <p className="mt-1.5 text-xs text-gray-500 line-clamp-1">
                    {m.demo_catalog_aka()} {product.aliases.join(", ")}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {variants.map((v) => (
                    <span
                      key={v.key}
                      className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/60"
                    >
                      {v.key}: {v.values}
                    </span>
                  ))}
                  {variants.length === 0 && (
                    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/60">
                      {m.demo_catalog_no_options()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {m.demo_catalog_empty()}
          </div>
        )}
      </div>
    </section>
  );
}
