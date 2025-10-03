import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import { C as Card, b as CardHeader, c as CardHeading, d as CardToolbar, D as DropdownMenu, e as DropdownMenuTrigger, f as DropdownMenuContent, g as DropdownMenuLabel, h as DropdownMenuSeparator, i as DropdownMenuCheckboxItem, j as CardTable, B as Badge, k as CardFooter, $ as $$MainLayout } from '../../chunks/card_BCFqNZAv.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import React__default, { useState, useMemo, useEffect } from 'react';
import { I as Input, B as Button, s as subscribeAuthAndRole, f as db } from '../../chunks/input_CuwRcyyb.mjs';
import { getDoc, doc, query, collection, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Search, Settings, ChevronDown, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_DVins7mI.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_DMNDlMRd.mjs';
import { S as ScrollArea, a as ScrollBar } from '../../chunks/scroll-area_CEUNibaC.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_B5AV3It3.mjs';
import 'clsx';
import '../../chunks/checkbox_pSuwQxN8.mjs';
import '../../chunks/label_B4e7hkFR.mjs';
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
const createColumns = (role, expanded, processingKeys, drafts, onToggleExpanded, onSaveOrderStatus, onSaveItem, onSetDraft, onGetItemValue) => [
  {
    accessorKey: "orderNo",
    header: "รายการที่",
    cell: ({ row }) => {
      const order = row.original;
      const isOpen = !!expanded[order.id];
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "inline-flex items-center gap-1 h-auto p-0 font-medium",
          onClick: () => onToggleExpanded(order.id),
          children: [
            isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }),
            "#",
            order.orderNo ?? "-"
          ]
        }
      );
    },
    size: 120
  },
  {
    accessorKey: "date",
    header: "วันที่",
    cell: ({ row }) => {
      const order = row.original;
      return /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: order.date || fmtTS(order.createdAt) });
    },
    size: 140
  },
  {
    accessorKey: "requesterName",
    header: "ผู้ขอซื้อ",
    cell: ({ row }) => {
      const requesterName = row.getValue("requesterName");
      const requester = row.original.requester;
      return /* @__PURE__ */ jsx("div", { className: "font-normal", children: requesterName || requester || "-" });
    },
    size: 180
  },
  {
    accessorKey: "totalAmount",
    header: "ยอดรวม",
    cell: ({ row }) => {
      const order = row.original;
      const total = order.totalAmount ?? order.total ?? 0;
      return /* @__PURE__ */ jsxs("div", { className: "tabular-nums", children: [
        total.toLocaleString("th-TH"),
        " บาท"
      ] });
    },
    size: 140
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return getStatusBadge(status);
    },
    size: 140
  },
  {
    id: "actions",
    header: "การดำเนินการ",
    cell: ({ row }) => {
      const order = row.original;
      if (role === "procurement") {
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: order.status,
              onValueChange: (value) => onSaveOrderStatus(order, value),
              disabled: processingKeys.has(order.id),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกสถานะ…" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: ORDER_STATUS_OPTIONS.map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x.value, children: x.label }, x.value)) })
              ]
            }
          ),
          processingKeys.has(order.id) && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" })
        ] });
      }
      return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" });
    },
    size: 200
  }
];
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
  const [columnVisibility, setColumnVisibility] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const columns = useMemo(() => createColumns(
    role,
    expanded,
    processingKeys,
    drafts,
    onToggleExpanded,
    onSaveOrderStatus), [role, expanded, processingKeys, drafts, onToggleExpanded, onSaveOrderStatus, onSaveItem, onSetDraft, onGetItemValue]);
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const search = searchTerm.toLowerCase();
    return data.filter(
      (order) => order.requesterName?.toLowerCase().includes(search) || order.requester?.toLowerCase().includes(search) || order.id.toLowerCase().includes(search) || order.orderNo?.toString().includes(search)
    );
  }, [data, searchTerm]);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);
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
  }, [searchTerm]);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center p-12", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "ml-4 text-lg", children: "โหลดข้อมูลใบสั่งซื้อ..." })
    ] });
  }
  if (data.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center p-12", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "ไม่พบข้อมูลใบสั่งซื้อ" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "ยังไม่มีใบสั่งซื้อในระบบ" })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "border-b", children: [
      /* @__PURE__ */ jsx(CardHeading, { className: "text-lg sm:text-xl", children: "รายการใบขอซื้อ" }),
      /* @__PURE__ */ jsx(CardToolbar, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 sm:flex-none", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "ค้นหา...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "pl-8 w-full sm:w-48 md:w-64 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "w-full sm:w-auto", children: [
            /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4 mr-2" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "คอลัมน์" }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "คอลัมน์" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
            /* @__PURE__ */ jsx(DropdownMenuLabel, { children: "แสดงคอลัมน์" }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            columns.map((column) => /* @__PURE__ */ jsx(
              DropdownMenuCheckboxItem,
              {
                checked: columnVisibility[column.accessorKey || column.id || ""] !== false,
                onCheckedChange: (checked) => setColumnVisibility((prev) => ({
                  ...prev,
                  [column.accessorKey || column.id || ""]: checked
                })),
                children: column.header
              },
              column.accessorKey || column.id
            ))
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(CardTable, { children: /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[400px] sm:h-[500px] md:h-[600px]", children: [
      /* @__PURE__ */ jsxs(Table, { className: "min-w-[800px]", children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "w-[100px] sm:w-[120px] text-xs sm:text-sm", children: "รายการที่" }),
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
                    "#",
                    order.orderNo ?? "-"
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
                    disabled: processingKeys.has(order.id),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[140px] sm:w-[180px] text-xs sm:text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกสถานะ…" }) }),
                      /* @__PURE__ */ jsx(SelectContent, { children: ORDER_STATUS_OPTIONS.map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x.value, children: x.label }, x.value)) })
                    ]
                  }
                ),
                processingKeys.has(order.id) && /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" })
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs sm:text-sm", children: "—" }) })
            ] }),
            isOpen && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "bg-muted/50 p-2 sm:p-4", children: /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-background overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold border-b", children: "รายการสินค้า" }),
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
                        disabled: processingKeys.has(`${order.id}:${idx}`),
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
                        disabled: processingKeys.has(`${order.id}:${idx}`),
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
                        disabled: processingKeys.has(`${order.id}:${idx}`),
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
    return /* @__PURE__ */ jsxs("div", { className: "w-full py-10 text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto text-primary" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 text-muted-foreground", children: "กำลังโหลดข้อมูล…" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    err && /* @__PURE__ */ jsx(Alert, { className: "mb-4", variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: err }) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-2 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-primary" }),
        "รายการใบขอซื้อ"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: role === "procurement" ? "สำหรับฝ่ายจัดซื้อ – เปลี่ยนสถานะใบ + จัดประเภท/สถานะของแต่ละรายการ" : role === "supervisor" ? "สำหรับหัวหน้างาน – ดูรายการใบขอซื้อทั้งหมด" : "รายการใบขอซื้อทั้งหมด" })
    ] }),
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
