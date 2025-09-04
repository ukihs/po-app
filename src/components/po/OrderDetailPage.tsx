import React, { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  doc, getDoc, updateDoc, collection, addDoc, serverTimestamp
} from "firebase/firestore";

type Status = "pending"|"approved"|"rejected"|"in_progress"|"delivered";
type UserRole = "buyer" | "supervisor" | "procurement" | "admin";

type Order = {
  id?: string;
  orderNo: string;
  date: string;
  requesterName: string;
  grandTotal?: number;
  items?: any[];
  status: Status | string; // เผื่อกรณีเก็บเป็นภาษาไทย
};

export default function OrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [role, setRole]   = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const off = auth.onAuthStateChanged(async (u) => {
      if (!u) { location.href = "/login"; return; }
      try {
        // โหลดคำสั่งซื้อ
        const snap = await getDoc(doc(db, "orders", orderId));
        setOrder(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
        // โหลด role
        const prof = await getDoc(doc(db, "users", u.uid));
        const data = prof.data() as any | undefined;
        if (data?.role) setRole(data.role as UserRole);
      } catch (e:any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    });
    return off;
  }, [orderId]);

  const approve = async () => {
    if (!order?.id || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "อนุมัติแล้ว",
        approvedByUid: auth.currentUser?.uid || null,
        approvedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        toRole: "procurement",
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อได้รับอนุมัติ",
        message: `#${order.orderNo} โดย ${order.requesterName}`,
        kind: "approved",
        read: false,
        createdAt: serverTimestamp(),
      });
      alert("อนุมัติเรียบร้อย");
      location.href = "/orders/tracking";
    } catch (e:any) {
      console.error(e);
      alert(e.message || "อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!order?.id || saving) return;
    const reason = prompt("เหตุผลการไม่อนุมัติ (ใส่หรือเว้นว่างก็ได้)") || "";
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "ไม่อนุมัติ",
        rejectedByUid: auth.currentUser?.uid || null,
        rejectedAt: serverTimestamp(),
        rejectReason: reason,
      });
      await addDoc(collection(db, "notifications"), {
        toRole: "procurement",
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อไม่ได้รับอนุมัติ",
        message: `#${order.orderNo} โดย ${order.requesterName}${reason ? ` (เหตุผล: ${reason})` : ""}`,
        kind: "rejected",
        read: false,
        createdAt: serverTimestamp(),
      });
      alert("ทำรายการไม่อนุมัติแล้ว");
      location.href = "/orders/tracking";
    } catch (e:any) {
      console.error(e);
      alert(e.message || "ไม่อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-6">กำลังโหลด…</div>;
  if (err)     return <div className="container py-6 text-rose-600">เกิดข้อผิดพลาด: {err}</div>;
  if (!order)  return <div className="container py-6">ไม่พบใบสั่งซื้อ</div>;

  const showStatus = (s: string) =>
    s === "pending" || s === "รออนุมัติ" ? "รออนุมัติ" :
    s === "approved" || s === "อนุมัติแล้ว" ? "อนุมัติแล้ว" :
    s === "rejected" || s === "ไม่อนุมัติ" ? "ไม่อนุมัติ" :
    s === "in_progress" || s === "กำลังจัดซื้อ" ? "กำลังจัดซื้อ" :
    "รับของแล้ว";

  const isPending = ["pending", "รออนุมัติ"].includes(String(order.status));
  const canApprove = role === 'supervisor' && isPending;

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold">ใบสั่งซื้อ #{order.orderNo}</h2>
      <p className="text-sm text-slate-600 mt-1">
        ผู้ขอซื้อ: {order.requesterName} • วันที่เอกสาร: {order.date} • สถานะ: {showStatus(String(order.status))}
      </p>

      {order.items?.length ? (
        <div className="mt-4 border rounded">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">ลำดับ</th>
                <th className="px-3 py-2 text-left">รายละเอียด</th>
                <th className="px-3 py-2 text-left">วันที่ต้องการ</th>
                <th className="px-3 py-2 text-right">จำนวน</th>
                <th className="px-3 py-2 text-right">รวม (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it: any, i: number) => (
                <tr key={it.no ?? i} className="border-top">
                  <td className="px-3 py-2">{it.no ?? i + 1}</td>
                  <td className="px-3 py-2">{it.description}</td>
                  <td className="px-3 py-2">{it.receivedDate}</td>
                  <td className="px-3 py-2 text-right">{it.quantity}</td>
                  <td className="px-3 py-2 text-right">{it.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {canApprove ? (
        <div className="mt-4 flex gap-8">
          <button type="button" onClick={approve} disabled={saving} className="btn btn-success">
            ✅ {saving ? "กำลังอนุมัติ..." : "อนุมัติ"}
          </button>
          <button type="button" onClick={reject} disabled={saving} className="btn btn-danger">
            ❌ {saving ? "กำลังทำรายการ..." : "ไม่อนุมัติ"}
          </button>
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-500">
          * หน้านี้เป็นมุมมองอ่านอย่างเดียวสำหรับสิทธิ์ของคุณ
        </div>
      )}
    </div>
  );
}
