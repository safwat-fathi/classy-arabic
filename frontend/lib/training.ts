export interface LabeledExample {
  id: string;
  merchant_id: string | null;
  normalized_text: string;
  intent: string;
  extraction: Record<string, unknown> | null;
  source: string;
}
