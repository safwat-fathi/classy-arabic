export interface Conversation {
  id: string;
  merchant_id: string;
  customer_ref: string;
  state: string;
  slots: Record<string, unknown>;
  last_message_at: string;
}

export async function getConversations(merchantId: string): Promise<Conversation[]> {
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
    `${baseUrl}/conversations/?merchant_id=${encodeURIComponent(merchantId)}`,
    { 
      headers,
      cache: "no-store" 
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status}`);
  }
  return (await response.json()) as Conversation[];
}
