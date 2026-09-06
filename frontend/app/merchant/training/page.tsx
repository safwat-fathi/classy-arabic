import { getCurrentMerchant } from "@/lib/dal";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/dal";
import type { LabeledExample } from "@/lib/training";
import { TrainingClient } from "./training-client";

async function getLabeledExamples(token: string): Promise<LabeledExample[]> {
  const res = await fetch(`${getBaseUrl()}/labeled-examples/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch training examples: ${res.status}`);
  }
  return (await res.json()) as LabeledExample[];
}

async function getIntents(token: string): Promise<string[]> {
  const res = await fetch(`${getBaseUrl()}/labeled-examples/intents`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as string[];
}

export default async function TrainingPage() {
  const { merchantId } = await getCurrentMerchant();
  const token = await getAuthToken();
  const examples = await getLabeledExamples(token);
  const intents = await getIntents(token);

  return <TrainingClient merchantId={merchantId} initialExamples={examples} intents={intents} />;
}
