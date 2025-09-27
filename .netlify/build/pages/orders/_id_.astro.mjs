import { d as createComponent, e as createAstro, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_BkuRanWd.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/MainLayout_h4H-Ivtp.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, i as db, C as Card, c as CardContent, a as CardHeader, b as CardTitle, B as Button, h as auth } from '../../chunks/card_DPKHX6pj.mjs';
import { getDoc, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { B as Badge } from '../../chunks/badge_CZCfTozJ.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_Bdv0yE5d.mjs';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_B7UI7IZ0.mjs';
import { Loader2, FileText, User, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
export { renderers } from '../../renderers.mjs';

function OrderDetailPage({ orderId }) {
  const [order, setOrder] = useState(null);
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) {
        window.location.href = "/login";
        return;
      }
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        let effective = r || "buyer";
        if (!effective) {
          try {
            const prof = await getDoc(doc(db, "users", authUser.uid));
            if (prof.exists()) {
              effective = prof.data()?.role ?? "buyer";
            }
          } catch {
          }
        }
        setRole(effective);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    });
    return () => {
      off?.();
    };
  }, [orderId]);
  const approve = async () => {
    if (!order?.id || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "approved",
        approvedByUid: auth.currentUser?.uid || null,
        approvedAt: serverTimestamp()
      });
      await addDoc(collection(db, "notifications"), {
        toRole: "procurement",
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อได้รับอนุมัติ",
        message: `#${order.orderNo} โดย ${order.requesterName}`,
        kind: "approved",
        read: false,
        createdAt: serverTimestamp()
      });
      alert("อนุมัติเรียบร้อย");
      window.location.href = "/orders/list";
    } catch (e) {
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
        status: "rejected",
        rejectedByUid: auth.currentUser?.uid || null,
        rejectedAt: serverTimestamp(),
        rejectReason: reason
      });
      await addDoc(collection(db, "notifications"), {
        toRole: "procurement",
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อไม่ได้รับอนุมัติ",
        message: `#${order.orderNo} โดย ${order.requesterName}${reason ? ` (เหตุผล: ${reason})` : ""}`,
        kind: "rejected",
        read: false,
        createdAt: serverTimestamp()
      });
      alert("ทำรายการไม่อนุมัติแล้ว");
      window.location.href = "/orders/list";
    } catch (e) {
      console.error(e);
      alert(e.message || "ไม่อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  const getStatusInfo = (status) => {
    const statusMap = {
      "pending": { text: "รออนุมัติ", className: "bg-yellow-100 text-yellow-800" },
      "approved": { text: "อนุมัติแล้ว", className: "bg-green-100 text-green-800" },
      "rejected": { text: "ไม่อนุมัติ", className: "bg-red-100 text-red-800" },
      "in_progress": { text: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-800" },
      "delivered": { text: "ได้รับแล้ว", className: "bg-purple-100 text-purple-800" }
    };
    return statusMap[status] || { text: status, className: "bg-gray-100 text-gray-800" };
  };
  const isPending = order?.status === "pending";
  const canApprove = role === "supervisor" && isPending;
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full py-10 text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 text-muted-foreground", children: "กำลังโหลดข้อมูล..." })
    ] });
  }
  if (err) {
    return /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsxs(AlertDescription, { children: [
      "เกิดข้อผิดพลาด: ",
      err
    ] }) });
  }
  if (!order) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center p-12", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "ไม่พบใบสั่งซื้อ" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "ไม่พบข้อมูลใบสั่งซื้อที่ต้องการ" })
    ] });
  }
  const statusInfo = getStatusInfo(String(order.status));
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-2 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-8 w-8 text-[#2b9ccc]" }),
        "ใบสั่งซื้อ #",
        order.orderNo
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "รายละเอียดใบสั่งซื้อ" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "ผู้ขอซื้อ" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: order.requesterName })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "วันที่เอกสาร" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: order.date })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "ยอดรวม" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
          (order.totalAmount || order.grandTotal || 0).toLocaleString("th-TH"),
          " บาท"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "สถานะ" })
        ] }),
        /* @__PURE__ */ jsx(Badge, { className: statusInfo.className, children: statusInfo.text })
      ] }) })
    ] }),
    order.items?.length ? /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
        "รายการสินค้า (",
        order.items.length,
        " รายการ)"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "ลำดับ" }),
          /* @__PURE__ */ jsx(TableHead, { children: "รายละเอียด" }),
          /* @__PURE__ */ jsx(TableHead, { children: "วันที่ต้องการ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "จำนวน" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "ราคา/หน่วย" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "รวม (บาท)" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: order.items.map((item, index) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: item.no ?? index + 1 }),
          /* @__PURE__ */ jsx(TableCell, { children: item.description }),
          /* @__PURE__ */ jsx(TableCell, { children: item.receivedDate || "-" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: item.quantity?.toLocaleString("th-TH") }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: item.amount?.toLocaleString("th-TH") }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right font-medium", children: item.lineTotal?.toLocaleString("th-TH") || item.amount?.toLocaleString("th-TH") })
        ] }, item.no ?? index)) })
      ] }) }) })
    ] }) : null,
    canApprove ? /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-4", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: approve,
          disabled: saving,
          className: "bg-green-600 hover:bg-green-700",
          children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" }),
            "กำลังอนุมัติ..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 mr-2" }),
            "อนุมัติ"
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: reject,
          disabled: saving,
          variant: "destructive",
          children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" }),
            "กำลังทำรายการ..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 mr-2" }),
            "ไม่อนุมัติ"
          ] })
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(Alert, { children: /* @__PURE__ */ jsx(AlertDescription, { children: "หน้านี้เป็นมุมมองอ่านอย่างเดียวสำหรับสิทธิ์ของคุณ" }) }) })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "OrderDetailPage", OrderDetailPage, { "client:load": true, "orderId": id || "", "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/OrderDetailPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/test03/po-app/src/pages/orders/[id].astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/orders/[id].astro";
const $$url = "/orders/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
