import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchProductsAction } from "@/app/demo/actions";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tijaratk_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  // Fetch actual products list from backend
  const products = await fetchProductsAction(undefined, token);

  return (
    <ProductsClient 
      merchantId="" 
      initialProducts={products} 
    />
  );
}

