import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchKnowledgeAction } from "@/app/demo/actions";
import { PoliciesClient } from "./policies-client";

export default async function PoliciesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tijaratk_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  // Fetch actual policies list from backend
  const knowledge = await fetchKnowledgeAction(undefined, token);

  return (
    <PoliciesClient 
      initialKnowledge={knowledge} 
    />
  );
}

