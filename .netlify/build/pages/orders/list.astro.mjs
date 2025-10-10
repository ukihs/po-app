import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_BP4slHKI.mjs';
import 'kleur/colors';
import { g as getDisplayOrderNumber, C as Card, a as CardHeader, c as CardTable, B as Badge, d as CardFooter, u as useUser, l as useRole, m as useIsLoading, x as useOrders, y as useOrdersLoading, z as useOrdersError, $ as $$MainLayout } from '../../chunks/card_0XYoxqwD.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import React__default, { useState, useMemo, useEffect } from 'react';
import { I as Input, B as Button, A as Alert, a as AlertDescription, b as AlertIcon, c as AlertTitle, d as db } from '../../chunks/alert_JioKFGew.mjs';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Search, ChevronDown, ChevronRight, Loader2, ChevronLeft, FileText } from 'lucide-react';
import { E as Empty, a as EmptyHeader, b as EmptyMedia, c as EmptyTitle, d as EmptyDescription, e as EmptyContent } from '../../chunks/empty_aUNL12Sy.mjs';
import { RiInformationFill, RiSpam3Fill, RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_DOMUTCC4.mjs';
import { S as ScrollArea, a as ScrollBar } from '../../chunks/scroll-area_BjEhz3jP.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_Xu5j_Ieu.mjs';
import { parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { D as DatePickerPresets } from '../../chunks/date-picker-presets_6zJ_WFdU.mjs';
import { C as COLLECTIONS } from '../../chunks/constants_Db4py-1P.mjs';
export { renderers } from '../../renderers.mjs';

const ITEM_CATEGORIES = ["วัตถุดิบ", "Software/Hardware", "เครื่องมือ", "วัสดุสิ้นเปลือง"];
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
const getStatusBadge = (status) => {
  switch (status) {
    case "pending":
      return /* @__PURE__ */ jsx(Badge, { variant: "warning", appearance: "light", children: STATUS_TH[status] });
    case "approved":
      return /* @__PURE__ */ jsx(Badge, { variant: "success", appearance: "light", children: STATUS_TH[status] });
    case "rejected":
      return /* @__PURE__ */ jsx(Badge, { variant: "destructive", appearance: "light", children: STATUS_TH[status] });
    case "in_progress":
      return /* @__PURE__ */ jsx(Badge, { variant: "info", appearance: "light", children: STATUS_TH[status] });
    case "delivered":
      return /* @__PURE__ */ jsx(Badge, { variant: "success", appearance: "light", children: STATUS_TH[status] });
    default:
      return /* @__PURE__ */ jsx(Badge, { variant: "secondary", appearance: "light", children: STATUS_TH[status] });
  }
};
const ITEM_STATUS_G1 = ["จัดซื้อ", "ของมาส่ง", "ส่งมอบของ", "สินค้าเข้าคลัง"];
const ITEM_STATUS_G2 = ["จัดซื้อ", "ของมาส่ง", "ส่งมอบของ"];
const getItemStatusOptions = (category) => category === "วัตถุดิบ" ? ITEM_STATUS_G1 : ITEM_STATUS_G2;
const fmtTS = (ts) => ts?.toDate ? ts.toDate().toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
function OrdersDataTable({
  data,
  loading,
  role,
  expanded,
  processingKeys,
  drafts,
  onToggleExpanded,
  onSaveOrderStatus,
  onSaveItem,
  onSetDraft,
  onGetItemValue
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState(void 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const filteredData = useMemo(() => {
    let filtered = data;
    if (customDateRange) {
      const range = customDateRange;
      if (range.from) {
        filtered = filtered.filter((order) => {
          try {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : order.date ? parseISO(order.date) : null;
            if (!orderDate) return false;
            const from = startOfDay(range.from);
            const to = range.to ? endOfDay(range.to) : endOfDay(range.from);
            return isWithinInterval(orderDate, { start: from, end: to });
          } catch (error) {
            console.error("Date filter error:", error);
            return false;
          }
        });
      }
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNumber = order.orderNo ? getDisplayOrderNumber({
          orderNo: order.orderNo,
          date: order.date || order.createdAt?.toDate?.()?.toISOString().split("T")[0] || ""
        }).toLowerCase() : "";
        return order.requesterName?.toLowerCase().includes(search) || order.requester?.toLowerCase().includes(search) || order.id.toLowerCase().includes(search) || order.orderNo?.toString().includes(search) || orderNumber.includes(search);
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    return filtered;
  }, [data, searchTerm, statusFilter, customDateRange]);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);
  const orderNumbers = useMemo(() => {
    const numbers = {};
    paginatedData.forEach((order) => {
      numbers[order.id] = getDisplayOrderNumber(order);
    });
    return numbers;
  }, [paginatedData]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };
  React__default.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customDateRange]);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "border-b", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 sm:flex-none", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "ค้นหาใบขอซื้อ",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-auto", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "สถานะทั้งหมด" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "สถานะทั้งหมด" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "รออนุมัติ" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "อนุมัติแล้ว" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "ไม่อนุมัติ" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "in_progress", children: "กำลังดำเนินการ" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "delivered", children: "ได้รับแล้ว" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        DatePickerPresets,
        {
          date: customDateRange,
          onDateChange: (date) => setCustomDateRange(date),
          placeholder: "ช่วงวันที่",
          className: "w-full sm:w-auto",
          numberOfMonths: 2
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(CardTable, { children: /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[400px] sm:h-[500px] md:h-[600px]", children: [
      /* @__PURE__ */ jsxs(Table, { className: "min-w-[800px]", children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "w-[100px] sm:w-[120px] text-xs sm:text-sm", children: "เลขที่ใบขอซื้อ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[120px] sm:w-[140px] text-xs sm:text-sm", children: "วันที่" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[140px] sm:w-[180px] text-xs sm:text-sm", children: "ผู้ขอซื้อ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[120px] sm:w-[140px] text-xs sm:text-sm", children: "ยอดรวม" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[120px] sm:w-[140px] text-xs sm:text-sm", children: "สถานะ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-[160px] sm:w-[200px] text-xs sm:text-sm", children: "การดำเนินการ" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: paginatedData.map((order) => {
          const isOpen = !!expanded[order.id];
          return /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
            /* @__PURE__ */ jsxs(TableRow, { className: "hover", children: [
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "inline-flex items-center gap-1 h-auto p-0 font-semibold text-sm sm:text-base",
                  onClick: () => onToggleExpanded(order.id),
                  children: [
                    isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" }),
                    orderNumbers[order.id] || "PR000"
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "text-muted-foreground text-xs sm:text-sm", children: order.date || fmtTS(order.createdAt) }) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "font-normal text-xs sm:text-sm", children: order.requesterName || order.requester || "-" }) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "tabular-nums text-xs sm:text-sm", children: [
                (order.totalAmount ?? order.total ?? 0).toLocaleString("th-TH"),
                " บาท"
              ] }) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "text-xs sm:text-sm", children: getStatusBadge(order.status) }) }),
              /* @__PURE__ */ jsx(TableCell, { children: role === "procurement" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: order.status,
                    onValueChange: (value) => onSaveOrderStatus(order, value),
                    disabled: processingKeys.has(order.id) || order.status === "rejected",
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[140px] sm:w-[180px] text-xs sm:text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกสถานะ…" }) }),
                      /* @__PURE__ */ jsx(SelectContent, { children: ORDER_STATUS_OPTIONS.map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x.value, children: x.label }, x.value)) })
                    ]
                  }
                ),
                processingKeys.has(order.id) && /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" })
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs sm:text-sm", children: "—" }) })
            ] }),
            isOpen && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "bg-muted/30 p-2 sm:p-4", children: /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold border-b bg-muted/50", children: "รายการสินค้า" }),
              /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { className: "min-w-[600px]", children: [
                /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
                  /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "รายละเอียด" }),
                  /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "จำนวน" }),
                  /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "ราคาต่อหน่วย" }),
                  /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "รวมทั้งสิ้น" }),
                  /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "ประเภทสินค้า" }),
                  /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "สถานะรายการ" }),
                  role === "procurement" && /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm" })
                ] }) }),
                /* @__PURE__ */ jsx(TableBody, { children: (order.items || []).map((it, idx) => {
                  const val = onGetItemValue(order, idx);
                  const options = getItemStatusOptions(val.category);
                  return /* @__PURE__ */ jsxs(TableRow, { children: [
                    /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: it.description || "-" }),
                    /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: it.quantity ?? "-" }),
                    /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: it.amount != null ? Number(it.amount).toLocaleString("th-TH") : "-" }),
                    /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: it.lineTotal != null ? Number(it.lineTotal).toLocaleString("th-TH") : "-" }),
                    /* @__PURE__ */ jsx(TableCell, { children: role === "procurement" ? /* @__PURE__ */ jsxs(
                      Select,
                      {
                        value: val.category,
                        onValueChange: (value) => onSetDraft(order.id, idx, { category: value }),
                        disabled: processingKeys.has(`${order.id}:${idx}`) || order.status === "rejected",
                        children: [
                          /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs sm:text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกประเภท…" }) }),
                          /* @__PURE__ */ jsx(SelectContent, { children: ITEM_CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, children: c }, c)) })
                        ]
                      }
                    ) : /* @__PURE__ */ jsx(Badge, { variant: val.category ? "info" : "secondary", appearance: "light", className: "text-xs", children: val.category || "ยังไม่ระบุ" }) }),
                    /* @__PURE__ */ jsx(TableCell, { children: role === "procurement" ? /* @__PURE__ */ jsxs(
                      Select,
                      {
                        value: val.itemStatus,
                        onValueChange: (value) => onSetDraft(order.id, idx, { itemStatus: value }),
                        disabled: processingKeys.has(`${order.id}:${idx}`) || order.status === "rejected",
                        children: [
                          /* @__PURE__ */ jsx(SelectTrigger, { className: "text-xs sm:text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกสถานะ…" }) }),
                          /* @__PURE__ */ jsx(SelectContent, { children: options.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
                        ]
                      }
                    ) : /* @__PURE__ */ jsx(Badge, { variant: val.itemStatus ? "secondary" : "secondary", appearance: "light", className: "text-xs", children: val.itemStatus || "รอดำเนินการ" }) }),
                    role === "procurement" && /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "primary",
                        size: "sm",
                        onClick: () => onSaveItem(order, idx),
                        disabled: processingKeys.has(`${order.id}:${idx}`) || order.status === "rejected",
                        className: "font-normal text-xs sm:text-sm",
                        children: [
                          processingKeys.has(`${order.id}:${idx}`) && /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1" }),
                          "บันทึก"
                        ]
                      }
                    ) })
                  ] }, idx);
                }) })
              ] }) })
            ] }) }) }) })
          ] }, order.id);
        }) })
      ] }),
      /* @__PURE__ */ jsx(ScrollBar, { orientation: "horizontal" })
    ] }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-3 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "แสดง" }),
        /* @__PURE__ */ jsxs(Select, { value: itemsPerPage.toString(), onValueChange: handleItemsPerPageChange, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[70px] sm:w-[80px] h-7 sm:h-8 text-xs sm:text-sm", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "5", children: "5" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "10", children: "10" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "20", children: "20" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "50", children: "50" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "รายการ" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground", children: [
        (currentPage - 1) * itemsPerPage + 1,
        " - ",
        Math.min(currentPage * itemsPerPage, filteredData.length),
        " จาก ",
        filteredData.length
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 sm:gap-1", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handlePageChange(currentPage - 1),
            disabled: currentPage === 1,
            className: "h-7 w-7 sm:h-8 sm:w-8 p-0",
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "ก่อนหน้า" }),
              /* @__PURE__ */ jsx(ChevronLeft, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4" })
            ]
          }
        ),
        (() => {
          const pages = [];
          const maxVisible = 5;
          if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
              pages.push(
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: currentPage === i ? "primary" : "outline",
                    size: "sm",
                    onClick: () => handlePageChange(i),
                    className: "h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm",
                    children: i
                  },
                  i
                )
              );
            }
          } else {
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === 1 ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(1),
                  className: "h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm",
                  children: "1"
                },
                1
              )
            );
            if (currentPage > 3) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground", children: "..." }, "ellipsis1")
              );
            }
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
              if (i !== 1 && i !== totalPages) {
                pages.push(
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: currentPage === i ? "primary" : "outline",
                      size: "sm",
                      onClick: () => handlePageChange(i),
                      className: "h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm",
                      children: i
                    },
                    i
                  )
                );
              }
            }
            if (currentPage < totalPages - 2) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground", children: "..." }, "ellipsis2")
              );
            }
            if (totalPages > 1) {
              pages.push(
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: currentPage === totalPages ? "primary" : "outline",
                    size: "sm",
                    onClick: () => handlePageChange(totalPages),
                    className: "h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm",
                    children: totalPages
                  },
                  totalPages
                )
              );
            }
          }
          return pages;
        })(),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => handlePageChange(currentPage + 1),
            disabled: currentPage === totalPages,
            className: "h-7 w-7 sm:h-8 sm:w-8 p-0",
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "ถัดไป" }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4" })
            ]
          }
        )
      ] })
    ] }) })
  ] });
}

