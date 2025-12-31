"use client";
import { getSupabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StoreOrdersPage() {
    async function deleteOrder(orderId: string) {
      if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا الطلب نهائياً؟")) return;
      const res = await fetch("/api/store-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "حدث خطأ أثناء حذف الطلب!");
        return;
      }
      fetchOrders();
    }
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("store_orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  const [showDelivered, setShowDelivered] = React.useState(false);
  const notDelivered = orders.filter((o) => !o.is_delivered);
  const delivered = orders.filter((o) => o.is_delivered);

  async function markAsDelivered(orderId: string) {
    try {
      const res = await fetch("/api/store-orders/delivered", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "حدث خطأ أثناء تحديث حالة التسليم!");
        return;
      }
      fetchOrders();
    } catch (err) {
      alert("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] to-white py-10 px-2 md:px-0">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1a2332] text-center">طلبات الطلاب</h1>
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={showDelivered ? "outline" : "default"}
            className={showDelivered ? "border-[#d8a355] text-[#d8a355]" : "bg-[#d8a355] text-white"}
            onClick={() => setShowDelivered(false)}
          >
            الطلبات
          </Button>
          <Button
            variant={!showDelivered ? "outline" : "default"}
            className={!showDelivered ? "border-[#1a2332] text-[#1a2332]" : "bg-[#1a2332] text-white"}
            onClick={() => setShowDelivered(true)}
          >
            تم التسليم
          </Button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">جاري التحميل...</div>
        ) : showDelivered ? (
          delivered.length === 0 ? (
            <div className="text-center text-gray-400">لا توجد طلبات</div>
          ) : (
            <div className="grid gap-3">
              {delivered.map((order) => (
                <Card key={order.id} className="border border-[#D4AF37]/40 shadow-sm bg-[#f5f1e8] w-full max-w-full mx-auto">
                  <CardContent className="py-2 px-6 flex items-center">
                    <div className="flex flex-row items-center gap-4 w-full">
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-bold text-[#1a2332] text-lg text-left">{order.student_name}</span>
                        <span className="font-bold text-[#d8a355] text-lg text-left">{order.product_name}</span>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteOrder(order.id)} title="حذف الطلب نهائياً">
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          notDelivered.length === 0 ? (
            <div className="text-center text-gray-400">لا توجد طلبات</div>
          ) : (
            <div className="grid gap-3">
              {notDelivered.map((order) => (
                <Card key={order.id} className="border border-[#D4AF37]/40 shadow-sm bg-[#f5f1e8] w-full max-w-full mx-auto">
                  <CardContent className="py-2 px-6 flex items-center">
                    <div className="flex flex-row-reverse items-center gap-4 w-full">
                      <Button
                        size="icon"
                        className="bg-transparent hover:bg-transparent active:bg-transparent border-0 shadow-none flex items-center justify-center w-16 h-16 rounded transition-all duration-200 group"
                        onClick={() => markAsDelivered(order.id)}
                        title="اضغط لتأكيد التسليم"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="w-14 h-14">
                          <circle cx="20" cy="20" r="17" stroke="#22c55e" strokeWidth="2.5" fill="none" className="transition-colors duration-200 group-hover:stroke-[#15803d]" />
                          <path d="M13 21L18 26L27 15" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200 group-hover:stroke-[#15803d]" />
                        </svg>
                      </Button>
                      <div className="flex flex-col flex-1 items-start">
                        <span className="font-bold text-[#1a2332] text-lg text-left">{order.student_name}</span>
                        <span className="font-bold text-[#d8a355] text-lg text-left">{order.product_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
