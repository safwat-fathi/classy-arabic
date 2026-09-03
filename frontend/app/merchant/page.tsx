import { Store, MessageSquare, Package, BookOpen } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.BASE_API_URL || "http://localhost:8000";

export default async function MerchantDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tijaratk_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const merchant = await res.json();
  const merchantName = merchant.merchant_name || "Merchant";

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {merchantName}</h1>
        <p className="text-slate-500 mt-1">Here is an overview of your store.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Stats Placeholder */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Products</p>
            <p className="text-2xl font-bold text-slate-900">Manage</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Policies</p>
            <p className="text-2xl font-bold text-slate-900">Manage</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Conversations</p>
            <p className="text-2xl font-bold text-slate-900">View</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Channels</p>
            <p className="text-2xl font-bold text-slate-900">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
