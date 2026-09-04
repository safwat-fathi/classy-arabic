"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithFacebookAction } from "@/app/login/actions";
import { FacebookSDK } from "@/components/facebook-sdk";
import { FACEBOOK_SCOPES } from "@/lib/constants";

export function ConnectFacebookPages() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    if (typeof window === "undefined" || !window.FB) {
      setDialogMessage("Facebook SDK is not loaded yet.");
      return;
    }

    setLoading(true);

    window.FB.login(
      (response: { authResponse?: { accessToken: string } }) => {
        (async () => {
          if (!response.authResponse) {
            setLoading(false);
            return;
          }

          try {
            const result = await loginWithFacebookAction(response.authResponse.accessToken);
            if (result.conflicted_pages && result.conflicted_pages.length > 0) {
              setDialogMessage(`تحذير: ${result.conflicted_pages.length} من صفحاتك متصلة بالفعل بحساب تاجر آخر ولم يتم نقلها.`);
            }
            router.refresh();
          } catch (err) {
            setDialogMessage(err instanceof Error ? err.message : "Connection failed");
          } finally {
            setLoading(false);
          }
        })();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { scope: FACEBOOK_SCOPES, return_scopes: true, auth_type: 'rerequest' } as any
    );
  }, [router]);

  return (
    <>
      <FacebookSDK />
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {loading ? "جاري الاتصال..." : "إدارة الصفحات"}
      </button>

      {dialogMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">تنبيه</h3>
              <p className="text-slate-600">{dialogMessage}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDialogMessage(null)}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