function OrdersListPage() {
  const user = useUser();
  const role = useRole();
  const authLoading = useIsLoading();
  const orders = useOrders();
  const loading = useOrdersLoading();
  const err = useOrdersError();
  const [expanded, setExpanded] = useState({});
  const [processingKeys, setProcessingKeys] = useState(/* @__PURE__ */ new Set());
  const [drafts, setDrafts] = useState({});
  const [alertState, setAlertState] = useState({
    show: false,
    type: "info",
    title: "",
    description: ""
  });
  const showAlert = (message, type = "info", description) => {
    setAlertState({
      show: true,
      type,
      title: message,
      description
    });
    const duration = type === "error" ? 5e3 : 4e3;
    setTimeout(() => {
      setAlertState((prev) => ({ ...prev, show: false }));
    }, duration);
  };
  const getAlertConfig = (type) => {
    switch (type) {
      case "success":
        return {
          variant: "success",
          appearance: "light",
          IconComponent: RiCheckboxCircleFill
        };
      case "error":
        return {
          variant: "destructive",
          appearance: "light",
          IconComponent: RiErrorWarningFill
        };
      case "warning":
        return {
          variant: "warning",
          appearance: "light",
          IconComponent: RiSpam3Fill
        };
      case "info":
      default:
        return {
          variant: "info",
          appearance: "light",
          IconComponent: RiInformationFill
        };
    }
  };
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#order-")) {
      const orderId = hash.replace("#order-", "");
      if (!loading && orders.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`order-${orderId}`);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
            element.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all", "duration-300");
            setExpanded((prev) => ({ ...prev, [orderId]: true }));
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }, 3e3);
            window.history.replaceState(null, "", window.location.pathname);
          }
        }, 500);
      }
    }
  }, [loading, orders]);
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
    if (o.status === "rejected") {
      showAlert("ไม่สามารถแก้ไขรายการสินค้าได้", "error", "ใบขอซื้อที่ถูกไม่อนุมัติแล้วไม่สามารถแก้ไขรายการสินค้าได้");
      return;
    }
    const val = getItemValue(o, idx);
    if (!val.category && !val.itemStatus) {
      showAlert("ยังไม่ได้เลือกประเภท/สถานะ", "error");
      return;
    }
    const key = `${o.id}:${idx}`;
    try {
      setProcessingKeys((s) => new Set(s).add(key));
      const ref = doc(db, COLLECTIONS.ORDERS, o.id);
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
      showAlert("บันทึกรายการสินค้าสำเร็จ", "success");
    } catch (e) {
      console.error(e);
      showAlert("ไม่สามารถบันทึกรายการสินค้าได้", "error", e?.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setProcessingKeys((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  };
  const saveOrderStatus = async (o, next) => {
    if (o.status === "rejected") {
      showAlert("ไม่สามารถแก้ไขสถานะได้", "error", "ใบขอซื้อที่ถูกไม่อนุมัติแล้วไม่สามารถแก้ไขสถานะได้");
      return;
    }
    const key = o.id;
    try {
      setProcessingKeys((s) => new Set(s).add(key));
      await updateDoc(doc(db, COLLECTIONS.ORDERS, o.id), {
        status: next,
        updatedAt: serverTimestamp()
      });
      showAlert("อัปเดตสถานะใบขอซื้อสำเร็จ", "success");
    } catch (e) {
      console.error(e);
      showAlert("ไม่สามารถอัปเดตสถานะได้", "error", e?.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setProcessingKeys((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  };
  if (authLoading || loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground", children: "กำลังโหลดข้อมูล..." })
    ] }) });
  }
  if (!user || !role) {
    return /* @__PURE__ */ jsx("div", { className: "w-full py-10 text-center", children: /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: "กรุณาเข้าสู่ระบบ" }) }) });
  }
  if (orders.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(Empty, { children: [
      /* @__PURE__ */ jsxs(EmptyHeader, { children: [
        /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsx(EmptyTitle, { children: role === "employee" ? "ขณะนี้คุณยังไม่มีใบขอซื้อ" : "ขณะนี้ยังไม่มีใบขอซื้อในระบบ" }),
        /* @__PURE__ */ jsx(EmptyDescription, { children: role === "employee" ? "เริ่มสร้างใบขอซื้อแรกได้เลย!" : "โปรดรอรายการใบขอซื้อจากผู้ใช้งาน หรือสร้างใบขอซื้อด้วยตนเอง" })
      ] }),
      role === "employee" && /* @__PURE__ */ jsx(EmptyContent, { children: /* @__PURE__ */ jsx(
        Button,
        {
          asChild: true,
          variant: "primary",
          className: "w-full sm:w-auto",
          children: /* @__PURE__ */ jsx("a", { href: "/orders/create", children: "สร้างใบขอซื้อ" })
        }
      ) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    alertState.show && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-md", children: /* @__PURE__ */ jsxs(
      Alert,
      {
        variant: getAlertConfig(alertState.type).variant,
        appearance: getAlertConfig(alertState.type).appearance,
        close: true,
        onClose: () => setAlertState((prev) => ({ ...prev, show: false })),
        children: [
          /* @__PURE__ */ jsx(AlertIcon, { children: React__default.createElement(getAlertConfig(alertState.type).IconComponent, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(AlertTitle, { children: alertState.title }),
          alertState.description && /* @__PURE__ */ jsx(AlertDescription, { children: alertState.description })
        ]
      }
    ) }),
    err && /* @__PURE__ */ jsx(Alert, { className: "mb-4", variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: err }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 sm:mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [
      /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl sm:text-2xl font-bold", children: "รายการใบขอซื้อ" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mt-1", children: role === "procurement" ? "เปลี่ยนสถานะใบขอซื้อ กำหนดประเภทและสถานะของแต่ละรายการ" : "รายการใบขอซื้อทั้งหมด" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      OrdersDataTable,
      {
        data: orders,
        loading,
        role,
        expanded,
        processingKeys,
        drafts,
        onToggleExpanded: toggle,
        onSaveOrderStatus: saveOrderStatus,
        onSaveItem: saveOneItem,
        onSetDraft: setDraft,
        onGetItemValue: getItemValue
      }
    )
  ] });
}

const $$List = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E1A\u0E02\u0E2D\u0E0B\u0E37\u0E49\u0E2D" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "OrdersListPage", OrdersListPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/OrdersListPage", "client:component-export": "default" })} ` })}`;
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
