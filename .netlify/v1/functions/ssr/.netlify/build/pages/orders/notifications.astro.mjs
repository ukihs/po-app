import { c as createComponent, j as renderComponent, r as renderTemplate } from '../../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/MainLayout_4h8M94He.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { s as subscribeAuthAndRole, d as db } from '../../chunks/auth_BW0YqYLL.mjs';
import { query, collection, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Bell, ArrowRight, FileText, AlertCircle, CheckCircle } from 'lucide-react';
export { renderers } from '../../renderers.mjs';

const fmt = (ts) => {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
};
function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [role, setRole] = useState(null);
  const stopSnap = useRef(null);
  const stopAuth = useRef(null);
  useEffect(() => {
    stopAuth.current = subscribeAuthAndRole((user, userRole) => {
      if (stopSnap.current) {
        stopSnap.current();
        stopSnap.current = null;
      }
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      setRole(userRole);
      setLoading(true);
      setErr("");
      if (userRole === "buyer" || userRole === "supervisor") {
        const q = query(
          collection(db, "notifications"),
          where("toUserUid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        stopSnap.current = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setItems(rows);
            setLoading(false);
          },
          (e) => {
            console.error("notifications error:", e);
            setErr((e?.message || "").toString());
            setItems([]);
            setLoading(false);
          }
        );
      } else if (userRole === "procurement") {
        const personalQ = query(
          collection(db, "notifications"),
          where("toUserUid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const roleQ = query(
          collection(db, "notifications"),
          where("forRole", "==", "procurement"),
          orderBy("createdAt", "desc")
        );
        let personalNotifs = [];
        let roleNotifs = [];
        let loadedCount = 0;
        const combineAndSetNotifications = () => {
          if (loadedCount < 2) return;
          const allNotifs = [...personalNotifs, ...roleNotifs];
          const uniqueNotifs = allNotifs.filter(
            (notif, index, arr) => arr.findIndex((n) => n.id === notif.id) === index
          );
          uniqueNotifs.sort((a, b) => {
            if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          });
          setItems(uniqueNotifs);
          setLoading(false);
        };
        const unsubPersonal = onSnapshot(personalQ, (snap) => {
          personalNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loadedCount = Math.max(loadedCount, 1);
          combineAndSetNotifications();
        }, (e) => {
          console.error("personal notifications error:", e);
          setErr((e?.message || "").toString());
          setLoading(false);
        });
        const unsubRole = onSnapshot(roleQ, (snap) => {
          roleNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loadedCount = Math.max(loadedCount, 2);
          combineAndSetNotifications();
        }, (e) => {
          console.error("role notifications error:", e);
          setErr((e?.message || "").toString());
          setLoading(false);
        });
        stopSnap.current = () => {
          unsubPersonal();
          unsubRole();
        };
      } else {
        setItems([]);
        setLoading(false);
        return;
      }
    });
    return () => {
      if (stopSnap.current) stopSnap.current();
      if (stopAuth.current) stopAuth.current();
      stopSnap.current = null;
      stopAuth.current = null;
    };
  }, []);
  const markReadAndGo = async (n) => {
    try {
      if (!n.read) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
      if (role === "buyer") {
        window.location.href = "/orders/tracking";
      } else if (role === "supervisor") {
        window.location.href = "/orders/tracking";
      } else if (role === "procurement") {
        window.location.href = "/orders/list";
      }
    } catch (e) {
      console.error(e);
      if (role === "buyer") {
        window.location.href = "/orders/tracking";
      } else {
        window.location.href = "/orders/list";
      }
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "px-4 py-8", children: "กำลังโหลดแจ้งเตือน..." });
  if (err && /requires an index/i.test(err)) {
    return /* @__PURE__ */ jsxs("div", { className: "px-4 py-8 text-rose-700 text-sm", children: [
      "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      /* @__PURE__ */ jsx("br", {}),
      err,
      /* @__PURE__ */ jsx("br", {}),
      "ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง"
    ] });
  }
  if (!items.length) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Bell, { className: "w-12 h-12 text-gray-400" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "ยังไม่มีการแจ้งเตือน" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "การแจ้งเตือนต่างๆ จะแสดงที่นี่" })
    ] }) });
  }
  const getNotificationIcon = (kind) => {
    switch (kind) {
      case "approved":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-success" });
      case "rejected":
        return /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-error" });
      case "status_update":
        return /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-info" });
      default:
        return /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-warning" });
    }
  };
  const getNotificationColor = (kind, read) => {
    if (read) return "border-gray-200 bg-white";
    switch (kind) {
      case "approved":
        return "border-green-400 bg-white";
      case "rejected":
        return "border-red-400 bg-white";
      case "status_update":
        return "border-blue-400 bg-white";
      default:
        return "border-yellow-400 bg-white";
    }
  };
  const getRoleDisplayName = (role2) => {
    switch (role2) {
      case "buyer":
        return "ผู้ขอซื้อ";
      case "supervisor":
        return "หัวหน้างาน";
      case "procurement":
        return "ฝ่ายจัดซื้อ";
      default:
        return role2;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "ข้อความแจ้งเตือนระบบ" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [
        "แจ้งเตือนสำหรับ",
        getRoleDisplayName(role || "")
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: items.map((n) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `card border-l-4 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 ${getNotificationColor(n.kind, n.read)}`,
        onClick: () => markReadAndGo(n),
        children: /* @__PURE__ */ jsx("div", { className: "card-body p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 mt-1", children: getNotificationIcon(n.kind) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-primary", children: [
                  "เลขที่: ",
                  n.orderNo ? `#${n.orderNo}` : "N/A"
                ] }),
                !n.read && /* @__PURE__ */ jsx("span", { className: "badge badge-xs badge-primary", children: "ใหม่" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 mb-2", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "จาก: ",
                  n.fromUserName || "ระบบ"
                ] }),
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: getRoleDisplayName(role || "") })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: `font-medium mb-1 ${!n.read ? "text-gray-900" : "text-gray-700"}`, children: n.title }),
              n.message && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-2", children: n.message })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 text-right", children: /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: fmt(n.createdAt) }) })
          ] }) })
        ] }) })
      },
      n.id
    )) })
  ] });
}

const $$Notifications = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "NotificationsPage", NotificationsPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/NotificationsPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/test03/po-app/src/pages/orders/notifications.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/orders/notifications.astro";
const $$url = "/orders/notifications";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Notifications,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
