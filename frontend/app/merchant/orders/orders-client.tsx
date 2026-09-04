"use client";

import { useState } from "react";
import { Product } from "@/lib/products";
import { Order } from "@/lib/orders";
import { createManualOrderAction, fetchOrdersAction, type ManualOrderResult } from "@/app/demo/actions";
import { useMerchantData } from "@/lib/use-merchant-data";

export function OrdersClient({
  merchantId,
  products,
  initialOrders,
}: {
  merchantId: string;
  products: Product[];
  initialOrders: Order[];
}) {
  const { data: orders, refresh } = useMerchantData<Order[]>(fetchOrdersAction, merchantId, initialOrders);
  
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<ManualOrderResult | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string>(products.length > 0 ? products[0].id : "");
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setOrderLoading(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const result = await createManualOrderAction(
        {
          conversation_id: `manual-${Date.now()}`,
          line_items: [{ product_id: selectedProductId, quantity: orderQuantity }],
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          delivery_address: deliveryAddress || undefined,
        },
        merchantId
      );
      setOrderSuccess(result);
      await refresh();
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "فشل إنشاء الطلب");
    } finally {
      setOrderLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'مكتمل';
      case 'CANCELLED': return 'ملغي';
      case 'GATHERING_ITEMS': return 'تجميع العناصر';
      case 'FAILED_VALIDATION': return 'فشل التحقق';
      case 'PENDING_REVIEW': return 'قيد المراجعة';
      case 'AUTO_CONFIRMED': return 'مؤكد تلقائياً';
      default: return status.toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <div className="font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الطلبات</h1>
          <p className="text-slate-500 mt-1">إدارة وإنشاء الطلبات.</p>
        </div>
        <button
          onClick={() => {
            setOrderError(null);
            setOrderSuccess(null);
            setOrderModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + إنشاء طلب يدوي
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">لا توجد طلبات.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-start font-semibold text-slate-900">رقم الطلب</th>
                  <th className="px-6 py-3 text-start font-semibold text-slate-900">التاريخ</th>
                  <th className="px-6 py-3 text-start font-semibold text-slate-900">العميل</th>
                  <th className="px-6 py-3 text-start font-semibold text-slate-900">العناصر</th>
                  <th className="px-6 py-3 text-start font-semibold text-slate-900">الحالة</th>
                  <th className="px-6 py-3 text-end font-semibold text-slate-900">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      #{order.order_number || "---"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{order.customer_name || "غير معروف"}</div>
                      {order.customer_phone && <div className="text-xs text-slate-500 mt-0.5" dir="ltr">{order.customer_phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-xs">
                      {order.items.length === 0 ? (
                        <span className="text-slate-400 italic">لا توجد عناصر</span>
                      ) : (
                        <ul className="list-disc list-inside space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              {item.quantity}x {item.name_snapshot}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                          order.status === 'GATHERING_ITEMS' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'FAILED_VALIDATION' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end font-medium text-slate-900 whitespace-nowrap">
                      {order.total != null ? `${Number(order.total).toFixed(2)} جنيه` : "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">إنشاء طلب</h3>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            {orderError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {orderError}
              </div>
            )}

            {orderSuccess ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl bg-green-50 border border-green-200 p-4 text-green-900">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <h4 className="font-bold">تم إنشاء الطلب!</h4>
                </div>
                <div className="text-sm space-y-1 text-green-800">
                  <p><strong>رقم الطلب:</strong> #{orderSuccess.order_number || "تلقائي"}</p>
                  <p><strong>المبلغ الإجمالي:</strong> {orderSuccess.total ?? orderSuccess.subtotal ?? 0} جنيه</p>
                </div>
                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    setOrderModalOpen(false);
                  }}
                  className="mt-2 w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-500"
                >
                  تم
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateManualOrder} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المنتج</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.price ? `(${p.price} جنيه)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium text-slate-800 mb-2">بيانات العميل (اختياري)</p>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="الاسم"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="رقم الهاتف"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-start"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="العنوان"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={orderLoading || !selectedProductId}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                  >
                    {orderLoading ? "جاري الإنشاء..." : "تأكيد الطلب"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
