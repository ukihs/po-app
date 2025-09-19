import { c as createComponent, j as renderComponent, r as renderTemplate } from '../../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/MainLayout_pePT6WsK.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import React, { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, d as db } from '../../chunks/auth_BW0YqYLL.mjs';
import { getDoc, doc, query, collection, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronDown, ChevronRight } from 'lucide-react';
export { renderers } from '../../renderers.mjs';

const ITEM_CATEGORIES = ["วัตถุดิบ", "Software", "เครื่องมือ", "วัสดุสิ้นเปลือง"];
const ORDER_STATUS_OPTIONS = [
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "delivered", label: "ได้รับแล้ว" }
];
const STATUS_TH = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  in_progress: "กำลังดำเนินการ",
  delivered: "ได้รับแล้ว"
};
const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  in_progress: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800"
};
const ITEM_STATUS_G1 = ["จัดซื้อ", "ของมาส่ง", "ส่งมอบของ", "สินค้าเข้าคลัง"];
const ITEM_STATUS_G2 = ["จัดซื้อ", "ของมาส่ง", "ส่งมอบของ"];
const getItemStatusOptions = (category) => category === "วัตถุดิบ" ? ITEM_STATUS_G1 : ITEM_STATUS_G2;
const fmtTS = (ts) => ts?.toDate ? ts.toDate().toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState({});
  const [processingKeys, setProcessingKeys] = useState(/* @__PURE__ */ new Set());
  const [drafts, setDrafts] = useState({});
  useEffect(() => {
    let unsub;
    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) {
        window.location.href = "/login";
        return;
      }
      setUser(authUser);
      let effective = r || localStorage.getItem("role") || null;
      if (!effective) {
        try {
          const u = await getDoc(doc(db, "users", authUser.uid));
          if (u.exists()) effective = u.data()?.role ?? null;
        } catch {
        }
      }
      setRole(effective);
      unsub?.();
      const qRef = query(collection(db, "orders"));
      unsub = onSnapshot(
        qRef,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => {
            const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
          });
          setOrders(list);
          setErr("");
          setLoading(false);
        },
        (e) => {
          setErr(String(e?.message || e));
          setLoading(false);
        }
      );
    });
    return () => {
      unsub?.();
      off?.();
    };
  }, []);
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const getItemValue = (o, idx) => {
    const d = drafts[o.id]?.[idx] || {};
    const mapCat = o.itemsCategories?.[String(idx)];
    const mapSt = o.itemsStatuses?.[String(idx)];
    const item = (o.items || [])[idx] || {};
    return {
      category: d.category ?? item.category ?? mapCat ?? "",
      itemStatus: d.itemStatus ?? item.itemStatus ?? mapSt ?? ""
    };
  };
  const setDraft = (orderId, idx, patch) => {
    setDrafts((prev) => {
      const cur = { ...prev[orderId]?.[idx] || {} };
      const next = { ...cur, ...patch };
      return { ...prev, [orderId]: { ...prev[orderId] || {}, [idx]: next } };
    });
  };
  const saveOneItem = async (o, idx) => {
    const val = getItemValue(o, idx);
    if (!val.category && !val.itemStatus) {
      alert("ยังไม่ได้เลือกประเภท/สถานะ");
      return;
    }
    const key = `${o.id}:${idx}`;
    try {
      setProcessingKeys((s) => new Set(s).add(key));
      const ref = doc(db, "orders", o.id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const items = Array.isArray(data.items) ? [...data.items] : [];
      items[idx] = { ...items[idx] || {}, category: val.category, itemStatus: val.itemStatus };
      const itemsCategories = { ...data.itemsCategories || {} };
      const itemsStatuses = { ...data.itemsStatuses || {} };
      itemsCategories[String(idx)] = val.category;
      itemsStatuses[String(idx)] = val.itemStatus;
      await updateDoc(ref, {
        items,
        itemsCategories,
        itemsStatuses,
        updatedAt: serverTimestamp()
      });
      setDrafts((prev) => {
        const forOrder = { ...prev[o.id] || {} };
        delete forOrder[idx];
        return { ...prev, [o.id]: forOrder };
      });
      alert("บันทึกสำเร็จ");
    } catch (e) {
      console.error(e);
      alert(`บันทึกไม่สำเร็จ: ${e?.message || e}`);
    } finally {
      setProcessingKeys((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  };
  const saveOrderStatus = async (o, next) => {
    const key = o.id;
    try {
      setProcessingKeys((s) => new Set(s).add(key));
      await updateDoc(doc(db, "orders", o.id), {
        status: next,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert(`อัปเดตสถานะใบไม่สำเร็จ: ${e?.message || e}`);
    } finally {
      setProcessingKeys((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "loading loading-spinner loading-lg" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 text-gray-600", children: "กำลังโหลดข้อมูล…" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
    err && /* @__PURE__ */ jsx("div", { className: "alert alert-error mb-4", children: err }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow border border-gray-200 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-semibold", children: "รายการใบสั่งซื้อ" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: role === "procurement" ? "สำหรับฝ่ายจัดซื้อ – เปลี่ยนสถานะใบ + จัดประเภท/สถานะของแต่ละรายการ" : role === "supervisor" ? "สำหรับหัวหน้างาน – ดูรายการใบสั่งซื้อทั้งหมด" : "รายการใบสั่งซื้อทั้งหมด" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 bg-slate-50 border rounded px-2 py-1", children: [
          "User: ",
          user?.email || user?.uid,
          " | Role: ",
          role || "unknown",
          " | Orders: ",
          orders.length
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border rounded-2xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-50/80", children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-600", children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "#" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "วันที่" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "ผู้ขอ" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "ยอดรวม" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "สถานะใบ" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "การดำเนินการ" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: orders.map((o) => {
          const isOpen = !!expanded[o.id];
          const total = o.totalAmount ?? o.total ?? 0;
          return /* @__PURE__ */ jsxs(React.Fragment, { children: [
            /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-1 hover:underline", onClick: () => toggle(o.id), children: [
                isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }),
                "#",
                o.orderNo ?? "-"
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: o.date || fmtTS(o.createdAt) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: o.requesterName || o.requester || "-" }),
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right tabular-nums", children: [
                total.toLocaleString("th-TH"),
                " บาท"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[o.status]}`, children: STATUS_TH[o.status] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: role === "procurement" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    className: "select select-sm select-bordered rounded-xl min-w-[180px]",
                    value: o.status,
                    onChange: (e) => saveOrderStatus(o, e.target.value),
                    disabled: processingKeys.has(o.id),
                    children: ORDER_STATUS_OPTIONS.map((x) => /* @__PURE__ */ jsx("option", { value: x.value, children: x.label }, x.value))
                  }
                ),
                processingKeys.has(o.id) && /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-xs" })
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "—" }) })
            ] }),
            isOpen && /* @__PURE__ */ jsx("tr", { className: "bg-gray-50/60", children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 pb-5", children: /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm font-semibold text-gray-700", children: "รายการสินค้า" }),
              /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-slate-50", children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-slate-600", children: [
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "#" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "รายการ" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "จำนวน" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "ราคา/หน่วย" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "รวม" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2 w-[220px]", children: "ประเภทสินค้า" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2 w-[220px]", children: "สถานะรายการ" }),
                  role === "procurement" && /* @__PURE__ */ jsx("th", { className: "px-4 py-2 w-[120px] text-right", children: "บันทึก" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: (o.items || []).map((it, idx) => {
                  const val = getItemValue(o, idx);
                  const options = getItemStatusOptions(val.category);
                  return /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: idx + 1 }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: it.description || "-" }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: it.quantity ?? "-" }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: it.amount != null ? Number(it.amount).toLocaleString("th-TH") : "-" }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-medium", children: it.lineTotal != null ? Number(it.lineTotal).toLocaleString("th-TH") : "-" }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: role === "procurement" ? /* @__PURE__ */ jsxs(
                      "select",
                      {
                        className: "select select-sm select-bordered rounded-lg w-full",
                        value: val.category,
                        onChange: (e) => setDraft(o.id, idx, { category: e.target.value }),
                        disabled: processingKeys.has(`${o.id}:${idx}`),
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "เลือกประเภท…" }),
                          ITEM_CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
                        ]
                      }
                    ) : /* @__PURE__ */ jsx("span", { className: `inline-block px-2 py-1 rounded-full text-xs font-medium ${val.category ? "bg-gray-100 text-gray-800" : "bg-gray-50 text-gray-500"}`, children: val.category || "ยังไม่ระบุ" }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: role === "procurement" ? /* @__PURE__ */ jsxs(
                      "select",
                      {
                        className: "select select-sm select-bordered rounded-lg w-full",
                        value: val.itemStatus,
                        onChange: (e) => setDraft(o.id, idx, { itemStatus: e.target.value }),
                        disabled: processingKeys.has(`${o.id}:${idx}`),
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "เลือกสถานะ…" }),
                          options.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s))
                        ]
                      }
                    ) : /* @__PURE__ */ jsx("span", { className: `inline-block px-2 py-1 rounded-full text-xs font-medium ${val.itemStatus ? "bg-blue-100 text-blue-800" : "bg-gray-50 text-gray-500"}`, children: val.itemStatus || "รอดำเนินการ" }) }),
                    role === "procurement" && /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right", children: /* @__PURE__ */ jsxs(
                      "button",
                      {
                        className: "btn btn-sm btn-primary rounded-lg",
                        onClick: () => saveOneItem(o, idx),
                        disabled: processingKeys.has(`${o.id}:${idx}`),
                        children: [
                          processingKeys.has(`${o.id}:${idx}`) && /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-xs mr-1" }),
                          "บันทึก"
                        ]
                      }
                    ) })
                  ] }, idx);
                }) })
              ] }) })
            ] }) }) })
          ] }, o.id);
        }) })
      ] }) })
    ] }) })
  ] });
}

const $$List = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E1A\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "OrdersListPage", OrdersListPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/OrdersListPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/test03/po-app/src/pages/orders/list.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/orders/list.astro";
const $$url = "/orders/list";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$List,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
