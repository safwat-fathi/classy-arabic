import { cookies } from "next/headers";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const merchantName = cookieStore.get("tijaratk_merchant_name")?.value || "Merchant";

  return (
    <div className="font-sans max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your connected channels and preferences.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Connected Channels</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Facebook */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1877F2]/10 text-[#1877F2] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Facebook Messenger</p>
                <p className="text-sm text-slate-500">Connected to: {merchantName}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Active
            </span>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#25D366]/10 text-[#25D366] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M12.031 0C5.395 0 0 5.395 0 12.031c0 2.126.554 4.195 1.606 6.012L.151 23.364l5.485-1.439A11.968 11.968 0 0012.031 24c6.634 0 12.029-5.395 12.029-12.031C24.06 5.395 18.665 0 12.031 0zm0 22.012a9.92 9.92 0 01-5.076-1.39l-.364-.216-3.766.988 1.006-3.67-.236-.376A9.919 9.919 0 012.052 12.03c0-5.503 4.478-9.98 9.979-9.98 5.503 0 9.98 4.477 9.98 9.98 0 5.502-4.477 9.98-9.98 9.98z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">WhatsApp Business</p>
                <p className="text-sm text-slate-500">Not connected</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
