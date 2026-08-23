"use server";

import type { MessageIngestResponse } from "@/lib/messages";

export type IngestState =
  | { status: "idle" }
  | { status: "success"; data: MessageIngestResponse }
  | { status: "error"; message: string };

export async function sendMessage(
  conversationId: string,
  _prevState: IngestState,
  formData: FormData,
): Promise<IngestState> {
  const text = String(formData.get("text") ?? "");

  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return { status: "error", message: "BACKEND_API_URL not configured" };
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/v1/messages/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        raw_text: text,
        normalized_text: text,
      }),
      cache: "no-store",
    });
  } catch {
    return { status: "error", message: `Could not reach backend at ${backendUrl}` };
  }

  if (!response.ok) {
    const detail = await response.text();
    return { status: "error", message: `${response.status}: ${detail}` };
  }

  const data = (await response.json()) as MessageIngestResponse;
  return { status: "success", data };
}
