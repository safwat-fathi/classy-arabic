export interface ProductVariant {
  label?: string;
  sku?: string;
  price?: number;
  stock?: number;
  [key: string]: unknown;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  aliases: string[];
  variants: ProductVariant[] | Record<string, unknown>;
  price: number | null;
}

export async function getProducts(merchantId: string): Promise<Product[]> {
  const baseUrl = process.env.BASE_API_URL;
  if (!baseUrl) {
    throw new Error("BASE_API_URL not configured");
  }
  const demoKey = process.env.DEMO_API_KEY;
  const headers: HeadersInit = {};
  if (demoKey) {
    headers["Authorization"] = `Bearer ${demoKey}`;
  }

  const response = await fetch(
    `${baseUrl}/products/?merchant_id=${encodeURIComponent(merchantId)}`,
    { 
      headers,
      cache: "no-store" 
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return (await response.json()) as Product[];
}
