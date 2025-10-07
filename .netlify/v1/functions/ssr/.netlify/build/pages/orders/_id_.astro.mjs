import { d as createComponent, e as createAstro, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import { u as useAuth, C as Card, q as CardContent, B as Badge, a as CardHeader, t as CardTitle, $ as $$MainLayout } from '../../chunks/card_CWIk3thL.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { B as Button, d as db, f as auth } from '../../chunks/auth_B6D8HlLm.mjs';
import { getDoc, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_D95jMiPk.mjs';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_X172b6ty.mjs';
import { Loader2, FileText, User, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { T as Toaster } from '../../chunks/sonner_4c1KhDZa.mjs';
import { a as COLLECTIONS } from '../../chunks/constants_DBA-19QZ.mjs';
export { renderers } from '../../renderers.mjs';

function OrderDetailPage({ orderId }) {
  const { user, role, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!user || !role || authLoading) return;
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
        setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [user, role, authLoading, orderId]);
  const approve = async () => {
    if (!order?.id || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, order.id), {
        status: "approved",
        approvedByUid: auth.currentUser?.uid || null,
        approvedAt: serverTimestamp()
      });
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        toUserUid: order.requesterUid,
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อได้รับการอนุมัติ",
        message: `ใบสั่งซื้อ #${order.orderNo} ได้รับการอนุมัติแล้ว`,
        kind: "approved",
        fromUserUid: auth.currentUser?.uid || "",
        fromUserName: auth.currentUser?.displayName || "หัวหน้างาน",
        read: false,
        createdAt: serverTimestamp()
      });
      try {
        const poApi = await import('../../chunks/poApi_gIBNPYkU.mjs');
        await poApi.createNotification({
          title: "มีใบสั่งซื้อใหม่ที่ได้รับการอนุมัติ",
          message: `ใบสั่งซื้อ #${order.orderNo} โดย ${order.requesterName} ได้รับการอนุมัติแล้ว กรุณาดำเนินการจัดซื้อ`,
          orderId: order.id,
          orderNo: order.orderNo,
          kind: "status_update",
          forRole: "procurement",
          fromUserName: auth.currentUser?.displayName || "หัวหน้างาน"
        });
      } catch (procurementNotifError) {
        console.error("Failed to send procurement notification:", procurementNotifError);
      }
      toast.success("อนุมัติเรียบร้อย");
      window.location.href = "/orders/list";
    } catch (e) {
      console.error(e);
      toast.error(e.message || "อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  const reject = async () => {
    if (!order?.id || saving) return;
    const reason = prompt("เหตุผลการไม่อนุมัติ (ใส่หรือเว้นว่างก็ได้)") || "";
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, order.id), {
        status: "rejected",
        rejectedByUid: auth.currentUser?.uid || null,
        rejectedAt: serverTimestamp(),
        rejectReason: reason
      });
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        toUserUid: order.requesterUid,
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อไม่ได้รับการอนุมัติ",
        message: `ใบสั่งซื้อ #${order.orderNo} ไม่ได้รับการอนุมัติ${reason ? ` (เหตุผล: ${reason})` : ""}`,
        kind: "rejected",
        fromUserUid: auth.currentUser?.uid || "",
        fromUserName: auth.currentUser?.displayName || "หัวหน้างาน",
        read: false,
        createdAt: serverTimestamp()
      });
      toast.success("ทำรายการไม่อนุมัติแล้ว");
      window.location.href = "/orders/list";
    } catch (e) {
      console.error(e);
      toast.error(e.message || "ไม่อนุมัติไม่สำเร็จ");
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
  if (authLoading || loading) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full py-10 text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 text-muted-foreground", children: "กำลังโหลดข้อมูล..." })
    ] });
  }
  if (!user || !role) {
    return /* @__PURE__ */ jsx("div", { className: "w-full py-10 text-center", children: /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: "กรุณาเข้าสู่ระบบ" }) }) });
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
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsxs("div", { className: "mb-4 sm:mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-6 w-6 sm:h-8 sm:w-8 text-[#2b9ccc]" }),
        "ใบสั่งซื้อ #",
        order.orderNo
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base text-muted-foreground", children: "รายละเอียดใบสั่งซื้อ" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2", children: [
          /* @__PURE__ */ jsx(User, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm font-medium", children: "ผู้ขอซื้อ" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm sm:text-base", children: order.requesterName })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm font-medium", children: "วันที่เอกสาร" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm sm:text-base", children: order.date })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm font-medium", children: "ยอดรวม" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-sm sm:text-base", children: [
          (order.totalAmount || order.total || 0).toLocaleString("th-TH"),
          " บาท"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm font-medium", children: "สถานะ" })
        ] }),
        /* @__PURE__ */ jsx(Badge, { className: `${statusInfo.className} text-xs sm:text-sm`, children: statusInfo.text })
      ] }) })
    ] }),
    order.items?.length ? /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base sm:text-lg", children: [
        "รายการสินค้า (",
        order.items.length,
        " รายการ)"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { className: "min-w-[600px]", children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "ลำดับ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "รายละเอียด" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "วันที่ต้องการ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right text-xs sm:text-sm", children: "จำนวน" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right text-xs sm:text-sm", children: "ราคา/หน่วย" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right text-xs sm:text-sm", children: "รวม (บาท)" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: order.items.map((item, index) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium text-xs sm:text-sm", children: item.no ?? index + 1 }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: item.description }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: item.receivedDate || "-" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right text-xs sm:text-sm", children: item.quantity?.toLocaleString("th-TH") }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right text-xs sm:text-sm", children: item.amount?.toLocaleString("th-TH") }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right font-medium text-xs sm:text-sm", children: item.lineTotal?.toLocaleString("th-TH") || item.amount?.toLocaleString("th-TH") })
        ] }, item.no ?? index)) })
      ] }) }) })
    ] }) : null,
    canApprove ? /* @__PURE__ */ jsxs("div", { className: "mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: approve,
          disabled: saving,
          className: "bg-green-600 hover:bg-green-700 w-full sm:w-auto",
          children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-2" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "กำลังอนุมัติ..." }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "กำลังอนุมัติ..." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" }),
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
          className: "w-full sm:w-auto",
          children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-2" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "กำลังทำรายการ..." }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "กำลังทำรายการ..." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(XCircle, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" }),
            "ไม่อนุมัติ"
          ] })
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "mt-4 sm:mt-6", children: /* @__PURE__ */ jsx(Alert, { children: /* @__PURE__ */ jsx(AlertDescription, { className: "text-xs sm:text-sm", children: "หน้านี้เป็นมุมมองอ่านอย่างเดียวสำหรับสิทธิ์ของคุณ" }) }) })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "OrderDetailPage", OrderDetailPage, { "client:load": true, "orderId": id || "", "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/OrderDetailPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/Bederly/po-app/src/pages/orders/[id].astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/orders/[id].astro";
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
