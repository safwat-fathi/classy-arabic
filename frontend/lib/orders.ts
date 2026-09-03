export interface OrderItem {
  id: string;
  product_id?: string;
  variant_id?: string;
  name_snapshot: string;
  variant_snapshot?: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number?: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  subtotal?: number;
  total?: number;
  created_at: string;
  items: OrderItem[];
}
