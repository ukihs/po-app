import { c as createComponent, d as createAstro, m as maybeRenderHead, j as renderComponent, r as renderTemplate } from '../../chunks/astro/server_DSMDtA1y.mjs';
import 'kleur/colors';
import { H as Header } from '../../chunks/Header_D8ZfDF6F.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { b as auth, d as db } from '../../chunks/auth_BHth7sWR.mjs';
import { getDoc, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
export { renderers } from '../../renderers.mjs';

function OrderDetailPage({ orderId }) {
  const [order, setOrder] = useState(null);
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    const off = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        location.href = "/login";
        return;
      }
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        const prof = await getDoc(doc(db, "users", u.uid));
        const data = prof.data();
        if (data?.role) setRole(data.role);
      } catch (e) {
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
      location.href = "/orders/tracking";
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
        status: "ไม่อนุมัติ",
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
      location.href = "/orders/tracking";
    } catch (e) {
      console.error(e);
      alert(e.message || "ไม่อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "container py-6", children: "กำลังโหลด…" });
  if (err) return /* @__PURE__ */ jsxs("div", { className: "container py-6 text-rose-600", children: [
    "เกิดข้อผิดพลาด: ",
    err
  ] });
  if (!order) return /* @__PURE__ */ jsx("div", { className: "container py-6", children: "ไม่พบใบสั่งซื้อ" });
  const showStatus = (s) => s === "pending" || s === "รออนุมัติ" ? "รออนุมัติ" : s === "approved" || s === "อนุมัติแล้ว" ? "อนุมัติแล้ว" : s === "rejected" || s === "ไม่อนุมัติ" ? "ไม่อนุมัติ" : s === "in_progress" || s === "กำลังจัดซื้อ" ? "กำลังจัดซื้อ" : "รับของแล้ว";
  const isPending = ["pending", "รออนุมัติ"].includes(String(order.status));
  const canApprove = role === "supervisor" && isPending;
  return /* @__PURE__ */ jsxs("div", { className: "container py-8", children: [
    /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold", children: [
      "ใบสั่งซื้อ #",
      order.orderNo
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 mt-1", children: [
      "ผู้ขอซื้อ: ",
      order.requesterName,
      " • วันที่เอกสาร: ",
      order.date,
      " • สถานะ: ",
      showStatus(String(order.status))
    ] }),
    order.items?.length ? /* @__PURE__ */ jsx("div", { className: "mt-4 border rounded", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "ลำดับ" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "รายละเอียด" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "วันที่ต้องการ" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "จำนวน" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "รวม (บาท)" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: order.items.map((it, i) => /* @__PURE__ */ jsxs("tr", { className: "border-top", children: [
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: it.no ?? i + 1 }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: it.description }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: it.receivedDate }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: it.quantity }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: it.amount })
      ] }, it.no ?? i)) })
    ] }) }) : null,
    canApprove ? /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-8", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: approve, disabled: saving, className: "btn btn-success", children: [
        "✅ ",
        saving ? "กำลังอนุมัติ..." : "อนุมัติ"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: reject, disabled: saving, className: "btn btn-danger", children: [
        "❌ ",
        saving ? "กำลังทำรายการ..." : "ไม่อนุมัติ"
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-slate-500", children: "* หน้านี้เป็นมุมมองอ่านอย่างเดียวสำหรับสิทธิ์ของคุณ" })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`<html lang="th"> ${maybeRenderHead()}<body> ${renderComponent($$result, "Header", Header, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test02/po-app/src/components/po/Header", "client:component-export": "default" })} ${renderComponent($$result, "OrderDetailPage", OrderDetailPage, { "client:load": true, "orderId": id, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test02/po-app/src/components/po/OrderDetailPage", "client:component-export": "default" })} </body></html>`;
}, "C:/Projects/Astro/test02/po-app/src/pages/orders/[id].astro", void 0);

const $$file = "C:/Projects/Astro/test02/po-app/src/pages/orders/[id].astro";
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
