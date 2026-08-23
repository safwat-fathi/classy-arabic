export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  aliases: string[];
  variants: Record<string, unknown>;
}

export async function getProducts(merchantId: string): Promise<Product[]> {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_API_URL not configured");
  }
  const response = await fetch(
    `${backendUrl}/api/v1/products/?merchant_id=${encodeURIComponent(merchantId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return (await response.json()) as Product[];
}
