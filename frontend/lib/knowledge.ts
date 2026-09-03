export interface StoreKnowledge {
  id: string;
  merchant_id: string;
  knowledge_type: string;
  title: string;
  content: string;
  keywords: string[];
  created_at: string;
}

export async function getStoreKnowledge(merchantId: string): Promise<StoreKnowledge[]> {
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
    `${baseUrl}/store-knowledge/?merchant_id=${encodeURIComponent(merchantId)}`,
    { 
      headers,
      cache: "no-store" 
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch store knowledge: ${response.status}`);
  }
  return (await response.json()) as StoreKnowledge[];
}
