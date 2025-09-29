import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import { C as Card, a as CardContent, $ as $$MainLayout } from '../../chunks/card_HxY4Emac.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useRef, useEffect, useMemo } from 'react';
import { s as subscribeAuthAndRole, f as db, B as Button, I as Input } from '../../chunks/input_CuwRcyyb.mjs';
import { query, collection, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { RefreshCw, AlertTriangle, Bell, CheckCheck, Search, Filter, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { B as Badge } from '../../chunks/badge_B56HWNP0.mjs';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_DVins7mI.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_DMNDlMRd.mjs';
export { renderers } from '../../renderers.mjs';

const fmt = (ts) => {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
};
const getRoleDisplayName = (role) => {
  switch (role) {
    case "buyer":
      return "ผู้ขอซื้อ";
    case "supervisor":
      return "หัวหน้างาน";
    case "procurement":
      return "ฝ่ายจัดซื้อ";
    default:
      return role;
  }
};
function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [role, setRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.message?.toLowerCase().includes(searchTerm.toLowerCase()) || item.orderNo?.toString().includes(searchTerm) || item.fromUserName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || item.kind === filterType;
      return matchesSearch && matchesType;
    });
    filtered.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      if (sortBy === "newest") {
        return timeB - timeA;
      } else if (sortBy === "oldest") {
        return timeA - timeB;
      } else if (sortBy === "unread") {
        if (a.read === b.read) return timeB - timeA;
        return a.read ? 1 : -1;
      }
      return timeB - timeA;
    });
    return filtered;
  }, [items, searchTerm, filterType, sortBy]);
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);
  const unreadCount = items.filter((item) => !item.read).length;
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
  const markAllAsRead = async () => {
    try {
      const unreadItems = items.filter((item) => !item.read);
      const promises = unreadItems.map(
        (item) => updateDoc(doc(db, "notifications", item.id), { read: true })
      );
      await Promise.all(promises);
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage));
    setCurrentPage(1);
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "กำลังโหลดแจ้งเตือน..." })
    ] }) });
  }
  if (err && /requires an index/i.test(err)) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold", children: "เกิดข้อผิดพลาดในการโหลดข้อมูล" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm mt-2", children: [
          err,
          /* @__PURE__ */ jsx("br", {}),
          "ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง"
        ] })
      ] })
    ] }) });
  }
  if (!items.length) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Bell, { className: "w-8 h-8 text-primary" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "ข้อความแจ้งเตือน" })
        ] }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ",
          getRoleDisplayName(role || "")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Bell, { className: "w-12 h-12 text-primary" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3", children: "ยังไม่มีการแจ้งเตือน" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-md mx-auto", children: "การแจ้งเตือนต่างๆ เกี่ยวกับการอนุมัติใบขอซื้อและอัปเดตสถานะจะแสดงที่นี่" })
      ] })
    ] });
  }
  if (!filteredAndSortedItems.length && items.length > 0) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Bell, { className: "w-8 h-8 text-primary" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "ข้อความแจ้งเตือน" }),
              unreadCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "primary", appearance: "light", className: "mt-1", children: [
                unreadCount,
                " รายการใหม่"
              ] })
            ] })
          ] }),
          unreadCount > 0 && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: markAllAsRead,
              children: [
                /* @__PURE__ */ jsx(CheckCheck, { className: "w-4 h-4 mr-2" }),
                "อ่านทั้งหมด"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ",
          getRoleDisplayName(role || "")
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mb-6 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "ค้นหาการแจ้งเตือน...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "pl-10"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [
          /* @__PURE__ */ jsxs(SelectTrigger, { className: "w-full sm:w-auto", children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx(SelectValue, { placeholder: "กรองตามประเภท" })
          ] }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "ทั้งหมด" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "อนุมัติแล้ว" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "ไม่อนุมัติ" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "status_update", children: "อัปเดตสถานะ" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "approval_request", children: "ขออนุมัติ" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-auto", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เรียงตาม" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "newest", children: "ใหม่ล่าสุด" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "oldest", children: "เก่าที่สุด" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "unread", children: "ยังไม่อ่าน" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Search, { className: "w-12 h-12 text-muted-foreground" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3", children: "ไม่พบการแจ้งเตือนที่ตรงตามเงื่อนไข" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-md mx-auto mb-4", children: "ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูการแจ้งเตือนอื่นๆ" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => {
              setSearchTerm("");
              setFilterType("all");
              setSortBy("newest");
            },
            children: "ล้างตัวกรอง"
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Bell, { className: "w-8 h-8 text-primary" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "ข้อความแจ้งเตือน" }),
            unreadCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "primary", appearance: "light", className: "mt-1", children: [
              unreadCount,
              " รายการใหม่"
            ] })
          ] })
        ] }),
        unreadCount > 0 && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: markAllAsRead,
            children: [
              /* @__PURE__ */ jsx(CheckCheck, { className: "w-4 h-4 mr-2" }),
              "อ่านทั้งหมด"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ",
        getRoleDisplayName(role || "")
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "ค้นหาการแจ้งเตือน...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "pl-10"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [
          /* @__PURE__ */ jsxs(SelectTrigger, { className: "w-full sm:w-auto", children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx(SelectValue, { placeholder: "กรองตามประเภท" })
          ] }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "ทั้งหมด" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "อนุมัติแล้ว" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "ไม่อนุมัติ" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "status_update", children: "อัปเดตสถานะ" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "approval_request", children: "ขออนุมัติ" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-auto", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เรียงตาม" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "newest", children: "ใหม่ล่าสุด" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "oldest", children: "เก่าที่สุด" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "unread", children: "ยังไม่อ่าน" })
          ] })
        ] })
      ] }),
      filteredAndSortedItems.length !== items.length && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
        "แสดง ",
        filteredAndSortedItems.length,
        " จาก ",
        items.length,
        " รายการ"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: paginatedItems.map((n) => /* @__PURE__ */ jsx(
      Card,
      {
        className: `cursor-pointer hover:shadow-lg transition-all duration-200 ${!n.read ? "bg-primary/5" : "bg-background"}`,
        onClick: () => markReadAndGo(n),
        children: /* @__PURE__ */ jsx(CardContent, { className: "px-4 py-3", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              !n.read && /* @__PURE__ */ jsx(Badge, { variant: "primary", appearance: "light", className: "text-xs px-2 py-0.5", children: "ใหม่" }),
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: n.kind === "approved" ? "success" : n.kind === "rejected" ? "destructive" : n.kind === "status_update" ? "info" : "warning",
                  appearance: "light",
                  className: "text-xs px-2 py-0.5",
                  children: n.kind === "approved" ? "อนุมัติแล้ว" : n.kind === "rejected" ? "ไม่อนุมัติ" : n.kind === "status_update" ? "อัปเดตสถานะ" : "ขออนุมัติ"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground font-medium", children: fmt(n.createdAt) })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: `text-base font-semibold mb-3 ${!n.read ? "text-foreground" : "text-muted-foreground"}`, children: n.orderNo ? `#${n.orderNo} - ${n.title}` : n.title }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              "จาก: ",
              n.fromUserName || "ระบบ"
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: getRoleDisplayName(role || "") })
          ] })
        ] }) }) })
      },
      n.id
    )) }),
    filteredAndSortedItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col sm:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "แสดง" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: itemsPerPage,
            onChange: (e) => handleItemsPerPageChange(e.target.value),
            className: "border border-input bg-background rounded-md px-2 py-1 text-sm",
            children: [
              /* @__PURE__ */ jsx("option", { value: 5, children: "5" }),
              /* @__PURE__ */ jsx("option", { value: 10, children: "10" }),
              /* @__PURE__ */ jsx("option", { value: 20, children: "20" }),
              /* @__PURE__ */ jsx("option", { value: 50, children: "50" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "รายการต่อหน้า" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
        "แสดง ",
        startIndex + 1,
        " - ",
        Math.min(endIndex, filteredAndSortedItems.length),
        " จาก ",
        filteredAndSortedItems.length,
        " รายการ"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handlePageChange(currentPage - 1),
            disabled: currentPage === 1,
            children: [
              /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
              "ก่อนหน้า"
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: (() => {
          const pages = [];
          const maxVisiblePages = 5;
          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
          if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }
          if (startPage > 1) {
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === 1 ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(1),
                  className: "w-8 h-8 p-0",
                  children: "1"
                },
                1
              )
            );
            if (startPage > 2) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-2 text-muted-foreground", children: "..." }, "ellipsis1")
              );
            }
          }
          for (let i = startPage; i <= endPage; i++) {
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === i ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(i),
                  className: "w-8 h-8 p-0",
                  children: i
                },
                i
              )
            );
          }
          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-2 text-muted-foreground", children: "..." }, "ellipsis2")
              );
            }
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === totalPages ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(totalPages),
                  className: "w-8 h-8 p-0",
                  children: totalPages
                },
                totalPages
              )
            );
          }
          return pages;
        })() }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handlePageChange(currentPage + 1),
            disabled: currentPage === totalPages,
            children: [
              "ถัดไป",
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
            ]
          }
        )
      ] })
    ] })
  ] });
}

const $$Notifications = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "NotificationsPage", NotificationsPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/NotificationsPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/Bederly/po-app/src/pages/orders/notifications.astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/orders/notifications.astro";
const $$url = "/orders/notifications";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Notifications,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
