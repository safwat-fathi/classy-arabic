export interface MessageIngestRequest {
  conversation_id: string;
  raw_text: string;
  normalized_text: string;
}

export interface OrderLineItem {
  product_name: string;
  quantity: number;
  notes: string | null;
  product_id: string | null;
}

export interface OrderDetail {
  id: string;
  status: string;
  confidence_score: number;
  extracted_by_tier: string;
  line_items: OrderLineItem[];
  address: string | null;
  phone: string | null;
  payment_method: string | null;
  ambiguous_fields: string[];
}

export interface MessageIngestResponse {
  message_id: string;
  intent: string | null;
  intent_confidence: number | null;
  model_tier: string | null;
  escalation_reason: string | null;
  order_id: string | null;
  order_status: string | null;
  order: OrderDetail | null;
  answer_text: string | null;
}
