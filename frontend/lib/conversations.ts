export interface Conversation {
  id: string;
  merchant_id: string;
  customer_ref: string;
  state: string;
  slots: Record<string, unknown>;
  last_message_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_API_URL not configured");
  }
  const response = await fetch(`${backendUrl}/api/v1/conversations/`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status}`);
  }
  return (await response.json()) as Conversation[];
}
