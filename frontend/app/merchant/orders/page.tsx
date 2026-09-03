import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchProductsAction, fetchOrdersAction } from "@/app/demo/actions";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tijaratk_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  // Fetch actual products list from backend for the manual order form
  const products = await fetchProductsAction(undefined, token);
  // Fetch actual orders list
  const orders = await fetchOrdersAction(undefined, token);

  return (
    <OrdersClient 
      merchantId="" 
      products={products}
      initialOrders={orders}
    />
  );
}
