"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIES, SESSION_COOKIES } from "@/lib/constants";

const API_BASE = process.env.BASE_API_URL || "http://localhost:8000";

async function setAuthCookies(data: { access_token: string; merchant_id: string; merchant_name: string }) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIES.TOKEN, data.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  cookieStore.set(COOKIES.MERCHANT_NAME, data.merchant_name, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginWithFacebookAction(accessToken: string) {
  const res = await fetch(`${API_BASE}/auth/facebook/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status}: ${detail}`);
  }

  const data = await res.json();
  await setAuthCookies(data);
  return data;
}


export async function logoutAction() {
  const cookieStore = await cookies();
  for (const key of SESSION_COOKIES) {
    cookieStore.delete(key);
  }
  redirect("/login");
}
