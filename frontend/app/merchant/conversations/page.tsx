import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchConversationsAction } from "@/app/demo/actions";
import { ConversationsClient } from "./conversations-client";

export default async function ConversationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tijaratk_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  // Fetch actual conversations list from backend
  const conversations = await fetchConversationsAction(undefined, token);

  return (
    <ConversationsClient 
      merchantId="" 
      conversations={conversations} 
    />
  );
}
