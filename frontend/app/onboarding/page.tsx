"use client";

import { FacebookSDK } from "@/components/facebook-sdk";
import * as m from "@/paraglide/messages";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(
    async (scopes: string) => {
      if (typeof window === "undefined" || !window.FB) {
        alert("Facebook SDK is not loaded yet.");
        return;
      }

      setLoading(true);
      setError(null);

      window.FB.login(
        async (response) => {
          if (!response.authResponse) {
            setLoading(false);
            setError("Login cancelled.");
            return;
          }

          try {
            const res = await fetch(`${API_BASE}/auth/facebook/callback`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                access_token: response.authResponse.accessToken,
              }),
            });

            if (!res.ok) {
              const detail = await res.text();
              throw new Error(`${res.status}: ${detail}`);
            }

            const data = await res.json();
            // Store JWT for subsequent API calls
            localStorage.setItem("tijaratk_token", data.access_token);
            localStorage.setItem("tijaratk_merchant_id", data.merchant_id);
            localStorage.setItem("tijaratk_merchant_name", data.merchant_name);

            alert(
              `Connected! ${data.pages_connected} page(s) linked. Merchant: ${data.merchant_name}`
            );
            router.push("/demo");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Connection failed");
          } finally {
            setLoading(false);
          }
        },
        { scope: scopes, return_scopes: true }
      );
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <FacebookSDK />

      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">
            T
          </div>
          <span className="font-bold text-lg text-slate-900">{m.schema_website_name()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">Step 1/3</span>
          <div className="w-8 h-8 rounded-full bg-slate-200" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-16 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
          {m.onboarding_title()}
        </h1>

        {error && (
          <div className="mb-8 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 max-w-md w-full text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
          {/* Facebook & Instagram Card */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="h-16 flex items-center justify-center mb-6">
              {/* Facebook SVG Logo */}
              <svg viewBox="0 0 24 24" className="w-16 h-16 text-[#1877F2]" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{m.onboarding_fb_title()}</h2>
            <p className="text-slate-500 mb-8 max-w-xs">{m.onboarding_fb_desc()}</p>
            <button
              onClick={() =>
                handleConnect("email,public_profile,pages_manage_metadata,pages_messaging")
              }
              disabled={loading}
              className="mt-auto w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "..." : m.onboarding_fb_btn()}
            </button>
          </div>

          {/* WhatsApp Business Card */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="h-16 flex items-center justify-center mb-6">
              {/* WhatsApp SVG Logo */}
              <svg viewBox="0 0 24 24" className="w-16 h-16 text-[#25D366]" fill="currentColor">
                <path d="M12.031 0C5.395 0 0 5.395 0 12.031c0 2.126.554 4.195 1.606 6.012L.151 23.364l5.485-1.439A11.968 11.968 0 0012.031 24c6.634 0 12.029-5.395 12.029-12.031C24.06 5.395 18.665 0 12.031 0zm0 22.012a9.92 9.92 0 01-5.076-1.39l-.364-.216-3.766.988 1.006-3.67-.236-.376A9.919 9.919 0 012.052 12.03c0-5.503 4.478-9.98 9.979-9.98 5.503 0 9.98 4.477 9.98 9.98 0 5.502-4.477 9.98-9.98 9.98zm5.474-7.464c-.301-.151-1.777-.878-2.052-.979-.275-.101-.476-.151-.676.151-.201.301-.777.979-.953 1.18-.176.201-.352.226-.653.076a8.214 8.214 0 01-2.42-1.493 9.07 9.07 0 01-1.677-2.083c-.176-.301-.019-.464.132-.614.135-.135.301-.352.451-.527.151-.176.201-.301.301-.502.101-.201.05-.376-.025-.527-.075-.151-.676-1.63-.927-2.233-.243-.586-.49-.506-.676-.515-.176-.008-.376-.008-.577-.008-.201 0-.527.075-.802.376-.275.301-1.053 1.029-1.053 2.51 0 1.481 1.078 2.912 1.228 3.113.151.201 2.124 3.242 5.143 4.545.719.31 1.279.495 1.716.634.721.23 1.378.197 1.895.12.576-.085 1.777-.728 2.028-1.432.251-.703.251-1.305.176-1.431-.075-.126-.275-.201-.576-.352z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{m.onboarding_wa_title()}</h2>
            <p className="text-slate-500 mb-8 max-w-xs">{m.onboarding_wa_desc()}</p>
            <button
              onClick={() =>
                handleConnect(
                  "email,public_profile,whatsapp_business_management,whatsapp_business_messaging"
                )
              }
              disabled={loading}
              className="mt-auto w-full bg-[#25D366] hover:bg-[#20b858] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "..." : m.onboarding_wa_btn()}
            </button>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-12 text-slate-500 hover:text-slate-700 font-medium px-6 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors"
        >
          {m.onboarding_skip()}
        </button>
      </main>
    </div>
  );
}
