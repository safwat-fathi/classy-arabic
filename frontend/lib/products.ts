export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  aliases: string[];
  variants: Record<string, unknown>;
}

export async function getProducts(merchantId: string): Promise<Product[]> {
  const baseUrl = process.env.BASE_API_URL;
  if (!baseUrl) {
    throw new Error("BASE_API_URL not configured");
  }
  const response = await fetch(
    `${baseUrl}/api/v1/products/?merchant_id=${encodeURIComponent(merchantId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return (await response.json()) as Product[];
}
