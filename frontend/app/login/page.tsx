"use client";

import { FacebookSDK } from "@/components/facebook-sdk";
import * as m from "@/paraglide/messages";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { loginWithFacebookAction } from "./actions";
export default function LoginPage() {
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
        (response: { authResponse?: { accessToken: string } }) => {
          (async () => {
            if (!response.authResponse) {
              setLoading(false);
              setError("Login cancelled.");
              return;
            }

            try {
              const result = await loginWithFacebookAction(response.authResponse.accessToken);
              if (result.conflicted_pages && result.conflicted_pages.length > 0) {
                alert(`Warning: ${result.conflicted_pages.length} of your pages are already connected to another merchant account and were not transferred.`);
              }
              router.push("/merchant");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Connection failed");
              setLoading(false);
            }
          })();
        },
        { scope: scopes, return_scopes: true }
      );
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans items-center justify-center">
      <FacebookSDK />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-2xl mb-8">
          T
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Merchant Login</h1>
        <p className="text-slate-500 mb-8">Connect your Facebook page to manage your store and AI replies.</p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 w-full text-center">
            {error}
          </div>
        )}

        <button
          onClick={() =>
            handleConnect("email,public_profile,pages_manage_metadata,pages_messaging,pages_show_list")
          }
          disabled={loading}
          className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </>
          )}
        </button>
      </div>
    </div>
  );
}
