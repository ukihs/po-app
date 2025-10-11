import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_BP4slHKI.mjs';
import 'kleur/colors';
import { C as Card, v as CardContent, B as Badge, g as getDisplayOrderNumber, A as useNotifications, E as useNotificationsLoading, F as useNotificationsError, G as useNotificationsStore, l as useRole, u as useUser, H as useUnreadCount, $ as $$MainLayout } from '../../chunks/card_yyT4zhPw.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import React__default, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Bell, CheckCheck, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { A as Alert, a as AlertDescription, B as Button, I as Input } from '../../chunks/alert_JioKFGew.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_DOMUTCC4.mjs';
import { E as Empty, a as EmptyHeader, b as EmptyMedia, c as EmptyTitle, d as EmptyDescription, e as EmptyContent } from '../../chunks/empty_aUNL12Sy.mjs';
export { renderers } from '../../renderers.mjs';

const formatDate = /* @__PURE__ */ (() => {
  const cache = /* @__PURE__ */ new Map();
  return (ts) => {
    if (!ts?.toDate) return "";
    const timestamp = ts.toDate().getTime();
    const cacheKey = timestamp.toString();
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const formatted = ts.toDate().toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "medium"
    });
    cache.set(cacheKey, formatted);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1e3);
    return formatted;
  };
})();
const NotificationCard = React__default.memo(({
  notification,
  onMarkReadAndGo,
  formatDate: formatDate2,
  currentUserUid
}) => {
  const n = notification;
  const isUnread = currentUserUid ? !n.readBy?.includes(currentUserUid) : false;
  return /* @__PURE__ */ jsx(
    Card,
    {
      className: `cursor-pointer hover:shadow-lg transition-all duration-200 ${isUnread ? "bg-primary/5" : "bg-background"}`,
      onClick: () => onMarkReadAndGo(n),
      children: /* @__PURE__ */ jsx(CardContent, { className: "px-3 sm:px-4 py-3", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 sm:gap-3", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 flex-wrap", children: [
            isUnread && /* @__PURE__ */ jsx(Badge, { variant: "primary", appearance: "light", className: "text-xs px-1.5 sm:px-2 py-0.5", children: "ใหม่" }),
            /* @__PURE__ */ jsx(
              Badge,
              {
                variant: n.kind === "approved" ? "success" : n.kind === "rejected" ? "destructive" : n.kind === "status_update" ? "info" : "warning",
                appearance: "light",
                className: "text-xs px-1.5 sm:px-2 py-0.5",
                children: n.kind === "approved" ? "อนุมัติแล้ว" : n.kind === "rejected" ? "ไม่อนุมัติ" : n.kind === "status_update" ? "อัปเดตสถานะ" : "ขออนุมัติ"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground/70 font-normal", children: formatDate2(n.createdAt) })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: `text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${isUnread ? "text-foreground" : "text-muted-foreground"}`, children: n.orderNo ? `${n.title} (${getDisplayOrderNumber({ orderNo: n.orderNo, date: n.createdAt?.toDate?.()?.toISOString().split("T")[0] || "" })})` : n.title }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground flex-wrap", children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          "จากคุณ ",
          n.fromUserName || "ระบบ"
        ] }) })
      ] }) }) })
    }
  );
});
function NotificationsPage() {
  const notifications = useNotifications();
  const loading = useNotificationsLoading();
  const error = useNotificationsError();
  const { markAsRead, markAllAsRead } = useNotificationsStore();
  const role = useRole();
  const user = useUser();
  const unreadCount = useUnreadCount(user?.uid);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const searchTerms = useMemo(() => {
    if (!searchTerm) return null;
    return searchTerm.toLowerCase().trim();
  }, [searchTerm]);
  const filteredAndSortedItems = useMemo(() => {
    if (!notifications.length) return [];
    let filtered = notifications;
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.kind === filterType);
    }
    if (searchTerms) {
      filtered = filtered.filter((item) => {
        const title = item.title.toLowerCase();
        const message = item.message?.toLowerCase() || "";
        const fromUser = item.fromUserName?.toLowerCase() || "";
        const orderNumber = item.orderNo ? getDisplayOrderNumber({
          orderNo: item.orderNo,
          date: item.createdAt?.toDate?.()?.toISOString().split("T")[0] || ""
        }).toLowerCase() : "";
        return title.includes(searchTerms) || message.includes(searchTerms) || fromUser.includes(searchTerms) || orderNumber.includes(searchTerms);
      });
    }
    filtered.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      if (sortBy === "newest") {
        return timeB - timeA;
      } else if (sortBy === "oldest") {
        return timeA - timeB;
      } else if (sortBy === "unread") {
        const aRead = user?.uid ? a.readBy?.includes(user.uid) : false;
        const bRead = user?.uid ? b.readBy?.includes(user.uid) : false;
        if (aRead === bRead) return timeB - timeA;
        return aRead ? 1 : -1;
      }
      return timeB - timeA;
    });
    return filtered;
  }, [notifications, searchTerms, filterType, sortBy]);
  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedItems.length / itemsPerPage),
    [filteredAndSortedItems.length, itemsPerPage]
  );
  const paginatedItems = useMemo(
    () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredAndSortedItems.slice(startIndex, endIndex);
    },
    [filteredAndSortedItems, currentPage, itemsPerPage]
  );
  const markReadAndGo = async (n) => {
    try {
      if (user?.uid && !n.readBy?.includes(user.uid)) {
        await markAsRead(n.id, user.uid);
      }
      const basePath = role === "procurement" ? "/orders/list" : "/orders/tracking";
      const navigateTo = n.orderId ? `${basePath}#order-${n.orderId}` : basePath;
      import('../../chunks/client_BUDSSnj2.mjs').then(({ navigate }) => navigate(navigateTo)).catch(() => {
        window.location.href = navigateTo;
      });
    } catch (e) {
      console.error(e);
      const basePath = role === "procurement" ? "/orders/list" : "/orders/tracking";
      const navigateTo = n.orderId ? `${basePath}#order-${n.orderId}` : basePath;
      import('../../chunks/client_BUDSSnj2.mjs').then(({ navigate }) => navigate(navigateTo)).catch(() => {
        window.location.href = navigateTo;
      });
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
  if (error && /requires an index/i.test(error)) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold", children: "เกิดข้อผิดพลาดในการโหลดข้อมูล" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm mt-2", children: [
          error,
          /* @__PURE__ */ jsx("br", {}),
          "ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง"
        ] })
      ] })
    ] }) });
  }
  if (!notifications.length) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(Empty, { children: /* @__PURE__ */ jsxs(EmptyHeader, { children: [
      /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(Bell, { className: "w-6 h-6" }) }),
      /* @__PURE__ */ jsx(EmptyTitle, { children: "ยังไม่มีการแจ้งเตือน" }),
      /* @__PURE__ */ jsx(EmptyDescription, { children: "การแจ้งเตือนต่างๆ เกี่ยวกับการอนุมัติใบขอซื้อและอัปเดตสถานะจะแสดงที่นี่" })
    ] }) }) });
  }
  if (!filteredAndSortedItems.length && notifications.length > 0) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [
          /* @__PURE__ */ jsx(Bell, { className: "w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl sm:text-2xl font-bold", children: "ข้อความแจ้งเตือน" }),
            unreadCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "primary", appearance: "light", className: "mt-1 text-xs sm:text-sm", children: [
              unreadCount,
              " รายการใหม่"
            ] })
          ] })
        ] }),
        unreadCount > 0 && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => {
              if (user?.uid) {
                markAllAsRead(user.uid);
              }
            },
            className: "w-full sm:w-auto",
            size: "sm",
            children: [
              /* @__PURE__ */ jsx(CheckCheck, { className: "w-4 h-4 mr-2" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "อ่านทั้งหมด" }),
              /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "อ่านแล้วทั้งหมด" })
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mb-6 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-[240px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "ค้นหาการแจ้งเตือน",
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
      /* @__PURE__ */ jsxs(Empty, { children: [
        /* @__PURE__ */ jsxs(EmptyHeader, { children: [
          /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(Search, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsx(EmptyTitle, { children: "ไม่พบการแจ้งเตือนที่ตรงตามเงื่อนไข" }),
          /* @__PURE__ */ jsx(EmptyDescription, { children: "ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูการแจ้งเตือนอื่นๆ" })
        ] }),
        /* @__PURE__ */ jsx(EmptyContent, { children: /* @__PURE__ */ jsx(
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
        ) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4 sm:mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [
        /* @__PURE__ */ jsx(Bell, { className: "w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl sm:text-2xl font-bold", children: "ข้อความแจ้งเตือน" }),
          unreadCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "primary", appearance: "light", className: "mt-1 text-xs sm:text-sm", children: [
            unreadCount,
            " รายการใหม่"
          ] })
        ] })
      ] }),
      unreadCount > 0 && /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: () => {
            if (user?.uid) {
              markAllAsRead(user.uid);
            }
          },
          className: "w-full sm:w-auto",
          size: "sm",
          children: [
            /* @__PURE__ */ jsx(CheckCheck, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "อ่านทั้งหมด" }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "อ่านแล้วทั้งหมด" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-[280px]", children: [
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
      filteredAndSortedItems.length !== notifications.length && /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground", children: [
        "แสดง ",
        filteredAndSortedItems.length,
        " จาก ",
        notifications.length,
        " รายการ"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: paginatedItems.map((n) => /* @__PURE__ */ jsx(
      NotificationCard,
      {
        notification: n,
        onMarkReadAndGo: markReadAndGo,
        formatDate,
        currentUserUid: user?.uid
      },
      n.id
    )) }),
    filteredAndSortedItems.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "แสดง" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: itemsPerPage,
            onChange: (e) => handleItemsPerPageChange(e.target.value),
            className: "border border-input bg-background rounded-md px-2 py-1 text-xs sm:text-sm",
            children: [
              /* @__PURE__ */ jsx("option", { value: 5, children: "5" }),
              /* @__PURE__ */ jsx("option", { value: 10, children: "10" }),
              /* @__PURE__ */ jsx("option", { value: 20, children: "20" }),
              /* @__PURE__ */ jsx("option", { value: 50, children: "50" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "รายการต่อหน้า" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground", children: [
        "แสดง ",
        (currentPage - 1) * itemsPerPage + 1,
        " - ",
        Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length),
        " จาก ",
        filteredAndSortedItems.length,
        " รายการ"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "text-xs h-7 sm:h-8",
            onClick: () => handlePageChange(currentPage - 1),
            disabled: currentPage === 1,
            children: [
              /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3 h-3 sm:w-4 sm:h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ก่อนหน้า" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 sm:gap-1", children: (() => {
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
                  className: "w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
                  children: "1"
                },
                1
              )
            );
            if (startPage > 2) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground", children: "..." }, "ellipsis1")
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
                  className: "w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
                  children: i
                },
                i
              )
            );
          }
          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground", children: "..." }, "ellipsis2")
              );
            }
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === totalPages ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(totalPages),
                  className: "w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
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
            className: "text-xs h-7 sm:h-8",
            onClick: () => handlePageChange(currentPage + 1),
            disabled: currentPage === totalPages,
            children: [
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ถัดไป" }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 sm:w-4 sm:h-4" })
            ]
          }
        )
      ] })
    ] }) })
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
