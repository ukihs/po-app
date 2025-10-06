import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/card_B5xjbdkK.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, d as db } from '../../chunks/auth_DhMUJu7S.mjs';
import { getDoc, doc, query, collection, onSnapshot } from 'firebase/firestore';
import { Loader2, FileText } from 'lucide-react';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_BOUC14Bs.mjs';
import { E as Empty, a as EmptyHeader, b as EmptyMedia, c as EmptyTitle, d as EmptyDescription } from '../../chunks/empty_DTMsjQQh.mjs';
import { O as OrdersDataTable } from '../../chunks/OrdersDataTable_Cv--COSW.mjs';
export { renderers } from '../../renderers.mjs';

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
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full py-10 text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto text-primary" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 text-muted-foreground", children: "กำลังโหลดข้อมูล…" })
    ] });
  }
  if (orders.length === 0 && !loading) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      err && /* @__PURE__ */ jsx(Alert, { className: "mb-4", variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: err }) }),
      /* @__PURE__ */ jsx(Empty, { children: /* @__PURE__ */ jsxs(EmptyHeader, { children: [
        /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsx(EmptyTitle, { children: "ยังไม่มีใบขอซื้อ" }),
        /* @__PURE__ */ jsx(EmptyDescription, { children: "ขณะนี้ยังไม่มีใบขอซื้อใดๆ ในระบบ" })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    err && /* @__PURE__ */ jsx(Alert, { className: "mb-4", variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: err }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("h1", { className: "text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3", children: [
      /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-primary" }),
      "รายการใบขอซื้อ"
    ] }) }),
    /* @__PURE__ */ jsx(
      OrdersDataTable,
      {
        data: orders,
        loading,
        onViewOrder: (order) => window.open(`/orders/${order.id}`, "_blank"),
        onDeleteOrder: () => {
        }
      }
    )
  ] });
}

const $$List = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E1A\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "OrdersListPage", OrdersListPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/OrdersListPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/Bederly/po-app/src/pages/orders/list.astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/orders/list.astro";
const $$url = "/orders/list";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$List,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
