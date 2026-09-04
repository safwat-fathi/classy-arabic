import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIES, LOGIN_MARKER } from "@/lib/constants";
import { getBaseUrl } from "@/lib/api";

const getAuthToken = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIES.TOKEN)?.value;
  if (!token) {
    redirect("/login");
  }
  return token;
});

export const getCurrentMerchant = cache(async () => {
  const token = await getAuthToken();
  const res = await fetch(`${getBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    // RSC render cannot mutate cookies; redirect with a marker and let proxy.ts clear them.
    redirect(`/login?${LOGIN_MARKER}=1`);
  }

  const data = await res.json() as { merchant_id: string; merchant_name: string; channels: Array<{channel: string; account_name: string | null}> };
  return {
    merchantId: data.merchant_id,
    merchantName: data.merchant_name || "Merchant",
    channels: data.channels || [],
  };
});
