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

  const baseUrl = process.env.BASE_API_URL;
  if (!baseUrl) {
    return { status: "error", message: "BASE_API_URL not configured" };
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/messages/`, {
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
    return {
      status: "error",
      message: `Could not reach backend at ${baseUrl}`,
    };
  }

  if (!response.ok) {
    const detail = await response.text();
    return { status: "error", message: `${response.status}: ${detail}` };
  }

  const data = (await response.json()) as MessageIngestResponse;
  return { status: "success", data };
}
